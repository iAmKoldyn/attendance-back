import Group from '../models/group';
import { Histogram } from 'prom-client';

export const dbOperationDurationGroup = new Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
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
  const end = dbOperationDurationGroup.startTimer({ operation: 'read', entity: 'group' });
  try {
    return await Group.findOne({ groupId: id }, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};

export const updateGroupById = async (id, body) => {
  const end = dbOperationDurationGroup.startTimer({ operation: 'update', entity: 'group' });

  const group = await Group.findOne({ groupId: id });
  if (!group) {
    end();
    return null;
  }

  try {
    return await Group.findByIdAndUpdate(group._id, body, { new: true });
  } finally {
    end();
  }
};

export const deleteGroupById = async id => {
  const end = dbOperationDurationGroup.startTimer({ operation: 'delete', entity: 'group' });

  const group = await Group.findOne({ groupId: id });
  if (!group) {
    end();
    return null;
  }

  try {
    return await Group.findByIdAndRemove(group._id);
  } finally {
    end();
  }
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
