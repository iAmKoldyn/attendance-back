import User from '../models/user';
import { Histogram } from 'prom-client';
import fastify from '../server';

export const dbOperationDurationUser = new Histogram({
  name: 'db_operation_duration_seconds_user_db',
  help: 'Duration of database operations in seconds for users',
  labelNames: ['operation', 'entity']
});

export const redisOperationDurationUser = new Histogram({
  name: 'redis_operation_duration_seconds_user',
  help: 'Duration of Redis operations in seconds for users',
  labelNames: ['operation', 'entity']
});

type User = {
  firstname?: string;
  lastname?: string;
  middlename?: string;
  email?: string;
  password?: string;
};

export const createUser = async data => {
  const endDb = dbOperationDurationUser.startTimer({ operation: 'create', entity: 'user' });
  const newUser = new User(data);
  try {
    await newUser.save();
    endDb();
    return newUser;
  } finally {
    endDb();
  }
};

export const getAllUsers = async () => {
  const endDb = dbOperationDurationUser.startTimer({ operation: 'readAll', entity: 'user' });
  try {
    const users = await User.find({}, { _id: 0, __v: 0, refreshToken: false, password_hash: false, password: false });
    endDb();
    return users;
  } finally {
    endDb();
  }
};

export const getUserById = async (id: string) => {
  const endRedis = redisOperationDurationUser.startTimer({ operation: 'read', entity: 'user' });
  let user = await fastify.redis.get(id);
  if (!user) {
    endRedis();
    const endDb = dbOperationDurationUser.startTimer({ operation: 'read', entity: 'user' });
    user = await User.findOne(
      { userId: id },
      { _id: 0, __v: 0, refreshToken: false, password_hash: false, password: false }
    );
    if (user) {
      await fastify.redis.set(id, JSON.stringify(user), 'EX', 120);
    }
    endDb();
  } else {
    endRedis();
  }
  return user;
};

export const updateUserById = async (id: string, body) => {
  const endDb = dbOperationDurationUser.startTimer({ operation: 'update', entity: 'user' });
  let endRedis;

  let user = await User.findOne({ userId: id });
  if (!user) {
    endDb();
    return null;
  }

  try {
    user = await User.findByIdAndUpdate(user._id, body, { new: true });
    const userStr = JSON.stringify(user);
    endRedis = redisOperationDurationUser.startTimer({ operation: 'update', entity: 'user' });
    await fastify.redis.set(id, userStr, 'EX', 120);
    endDb();
    endRedis();
    return user;
  } finally {
    endDb();
    if (endRedis) endRedis();
  }
};

export const deleteUserById = async (id: string) => {
  const endDb = dbOperationDurationUser.startTimer({ operation: 'delete', entity: 'user' });
  const endRedis = redisOperationDurationUser.startTimer({ operation: 'delete', entity: 'user' });
  await fastify.redis.del(id);
  const user = await User.findOne({ userId: id });
  if (!user) {
    endDb();
    return null;
  }

  try {
    await User.findByIdAndRemove(user._id);
    endDb();
    endRedis();
    return user;
  } finally {
    endDb();
    endRedis();
  }
};

export const isEmailAlreadyInUse = async (email: string) => {
  const endDb = dbOperationDurationUser.startTimer({ operation: 'checkEmail', entity: 'user' });
  try {
    const user = await User.findOne({ email });
    endDb();
    return user != null;
  } finally {
    endDb();
  }
};
