import { authenticationConfig } from '../configs/authentication';
import User, { UserType } from '../models/user';
import Role from '../models/role';
import { Histogram } from 'prom-client';

export const dbOperationDurationAuth = new Histogram({
  name: 'auth_operation_duration_seconds',
  help: 'Duration of authentication operations in seconds',
  labelNames: ['operation', 'entity']
});

export const login = async (data: { email: string; password: string }, fastify) => {
  const end = dbOperationDurationAuth.startTimer({ operation: 'login', entity: 'user' });
  try {
    const checkResult = await checkLoginDetails(data, fastify);
    if (!checkResult.message && checkResult.isPasswordValid) {
      return { status: checkResult.isPasswordValid, user: checkResult.user };
    } else if (checkResult.message) {
      return { status: false, message: checkResult.message };
    } else {
      return { status: false, message: 'Неверный пароль' };
    }
  } finally {
    end();
  }
};

const checkLoginDetails = async (data, fastify) => {
  const end = dbOperationDurationAuth.startTimer({ operation: 'checkLoginDetails', entity: 'user' });
  try {
    const user = await User.findOne({ email: data.email });
    const isPasswordValid = user ? await user.comparePassword(data.password) : false;
    return { email: true, isPasswordValid, user };
  } catch (error) {
    fastify.log.error(error);
    return { email: false, message: 'Пользователя с таким email не найдено' };
  } finally {
    end();
  }
};

export const generateRefreshToken = async (user, fastify): Promise<string> => {
  const end = dbOperationDurationAuth.startTimer({ operation: 'generateRefreshToken', entity: 'user' });
  try {
    const newRefreshToken = fastify.jwt.sign({
      userId: user.userId,
      refreshExpiresIn: authenticationConfig.refreshExpiresIn
    });
    user.refreshToken = newRefreshToken;
    await user.save();
    return newRefreshToken;
  } finally {
    end();
  }
};

export const generateAccessToken = async (user: UserType, fastify): Promise<string> => {
  const end = dbOperationDurationAuth.startTimer({ operation: 'generateAccessToken', entity: 'user' });
  try {
    const role = (await Role.findOne({ users: user })) || (await Role.findOne({ slug: 'student' }));
    const accessToken = fastify.jwt.sign({
      userId: user.userId,
      role: role.slug || 'student',
      expiresIn: authenticationConfig.accessExpiresIn
    });

    return accessToken;
  } finally {
    end();
  }
};

export const generateAuthenticationTokens = async (user, fastify) => {
  const end = dbOperationDurationAuth.startTimer({ operation: 'generateAuthTokens', entity: 'user' });
  try {
    const newRefreshToken = await generateRefreshToken(user, fastify);
    const newAccessToken = await generateAccessToken(user, fastify);
    return { newRefreshToken, newAccessToken };
  } finally {
    end();
  }
};