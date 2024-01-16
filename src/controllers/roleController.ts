import Role from '../models/role';
import { Histogram } from 'prom-client';
import fastify from "../server";

export const dbOperationDurationRole = new Histogram({
  name: 'db_operation_duration_seconds_role',
  help: 'Duration of database operations in seconds for roles',
  labelNames: ['operation', 'entity']
});

export const createRole = async data => {
  const end = dbOperationDurationRole.startTimer({ operation: 'create', entity: 'role' });
  const newRole = new Role(data);
  try {
    return await newRole.save();
  } finally {
    end();
  }
};

export const getAllRoles = async () => {
  const end = dbOperationDurationRole.startTimer({ operation: 'readAll', entity: 'role' });
  try {
    return await Role.find({}, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};

export const getRoleById = async id => {
  const end = dbOperationDurationRole.startTimer({ operation: 'read', entity: 'role' });
  try {
    let role = await fastify.redis.get(id);
    if (!role) {
      role = await Role.findById(id, {_id: 0, __v: 0});
      await fastify.redis.set(id, role, 'EX', 120);
    }

    return role;
  } finally {
    end();
  }
};

export const updateRoleById = async (id, body) => {
  const end = dbOperationDurationRole.startTimer({ operation: 'update', entity: 'role' });
  try {
    let role = await Role.findByIdAndUpdate(id, body, { new: true });
    let roleStr = JSON.stringify(role, ['title', 'slug', 'users', 'roleId'])
    await fastify.redis.set(id, roleStr, 'EX', 120)
    return role
  } finally {
    end();
  }
};

export const deleteRoleById = async id => {
  const end = dbOperationDurationRole.startTimer({ operation: 'delete', entity: 'role' });
  try {
    await fastify.redis.del(id)
    return await Role.findByIdAndRemove(id);
  } finally {
    end();
  }
};
