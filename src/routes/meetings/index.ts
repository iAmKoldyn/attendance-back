import { getAllMeetings } from '../../controllers/meetingController';
import { Counter, Histogram } from 'prom-client';

export const meetingsRequestCounter = new Counter({
  name: 'meetings_requests_total',
  help: 'Total number of meeting requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const meetingsRequestErrors = new Counter({
  name: 'meetings_request_errors_total',
  help: 'Total number of errors in meeting requests',
  labelNames: ['endpoint', 'method']
});

export const meetingsRequestDuration = new Histogram({
  name: 'meetings_request_duration_seconds',
  help: 'Duration of meeting requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function (fastify): Promise<void> {
  fastify.get('/', async (request, reply) => {
    const end = meetingsRequestDuration.startTimer({ endpoint: '/', method: 'GET' });

    try {
      const meetings = await getAllMeetings();
      reply.status(200).send(meetings);
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      meetingsRequestErrors.inc({ endpoint: '/', method: 'GET' });
      throw error;
    } finally {
      end();
      meetingsRequestCounter.inc({ endpoint: '/', method: 'GET', status: reply.statusCode.toString() });
    }
  });
}
