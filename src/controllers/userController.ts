import User from '../models/user';
import { Histogram } from 'prom-client';

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

export const getUserById = async (id: string) => {
  const end = dbOperationDurationUser.startTimer({ operation: 'read', entity: 'user' });
  try {
    return await User.findOne(
      { userId: id },
      { _id: 0, __v: 0, refreshToken: false, password_hash: false, password: false }
    );
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

export const validateUserData = userData => {
  const errors: User = {};

  if (!userData.firstname) {
    errors.firstname = 'First name is required';
  }
  if (!userData.lastname) {
    errors.lastname = 'Last name is required';
  }
  if (!userData.middlename) {
    errors.middlename = 'Middle name is required';
  }
  if (!userData.email) {
    errors.email = 'Email is required';
  }
  if (!userData.password) {
    errors.password = 'Password is required';
  } else if (userData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  if (userData.email && userData.email.length < 5) {
    errors.email = 'Email must be at least 5 characters long';
  }

  return Object.keys(errors).length === 0 ? null : errors;
};

export const isEmailAlreadyInUse = async (email: string) => {
  const end = dbOperationDurationUser.startTimer({ operation: 'checkEmail', entity: 'user' });
  try {
    const user = await User.findOne({ email });
    return !!user;
  } finally {
    end();
  }
};