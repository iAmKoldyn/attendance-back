import { generateQR } from './../../utils/qr/index';
import {
  createMeeting,
  getMeetingById,
  updateMeetingById,
  deleteMeetingById
} from '../../controllers/meetingController';
import User from '../../models/user';
import Group from '../../models/group';
import { Counter, Histogram } from 'prom-client';
import {
  createBodyJsonSchema,
  qrCodeHeadersJsonSchema,
  queryStringJsonSchema,
  routeParamsJsonSchema,
  updateBodyJsonSchema
} from './validation_schemas';

export const meetingRequestCounter = new Counter({
  name: 'meeting_requests_total',
  help: 'Total number of meeting requests',
  labelNames: ['endpoint', 'method', 'status']
});

export const meetingRequestErrors = new Counter({
  name: 'meeting_request_errors_total',
  help: 'Total number of errors in meeting requests',
  labelNames: ['endpoint', 'method']
});

export const meetingRequestDuration = new Histogram({
  name: 'meeting_request_duration_seconds',
  help: 'Duration of meeting requests in seconds',
  labelNames: ['endpoint', 'method']
});

export default async function (fastify): Promise<void> {
  fastify.post(
    '/',
    {
      schema: {
        body: createBodyJsonSchema,
        querystring: queryStringJsonSchema
      }
    },
    async (request, reply) => {
      const end = meetingRequestDuration.startTimer({ endpoint: '/', method: 'POST' });

      try {
        const body = request.body;
        const timeFrom = new Date(body.timeFrom).toISOString();
        body.teacherIds = body.teacherIds.concat(request.userId);

        const teacherIds = await User.find({ userId: body.teacherIds }).select('_id');
        const groupIds = await Group.find({ groupId: body.groupIds }).select('_id');

        const meeting = await createMeeting({
          timeFrom: timeFrom,
          timeTo: body.timeTo,
          teachers: teacherIds,
          groups: groupIds
        });
        reply.status(201).send({ meetingId: meeting.meetingId });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        meetingRequestErrors.inc({ endpoint: '/', method: 'POST' });
        throw error;
      } finally {
        end();
        meetingRequestCounter.inc({ endpoint: '/', method: 'POST', status: reply.statusCode.toString() });
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
      const end = meetingRequestDuration.startTimer({ endpoint: '/:id', method: 'GET' });

      try {
        const meetingId = request.params.id;
        const meeting = await getMeetingById(meetingId);

        if (!meeting) {
          reply.status(404).send({ error: 'Meeting not found' });
          meetingRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
          return;
        }

        reply.status(200).send(meeting);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        meetingRequestErrors.inc({ endpoint: '/:id', method: 'GET' });
        throw error;
      } finally {
        end();
        meetingRequestCounter.inc({ endpoint: '/:id', method: 'GET', status: reply.statusCode.toString() });
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
      const end = meetingRequestDuration.startTimer({ endpoint: '/:id', method: 'PUT' });

      try {
        const meetingId = request.params.id;
        const meetingBody = request.body;

        const updatedMeeting = await updateMeetingById(meetingId, meetingBody);
        if (!updatedMeeting) {
          reply.status(404).send({ error: 'Meeting not found' });
          meetingRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
          return;
        }

        reply.status(200).send(updatedMeeting);
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        meetingRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
        throw error;
      } finally {
        end();
        meetingRequestCounter.inc({ endpoint: '/:id', method: 'PUT', status: reply.statusCode.toString() });
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        body: createBodyJsonSchema,
        params: routeParamsJsonSchema
      }
    },
    async (request, reply) => {
      const end = meetingRequestDuration.startTimer({ endpoint: '/:id', method: 'DELETE' });

      try {
        const meetingId = request.params.id;
        const deletedMeeting = await deleteMeetingById(meetingId);

        if (!deletedMeeting) {
          reply.status(404).send({ error: 'Meeting not found' });
          meetingRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
          return;
        }

        reply.status(200).send({ message: 'Deleted' });
      } catch (error) {
        reply.status(500).send({ error: 'Internal Server Error' });
        meetingRequestErrors.inc({ endpoint: '/:id', method: 'DELETE' });
        throw error;
      } finally {
        end();
        meetingRequestCounter.inc({ endpoint: '/:id', method: 'DELETE', status: reply.statusCode.toString() });
      }
    }
  );

  fastify.get(
    '/QRCode',
    {
      schema: {
        headers: qrCodeHeadersJsonSchema
      }
    },
    async (request, reply) => {
      const end = meetingRequestDuration.startTimer({ endpoint: '/QRCode', method: 'GET' });

      try {
        const { url } = request.headers;

        if (!url) {
          reply.status(400).send({ error: 'url not loyal' });
          meetingRequestErrors.inc({ endpoint: '/QRCode', method: 'GET' });
          return;
        }

        const genQR = generateQR(url);

        reply
          .status(200)
          .header('Content-Type', 'image/png')
          .send(Buffer.from((await genQR).replace(/^data:image\/(png);base64,/, ''), 'base64'));
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
        meetingRequestErrors.inc({ endpoint: '/QRCode', method: 'GET' });
      } finally {
        end();
        meetingRequestCounter.inc({ endpoint: '/QRCode', method: 'GET', status: reply.statusCode.toString() });
      }
    }
  );
}
