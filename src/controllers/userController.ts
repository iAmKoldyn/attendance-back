import User from '../models/user';
import { Histogram } from 'prom-client';
import fastify from "../server";

export const dbOperationDurationUser = new Histogram({
  name: 'db_operation_duration_seconds_user',
  help: 'Duration of database operations in seconds for users',
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
  const end = dbOperationDurationUser.startTimer({ operation: 'create', entity: 'user' });
  const newUser = new User(data);
  try {
    await newUser.save();
    return newUser;
  } finally {
    end();
  }
};

export const getAllUsers = async () => {
  const end = dbOperationDurationUser.startTimer({ operation: 'readAll', entity: 'user' });
  try {
    return await User.find({}, { _id: 0, __v: 0, refreshToken: false, password_hash: false, password: false });
  } finally {
    end();
  }
};

// export const getUserById = async (id: string) => {
//   const end = dbOperationDurationUser.startTimer({ operation: 'read', entity: 'user' });
//   try {
//
//       return await User.findOne(
//           { userId: id },
//           { _id: 0, __v: 0, refreshToken: false, password_hash: false, password: false }
//       );
//
//   } finally {
//     end();
//   }
// };

export const getUserById = async (id: string) => {
  const end = dbOperationDurationUser.startTimer({ operation: 'read', entity: 'user' });
  try {

    let user = fastify.redis.users.get(id)

    if (!user) {
      let user = await User.findOne(
          { userId: id },
          { _id: 0, __v: 0, refreshToken: false, password_hash: false, password: false }
      );
      await fastify.redis['users'].set(id, JSON.stringify(user), "EX", 20)
    }

    return user
  } finally {
    end();
  }
};

export const updateUserById = async (id: string, body) => {
  const end = dbOperationDurationUser.startTimer({ operation: 'update', entity: 'user' });
  const user = await User.findOne({ userId: id });
  if (!user) {
    end();
    return null;
  }

  try {
    return await User.findByIdAndUpdate(user._id, body, { new: true });
  } finally {
    end();
  }
};

export const deleteUserById = async (id: string) => {
  const end = dbOperationDurationUser.startTimer({ operation: 'delete', entity: 'user' });
  const user = await User.findOne({ userId: id });
  if (!user) {
    end();
    return null;
  }

  try {
    return await User.findByIdAndRemove(user._id);
  } finally {
    end();
  }
};

export const isEmailAlreadyInUse = async (email: string) => {
  const end = dbOperationDurationUser.startTimer({ operation: 'checkEmail', entity: 'user' });
  try {
    const user = await User.findOne({ email });
    return user != null;
  } finally {
    end();
  }
};