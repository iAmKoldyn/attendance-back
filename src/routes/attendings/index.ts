import { getAllAttendings } from '../../controllers/attendingController';
import { Counter, Histogram } from 'prom-client';

export const attendingsRequestCounter = new Counter({
  name: 'attendings_requests_total',
  help: 'Total number of attendings requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const attendingsRequestErrors = new Counter({
  name: 'attendings_request_errors_total',
  help: 'Total number of errors in attendings requests',
  labelNames: ['endpoint', 'method']
});

export const attendingsRequestDuration = new Histogram({
  name: 'attendings_request_duration_seconds',
  help: 'Duration of attendings requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function (fastify) {
  fastify.get('/', async (request, reply) => {
    const end = attendingsRequestDuration.startTimer({ endpoint: '/', method: 'GET' });

    try {
      const attending = await getAllAttendings();
      reply.status(200).send(attending);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      attendingsRequestErrors.inc({ endpoint: '/', method: 'GET' });
      throw error;
    } finally {
      end();
      attendingsRequestCounter.inc({ endpoint: '/', method: 'GET', status: reply.statusCode.toString() });
    }
  });
}