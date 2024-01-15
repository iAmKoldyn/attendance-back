import autoload from '@fastify/autoload';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
// import * as redis from "redis";
import 'dotenv/config';
import Fastify from 'fastify';
import path from 'node:path';

import { authenticationConfig } from './configs/authentication';
import { loggerConfig } from './configs/logger';
import { connect } from './connect';
import seeds from './seed/seed';
import { authenticateToken } from './utils/auth';

import { Counter, register as promRegister } from 'prom-client';

import { attendingRequestCounter, attendingRequestErrors, attendingRequestDuration } from './routes/attending';
import { attendingsRequestCounter, attendingsRequestErrors, attendingsRequestDuration } from './routes/attendings';
import { authRequestCounter, authRequestErrors, authRequestDuration } from './routes/auth';
import { groupRequestCounter, groupRequestErrors, groupRequestDuration } from './routes/group';
import { groupsRequestCounter, groupsRequestErrors, groupsRequestDuration } from './routes/groups';
import { meetingRequestCounter, meetingRequestErrors, meetingRequestDuration } from './routes/meeting';
import {meetingsRequestCounter, meetingsRequestErrors, meetingsRequestDuration} from './routes/meetings';
import {teachersRequestCounter, teachersRequestErrors, teachersRequestDuration} from './routes/teachers';
import {userRequestCounter, userRequestErrors, userRequestDuration} from './routes/user';
import {usersRequestCounter, usersRequestErrors, usersRequestDuration} from './routes/users';
import { dbOperationDurationGroup } from './controllers/groupController';
import { dbOperationDurationAuth } from './controllers/authController';
import { dbOperationDurationAttending } from './controllers/attendingController';
import { dbOperationDurationRole } from './controllers/roleController';
import { dbOperationDurationTeacher } from './controllers/teacherController';
import { dbOperationDurationUser } from './controllers/userController';
import { dbOperationDurationMeeting } from './controllers/meetingController';

const fastify = Fastify({
  logger: loggerConfig[process.env.SIRIUS_X_ATTENDANCE_PROJECT_STATUS] ?? true,
  pluginTimeout: 20000
});

// import { createClient } from 'redis';
//
// export const client = createClient({
//   password: process.env.REDIS_PASSWORD,
//   socket: {
//     host: "127.0.0.1",
//     port: parseInt(process.env.REDIS_PORT || '6379', 10)
//   }
// });

// let redisClient = redis.createClient({
//   legacyMode: true,
//   socket: {
//     port: 6379,
//     host: '127.0.0.1'
//   }
// })

// redisClient.connect().catch(console.error)
import fastifyRedis from '@fastify/redis';
fastify.register(fastifyRedis, {
  host: '127.0.0.1',
  password: "123",
  port: 6379, // Redis port
  family: 4   // 4 (IPv4) or 6 (IPv6)
})

fastify.get('/metrics', async (request, reply) => {
  const metrics = await promRegister.metrics();
  reply.header('Content-Type', promRegister.contentType);
  reply.send(metrics);
});

//routers
promRegister.registerMetric(authRequestCounter);
promRegister.registerMetric(authRequestErrors);
promRegister.registerMetric(authRequestDuration);

promRegister.registerMetric(attendingRequestCounter);
promRegister.registerMetric(attendingRequestErrors);
promRegister.registerMetric(attendingRequestDuration);

promRegister.registerMetric(attendingsRequestCounter);
promRegister.registerMetric(attendingsRequestErrors);
promRegister.registerMetric(attendingsRequestDuration);

promRegister.registerMetric(groupRequestCounter);
promRegister.registerMetric(groupRequestErrors);
promRegister.registerMetric(groupRequestDuration);

promRegister.registerMetric(groupsRequestCounter);
promRegister.registerMetric(groupsRequestErrors);
promRegister.registerMetric(groupsRequestDuration);

promRegister.registerMetric(meetingRequestCounter);
promRegister.registerMetric(meetingRequestErrors);
promRegister.registerMetric(meetingRequestDuration);

promRegister.registerMetric(meetingsRequestCounter);
promRegister.registerMetric(meetingsRequestErrors);
promRegister.registerMetric(meetingsRequestDuration);

promRegister.registerMetric(teachersRequestCounter);
promRegister.registerMetric(teachersRequestErrors);
promRegister.registerMetric(teachersRequestDuration);

promRegister.registerMetric(userRequestCounter);
promRegister.registerMetric(userRequestErrors);
promRegister.registerMetric(userRequestDuration);

promRegister.registerMetric(usersRequestCounter);
promRegister.registerMetric(usersRequestErrors);
promRegister.registerMetric(usersRequestDuration);

//controllers
promRegister.registerMetric(dbOperationDurationAttending);
promRegister.registerMetric(dbOperationDurationAuth);
promRegister.registerMetric(dbOperationDurationGroup);
promRegister.registerMetric(dbOperationDurationMeeting)
promRegister.registerMetric(dbOperationDurationRole)
promRegister.registerMetric(dbOperationDurationTeacher)
promRegister.registerMetric(dbOperationDurationUser)

fastify.register(fastifyJwt, {
  secret: authenticationConfig.secretKey,
  sign: {
    expiresIn: authenticationConfig.accessExpiresIn
  }
});

fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

fastify.addHook('onRequest', (request, reply, done) => {
  if (request.url === '/metrics') {
    done();
    return;
  }

  if (authenticationConfig.excludedRoutes.includes(request.url) ||
    process.env.SIRIUS_X_ATTENDANCE_PROJECT_STATUS === 'test') {
    done();
    return;
  }

  authenticateToken(request, reply, done, fastify);
});

fastify.setErrorHandler(function (error, request, reply) {
  fastify.log.error(error);
  if (error.code == "FST_ERR_VALIDATION"){
    const status = error.statusCode
    reply.status(status).send({ error: error.message });
  }
  reply.status(500).send({ error: 'Internal Server Error' });
});

const start = () => {
  try {
    fastify.listen({
      port: Number(process.env.SIRIUS_X_ATTENDANCE_PORT) || 3002,
      host: '0.0.0.0'
    });

    fastify.log.info(`listening on port ${Number(process.env.SIRIUS_X_ATTENDANCE_PORT) || 3002}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

const getDisconnectFromDB = connect(fastify);

seeds(fastify);

const graceFulShutDown = async () => {
  await fastify.close();
  const disconnectFromDB = await getDisconnectFromDB;
  await disconnectFromDB();
  process.exit(0);
};

process.on('SIGINT', graceFulShutDown);
process.on('SIGTERM', graceFulShutDown);

fastify.register(autoload, {
  dir: path.join(__dirname, 'routes')
});

fastify.get('/hc', (req, rep) => {
  return { ok: true, engine: 'fastify' };
});

export default fastify;
