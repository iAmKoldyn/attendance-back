import {
  createGroup,
  getGroupById,
  updateGroupById,
  deleteGroupById,
  validateGroupData,
  isNameAlreadyInUse
} from '../../controllers/groupController';
import { Counter, Histogram } from 'prom-client';
import { updateBodyJsonSchema, createBodyJsonSchema, routeParamsJsonSchema } from './validation_schemas';

export const groupRequestCounter = new Counter({
  name: 'group_requests_total',
  help: 'Total number of group requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const groupRequestErrors = new Counter({
  name: 'group_request_errors_total',
  help: 'Total number of errors in group requests',
  labelNames: ['endpoint', 'method']
});

export const groupRequestDuration = new Histogram({
  name: 'group_request_duration_seconds',
  help: 'Duration of group requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function(fastify) {
  fastify.post('/', {
    schema: {
      body: createBodyJsonSchema
    }
  }, async (request, reply) => {
    const end = groupRequestDuration.startTimer({ endpoint: '/', method: 'POST' });

    try {
      const validationErrors = validateGroupData(request.body);
      const isNameTaken = await isNameAlreadyInUse(request.body.name);

      if (validationErrors) {
        reply.status(400).send({ error: 'Invalid Data', details: validationErrors });
        groupRequestErrors.inc({ endpoint: '/', method: 'POST' });
        return;
      }

      if (isNameTaken) {
        reply.status(409).send({ error: 'Name is already in use' });
        groupRequestErrors.inc({ endpoint: '/', method: 'POST' });
        return;
      }

      createGroup(request.body);
      reply.status(201).send({ message: 'Created' });
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      groupRequestErrors.inc({ endpoint: '/', method: 'POST' });
      throw error;
    } finally {
      end();
      groupRequestCounter.inc({ endpoint: '/', method: 'POST', status: reply.statusCode.toString() });
    }
  });

  fastify.get('/:id', {
      schema: {
        params: routeParamsJsonSchema
      }
    }, async (request, reply) => {
      const end = groupRequestDuration.startTimer({ endpoint: '/:id', method: 'GET' });

      try {
        const groupId = request.params.id;
        const group = await getGroupById(groupId);

        if (!group) {
          reply.status(404).send({ error: 'Group not found' });
          groupRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
          return;
        }

        reply.status(200).send(group);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        groupRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
        throw error;
      } finally {
        end();
        groupRequestCounter.inc({ endpoint: '/:id', method: 'GET', status: reply.statusCode.toString() });
      }
    });

  fastify.put('/:id', {
    schema: {
      body: updateBodyJsonSchema,
      params: routeParamsJsonSchema
    }
  }, async (request, reply) => {
    const end = groupRequestDuration.startTimer({ endpoint: '/:id', method: 'PUT' });

    try {
      const groupId = request.params.id;
      const groupBody = request.body;
      const nameIsTaken = await isNameAlreadyInUse(request.body.name);

      if (nameIsTaken) {
        reply.status(409).send({ error: 'Name is already in use' });
        groupRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
        return;
      }

      const updatedGroup = await updateGroupById(groupId, groupBody);
      if (!updatedGroup) {
        reply.status(404).send({ error: 'Group not found!!' });
        groupRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
        return;
      }

      reply.status(200).send(updatedGroup);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      groupRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
      throw error;
    } finally {
      end();
      groupRequestCounter.inc({ endpoint: '/:id', method: 'PUT', status: reply.statusCode.toString() });
    }
  });

  fastify.delete('/:id', {
    schema: {
      params: routeParamsJsonSchema
    }
  }, async (request, reply) => {
    const end = groupRequestDuration.startTimer({ endpoint: '/:id', method: 'DELETE' });

    try {
      const groupId = request.params.id;
      const deletedGroup = await deleteGroupById(groupId);

      if (!deletedGroup) {
        reply.status(404).send({ error: 'Group not found' });
        groupRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
        return;
      }

      reply.status(200).send({ message: 'Deleted' });
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      groupRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
      throw error;
    } finally {
      end();
      groupRequestCounter.inc({ endpoint: '/:id', method: 'DELETE', status: reply.statusCode.toString() });
    }
  });
}
