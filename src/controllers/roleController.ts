import Role from '../models/role';
import { Histogram } from 'prom-client';

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
    return await Role.findById(id, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};

export const updateRoleById = async (id, body) => {
  const end = dbOperationDurationRole.startTimer({ operation: 'update', entity: 'role' });
  try {
    return await Role.findByIdAndUpdate(id, body, { new: true });
  } finally {
    end();
  }
};

export const deleteRoleById = async id => {
  const end = dbOperationDurationRole.startTimer({ operation: 'delete', entity: 'role' });
  try {
    return await Role.findByIdAndRemove(id);
  } finally {
    end();
  }
};
