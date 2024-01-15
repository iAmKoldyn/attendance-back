import { authenticationConfig } from '../../configs/authentication';
import {
  generateAccessToken,
  generateAuthenticationTokens,
  generateRefreshToken,
  login
} from '../../controllers/authController';
import { createUser, isEmailAlreadyInUse } from '../../controllers/userController';
import User from '../../models/user';

import { Counter, Histogram } from 'prom-client';
import { loginBodyJsonSchema, refreshHeadersJsonSchema, registerBodyJsonSchema } from './validation_schemas';

export const authRequestCounter = new Counter({
  name: 'auth_requests_total',
  help: 'Total number of authentication requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const authRequestErrors = new Counter({
  name: 'auth_request_errors_total',
  help: 'Total number of errors in authentication requests',
  labelNames: ['endpoint', 'method']
});

export const authRequestDuration = new Histogram({
  name: 'auth_request_duration_seconds',
  help: 'Duration of authentication requests in seconds',
  labelNames: ['endpoint', 'method']
});

// export const outboundRequestCounter = new Counter({
//   name: 'outbound_requests_total',
//   help: 'Total number of outbound requests made',
//   labelNames: ['destination']
// });

export default async function (fastify): Promise<void> {
  fastify.post(
    '/register',
    {
      schema: {
        body: registerBodyJsonSchema
      }
    },
    async (request, reply) => {
      const end = authRequestDuration.startTimer({ endpoint: '/register', method: 'POST' });

      try {
        const { email, lastname, firstname, middlename, password } = request.body;
        if (await isEmailAlreadyInUse(email)) {
          reply.status(422).send({ error: `User with email: ${email} already exists` });
        }
        const newUser = await createUser({ email, lastname, firstname, middlename, password });
        const newAuthenticationTokens = await generateAuthenticationTokens(newUser, fastify);

        reply.status(200).send({
          newAccessToken: newAuthenticationTokens.newAccessToken,
          newRefreshToken: newAuthenticationTokens.newRefreshToken,
          accessExpiresIn: authenticationConfig.accessExpiresIn,
          refreshExpiresIn: authenticationConfig.refreshExpiresIn
        });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        authRequestErrors.inc({ endpoint: '/register', method: 'POST' });
        throw error;
      } finally {
        end();
        authRequestCounter.inc({ endpoint: '/register', method: 'POST', status: reply.statusCode.toString() });
      }
    }
  );

  fastify.post(
    '/login',
    {
      schema: {
        body: loginBodyJsonSchema
      }
    },
    async (request, reply) => {
      const end = authRequestDuration.startTimer({ endpoint: '/login', method: 'POST' });

      try {
        const { email, password } = request.body;
        const loginResult = await login({ email, password }, fastify);

        if (!loginResult.status) {
          reply.status(401).send({ error: loginResult.message });
          authRequestErrors.inc({ endpoint: '/login', method: 'POST' });
          return;
        }

        const newAuthenticationTokens = await generateAuthenticationTokens(loginResult.user, fastify);

        reply.status(200).send({
          newAccessToken: newAuthenticationTokens.newAccessToken,
          newRefreshToken: newAuthenticationTokens.newRefreshToken,
          accessExpiresIn: authenticationConfig.accessExpiresIn,
          refreshExpiresIn: authenticationConfig.refreshExpiresIn
        });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        authRequestErrors.inc({ endpoint: '/login', method: 'POST' });
        throw error;
      } finally {
        end();
        authRequestCounter.inc({ endpoint: '/login', method: 'POST', status: reply.statusCode.toString() });
      }
    }
  );

  fastify.post(
    '/refresh',
    {
      schema: {
        headers: refreshHeadersJsonSchema
      }
    },
    async (request, reply) => {
      const end = authRequestDuration.startTimer({ endpoint: '/refresh', method: 'POST' });

      try {
        const refreshToken = request.headers.refreshToken;
        const user = await User.findOne({ refreshToken });

        if (!user) {
          reply.status(401).send({ error: 'Invalid refresh token' });
          authRequestErrors.inc({ endpoint: '/refresh', method: 'POST' });
          return;
        }

        await generateRefreshToken(user, fastify);
        const newAccessToken = await generateAccessToken(user, fastify);

        reply.status(200).send({ newAccessToken });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        authRequestErrors.inc({ endpoint: '/refresh', method: 'POST' });
        throw error;
      } finally {
        end();
        authRequestCounter.inc({ endpoint: '/refresh', method: 'POST', status: reply.statusCode.toString() });
      }
    }
  );
}
