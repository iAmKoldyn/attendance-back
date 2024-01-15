import { getAllTeachers } from '../../controllers/teacherController';
import { Counter, Histogram } from 'prom-client';

export const teachersRequestCounter = new Counter({
  name: 'teachers_requests_total',
  help: 'Total number of teacher requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const teachersRequestErrors = new Counter({
  name: 'teachers_request_errors_total',
  help: 'Total number of errors in teacher requests',
  labelNames: ['endpoint', 'method']
});

export const teachersRequestDuration = new Histogram({
  name: 'teachers_request_duration_seconds',
  help: 'Duration of teacher requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function (fastify): Promise<void> {
  fastify.get('/', async (request, reply) => {
    const end = teachersRequestDuration.startTimer({ endpoint: '/', method: 'GET' });

    try {
      const teachers = await getAllTeachers();
      reply.status(200).send(teachers);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      teachersRequestErrors.inc({ endpoint: '/', method: 'GET' });
      throw error;
    } finally {
      end();
      teachersRequestCounter.inc({ endpoint: '/', method: 'GET', status: reply.statusCode.toString() });
    }
  });
}
