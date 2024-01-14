import {
  createUser,
  getUserById,
  updateUserById,
  deleteUserById,
  isEmailAlreadyInUse
} from '../../controllers/userController';

import { Counter, Histogram } from 'prom-client';
import { createBodyJsonSchema, routeParamsJsonSchema, updateBodyJsonSchema } from './validation_schemas';

export const userRequestCounter = new Counter({
  name: 'user_requests_total',
  help: 'Total number of user requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const userRequestErrors = new Counter({
  name: 'user_request_errors_total',
  help: 'Total number of errors in user requests',
  labelNames: ['endpoint', 'method']
});

export const userRequestDuration = new Histogram({
  name: 'user_request_duration_seconds',
  help: 'Duration of user requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function(fastify) {
  fastify.post('/', {
    schema: {
      body: createBodyJsonSchema,
      params: routeParamsJsonSchema
    }
  }, async (request, reply) => {
    const end = userRequestDuration.startTimer({ endpoint: '/', method: 'POST' });

    try {
      const emailIsTaken = await isEmailAlreadyInUse(request.body.email);
      if (emailIsTaken) {
        reply.status(409).send({ error: 'Email is already in use' });
        userRequestErrors.inc({ endpoint: '/', method: 'POST' });
        return;
      }

      createUser(request.body);
      reply.status(201).send({ message: 'Created' });
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      userRequestErrors.inc({ endpoint: '/', method: 'POST' });
      throw error;
    } finally {
      end();
      userRequestCounter.inc({ endpoint: '/', method: 'POST', status: reply.statusCode.toString() });
    }
  });

  fastify.get('/:id',
    {
      schema: {
        params: routeParamsJsonSchema
      }
    }, async (request, reply) => {
      const end = userRequestDuration.startTimer({ endpoint: '/:id', method: 'GET' });

      try {
        const userId = request.params.id;
        const user = await getUserById(userId);

        if (!user) {
          reply.status(404).send({ error: 'User not found' });
          userRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
          return;
        }

        reply.status(200).send(user);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        userRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
        throw error;
      } finally {
        end();
        userRequestCounter.inc({ endpoint: '/:id', method: 'GET', status: reply.statusCode.toString() });
      }
    });


  fastify.put('/:id', {
    schema: {
      body: updateBodyJsonSchema,
      params: routeParamsJsonSchema
    }
  }, async (request, reply) => {
    const end = userRequestDuration.startTimer({ endpoint: '/:id', method: 'PUT' });

    try {
      const userId = request.params.id;
      const userBody = request.body;
      const isEmailTaken = await isEmailAlreadyInUse(userBody.email);

      const updatedUser = await updateUserById(userId, userBody);
      if (!updatedUser) {
        reply.status(404).send({ error: 'User not found' });
        userRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
        return;
      }

      reply.status(200).send(updatedUser);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      userRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
      throw error;
    } finally {
      end();
      userRequestCounter.inc({ endpoint: '/:id', method: 'PUT', status: reply.statusCode.toString() });
    }
  });

  fastify.delete('/:id',  {
    schema: {
      params: routeParamsJsonSchema
    }
  }, async (request, reply) => {
    const end = userRequestDuration.startTimer({ endpoint: '/:id', method: 'DELETE' });

    try {
      const userId = request.params.id;
      const deletedUser = await deleteUserById(userId);

      if (!deletedUser) {
        reply.status(404).send({ error: 'User not found' });
        userRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
        return;
      }

      reply.status(200).send({ message: 'Deleted' });
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      userRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
      throw error;
    } finally {
      end();
      userRequestCounter.inc({ endpoint: '/:id', method: 'DELETE', status: reply.statusCode.toString() });
    }
  });
}
