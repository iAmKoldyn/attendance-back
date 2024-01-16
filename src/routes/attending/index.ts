import {
  createAttending,
  getAttendingById,
  updateAttendingById,
  deleteAttendingById
} from '../../controllers/attendingController';
import Meeting from '../../models/meeting';
import User from '../../models/user';

import { Counter, Histogram } from 'prom-client';
import { createBodyJsonSchema, routeParamsJsonSchema, updateBodyJsonSchema } from './validation_schemas';

export const attendingRequestCounter = new Counter({
  name: 'attending_requests_total',
  help: 'Total number of attending requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const attendingRequestErrors = new Counter({
  name: 'attending_request_errors_total',
  help: 'Total number of errors in attending requests',
  labelNames: ['endpoint', 'method']
});

export const attendingRequestDuration = new Histogram({
  name: 'attending_request_duration_seconds',
  help: 'Duration of attending requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function (fastify): Promise<void> {
  fastify.post(
    '/',
    {
      schema: {
        body: createBodyJsonSchema
      }
    },
    async (request, reply) => {
      const end = attendingRequestDuration.startTimer({ endpoint: '/', method: 'POST' });

      try {
        const joined_at = new Date().toISOString();
        const user = await User.findOne({ userId: request.userId });
        const meeting = await Meeting.findOne({ meetingId: request.body.meetingId });
        const userId = user._id;
        const meetingId = meeting._id;

        createAttending({ joined_at: joined_at, user: userId, meeting: meetingId });
        reply.status(201).send({ message: 'Created' });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        attendingRequestErrors.inc({ endpoint: '/', method: 'POST' });
        throw error;
      } finally {
        end();
        attendingRequestCounter.inc({ endpoint: '/', method: 'POST', status: reply.statusCode.toString() });
      }
    }
  );

  fastify.get(
    '/:id',
    {
      schema: {
        params: routeParamsJsonSchema
      }
    },
    async (request, reply) => {
      const end = attendingRequestDuration.startTimer({ endpoint: '/:id', method: 'GET' });

      try {
        const attendingId = request.params.id;
        const attending = await getAttendingById(attendingId);

        if (!attending) {
          reply.status(404).send({ error: 'Attending not found' });
          attendingRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
          return;
        }

        reply.status(200).send(attending);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        attendingRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
        throw error;
      } finally {
        end();
        attendingRequestCounter.inc({ endpoint: '/:id', method: 'GET', status: reply.statusCode.toString() });
      }
    }
  );

  fastify.put(
    '/:id',
    {
      schema: {
        body: updateBodyJsonSchema,
        params: routeParamsJsonSchema
      }
    },
    async (request, reply) => {
      const end = attendingRequestDuration.startTimer({ endpoint: '/:id', method: 'PUT' });

      try {
        const attendingId = request.params.id;
        const attendingBody = request.body;

        const updatedAttending = await updateAttendingById(attendingId, attendingBody);

        if (!updatedAttending) {
          reply.status(404).send({ error: 'Attending not found' });
          attendingRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
          return;
        }

        reply.status(200).send(updatedAttending);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        attendingRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
        throw error;
      } finally {
        end();
        attendingRequestCounter.inc({ endpoint: '/:id', method: 'PUT', status: reply.statusCode.toString() });
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: routeParamsJsonSchema
      }
    },
    async (request, reply) => {
      const end = attendingRequestDuration.startTimer({ endpoint: '/:id', method: 'DELETE' });

      try {
        const attendingId = request.params.id;
        const deletedAttending = await deleteAttendingById(attendingId);

        if (!deletedAttending) {
          reply.status(404).send({ error: 'Attending not found' });
          attendingRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
          return;
        }

        reply.status(200).send({ message: 'Deleted' });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        attendingRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
        throw error;
      } finally {
        end();
        attendingRequestCounter.inc({ endpoint: '/:id', method: 'DELETE', status: reply.statusCode.toString() });
      }
    }
  );
}
