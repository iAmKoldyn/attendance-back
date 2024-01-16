import Role from '../models/role';
import { Histogram } from 'prom-client';
import fastify from '../server';

export const dbOperationDurationRole = new Histogram({
  name: 'db_operation_duration_seconds_role_db',
  help: 'Duration of database operations in seconds for roles',
  labelNames: ['operation', 'entity']
});

export const redisOperationDurationRole = new Histogram({
  name: 'redis_operation_duration_seconds_role',
  help: 'Duration of Redis operations in seconds for roles',
  labelNames: ['operation', 'entity']
});

export const createRole = async data => {
  const endDb = dbOperationDurationRole.startTimer({ operation: 'create', entity: 'role' });
  const newRole = new Role(data);
  try {
    const savedRole = await newRole.save();
    endDb();
    return savedRole;
  } finally {
    endDb();
  }
};

export const getAllRoles = async () => {
  const endDb = dbOperationDurationRole.startTimer({ operation: 'readAll', entity: 'role' });
  try {
    const roles = await Role.find({}, { _id: 0, __v: 0 });
    endDb();
    return roles;
  } finally {
    endDb();
  }
};

export const getRoleById = async id => {
  const endRedis = redisOperationDurationRole.startTimer({ operation: 'read', entity: 'role' });
  let role = await fastify.redis.get(id);
  if (!role) {
    endRedis();
    const endDb = dbOperationDurationRole.startTimer({ operation: 'read', entity: 'role' });
    role = await Role.findById(id, { _id: 0, __v: 0 });
    if (role) {
      await fastify.redis.set(id, JSON.stringify(role), 'EX', 120);
    }
    endDb();
  } else {
    endRedis();
  }
  return role;
};

export const updateRoleById = async (id, body) => {
  const endDb = dbOperationDurationRole.startTimer({ operation: 'update', entity: 'role' });
  const role = await Role.findByIdAndUpdate(id, body, { new: true });
  const roleStr = JSON.stringify(role);
  const endRedis = redisOperationDurationRole.startTimer({ operation: 'update', entity: 'role' });
  await fastify.redis.set(id, roleStr, 'EX', 120);
  endDb();
  endRedis();
  return role;
};

export const deleteRoleById = async id => {
  const endDb = dbOperationDurationRole.startTimer({ operation: 'delete', entity: 'role' });
  const endRedis = redisOperationDurationRole.startTimer({ operation: 'delete', entity: 'role' });
  await fastify.redis.del(id);
  const role = await Role.findByIdAndRemove(id);
  endDb();
  endRedis();
  return role;
};
