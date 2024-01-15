import mongoose from 'mongoose';
import { mongoConfig } from './configs/mongo';
import { FastifyInstance } from 'fastify';

export const connect = async (fastify: FastifyInstance): Promise<() => Promise<void>> => {
  await mongoose.connect(mongoConfig.connectURL);

  fastify.log.info('Connected to db');

  return async function (): Promise<void> {
    await mongoose.disconnect();
  };
};
