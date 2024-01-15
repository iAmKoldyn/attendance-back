import { getAllUsers } from '../../controllers/userController';
import { Counter, Histogram } from 'prom-client';

export const usersRequestCounter = new Counter({
  name: 'users_requests_total',
  help: 'Total number of user requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const usersRequestErrors = new Counter({
  name: 'users_request_errors_total',
  help: 'Total number of errors in user requests',
  labelNames: ['endpoint', 'method']
});

export const usersRequestDuration = new Histogram({
  name: 'users_request_duration_seconds',
  help: 'Duration of user requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function (fastify): Promise<void> {
  fastify.get('/', async (request, reply) => {
    const end = usersRequestDuration.startTimer({ endpoint: '/', method: 'GET' });

    try {
      const users = await getAllUsers();
      reply.status(200).send(users);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      usersRequestErrors.inc({ endpoint: '/', method: 'GET' });
      throw error;
    } finally {
      end();
      usersRequestCounter.inc({ endpoint: '/', method: 'GET', status: reply.statusCode.toString() });
    }
  });
}
