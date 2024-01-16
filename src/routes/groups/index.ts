import { getAllGroups } from '../../controllers/groupController';
import { Counter, Histogram } from 'prom-client';

export const groupsRequestCounter = new Counter({
  name: 'groups_requests_total',
  help: 'Total number of group requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const groupsRequestErrors = new Counter({
  name: 'groups_request_errors_total',
  help: 'Total number of errors in group requests',
  labelNames: ['endpoint', 'method']
});

export const groupsRequestDuration = new Histogram({
  name: 'groups_request_duration_seconds',
  help: 'Duration of group requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function (fastify): Promise<void> {
  fastify.get('/', async (request, reply) => {
    const end = groupsRequestDuration.startTimer({ endpoint: '/', method: 'GET' });

    try {
      const groups = await getAllGroups();
      reply.status(200).send(groups);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      groupsRequestErrors.inc({ endpoint: '/', method: 'GET' });
      throw error;
    } finally {
      end();
      groupsRequestCounter.inc({ endpoint: '/', method: 'GET', status: reply.statusCode.toString() });
    }
  });
}
