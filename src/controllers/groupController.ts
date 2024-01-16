import Group from '../models/group';
import { Histogram } from 'prom-client';
import fastify from '../server';

export const dbOperationDurationGroup = new Histogram({
  name: 'db_operation_duration_seconds_group_db',
  help: 'Duration of database operations in seconds for groups',
  labelNames: ['operation', 'entity']
});

export const redisOperationDurationGroup = new Histogram({
  name: 'redis_operation_duration_seconds_group',
  help: 'Duration of Redis operations in seconds for groups',
  labelNames: ['operation', 'entity']
});

type Group = {
  name?: string;
  meetings?: string;
  users?: string;
};

export const createGroup = async data => {
  const end = dbOperationDurationGroup.startTimer({ operation: 'create', entity: 'group' });
  const newGroup = new Group(data);
  try {
    return await newGroup.save();
  } finally {
    end();
  }
};

export const getAllGroups = async () => {
  const end = dbOperationDurationGroup.startTimer({ operation: 'readAll', entity: 'group' });
  try {
    return await Group.find({}, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};

export const getGroupById = async id => {
  const endRedis = redisOperationDurationGroup.startTimer({ operation: 'read', entity: 'group' });
  let group = await fastify.redis.get(id);
  if (!group) {
    endRedis();
    const endDb = dbOperationDurationGroup.startTimer({ operation: 'read', entity: 'group' });
    group = await Group.findOne({ groupId: id }, { _id: 0, __v: 0 });
    if (group) {
      await fastify.redis.set(id, JSON.stringify(group), 'EX', 120);
    }
    endDb();
  } else {
    endRedis();
  }
  return group;
};

export const updateGroupById = async (id, body) => {
  const endDb = dbOperationDurationGroup.startTimer({ operation: 'update', entity: 'group' });
  let group = await Group.findOne({ groupId: id });
  if (!group) {
    endDb();
    return null;
  }
  group = await Group.findByIdAndUpdate(group._id, body, { new: true });
  const groupStr = JSON.stringify(group);
  const endRedis = redisOperationDurationGroup.startTimer({ operation: 'update', entity: 'group' });
  await fastify.redis.set(id, groupStr, 'EX', 120);
  endDb();
  endRedis();
  return group;
};

export const deleteGroupById = async id => {
  const endRedis = redisOperationDurationGroup.startTimer({ operation: 'delete', entity: 'group' });
  await fastify.redis.del(id);
  endRedis();
  const endDb = dbOperationDurationGroup.startTimer({ operation: 'delete', entity: 'group' });
  const group = await Group.findOne({ groupId: id });
  if (!group) {
    endDb();
    return null;
  }
  await Group.findByIdAndRemove(group._id);
  endDb();
  return group;
};

export const validateGroupData = groupData => {
  const errors: Group = {};

  if (!groupData.name) {
    errors.name = 'Controller Name is required';
  }
  // if (!groupData.meetings) {
  //   errors.meetings = 'Meetings is required';
  // }
  // if (!groupData.users) {
  //   errors.users = 'Users is required';
  // }

  return Object.keys(errors).length === 0 ? null : errors;
};

export const isNameAlreadyInUse = async name => {
  const group = await Group.findOne({ name });
  return group !== null;
};
