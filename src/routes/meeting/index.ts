import { generateQR } from './../../utils/qr/index';
import {
  createMeeting,
  getMeetingById,
  updateMeetingById,
  deleteMeetingById,
  validateMeetingData
} from '../../controllers/meetingController';
import User from '../../models/user'
import Group from '../../models/group'
import { Counter, Histogram } from 'prom-client';

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

export default async function (fastify) {
  fastify.post('/', async (request, reply) => {
    const end = meetingRequestDuration.startTimer({ endpoint: '/', method: 'POST' });

    try {
      const validationErrors = validateMeetingData(request.body);

      if (validationErrors) {
        reply.status(400).send({ error: 'Invalid Data', details: validationErrors });
        meetingRequestErrors.inc({ endpoint: '/', method: 'POST' });
        return;
      }

      const body = request.body;
      body.timeFrom = new Date().toISOString();
      body.teacherIds = body.teacherIds.concat(request.userId);

      const teachers = await User.find({ userId: body.teacherIds });
      const groups = await Group.find({ userId: body.groupIds });
      const teacherIds = teachers.map(teacher => teacher._id);
      const groupIds = groups.map(group => group._id);

      const meeting = await createMeeting({ timeFrom: body.timeFrom, teachers: teacherIds, groups: groupIds });
      reply.status(201).send({ meetingId: meeting.meetingId });
    } catch (error) {
      reply.status(500).send({ error: 'Internal Server Error' });
      meetingRequestErrors.inc({ endpoint: '/', method: 'POST' });
      throw error;
    } finally {
      end();
      meetingRequestCounter.inc({ endpoint: '/', method: 'POST', status: reply.statusCode.toString() });
    }
  });

  fastify.get('/:id', async (request, reply) => {
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
  });

  fastify.put('/:id', async (request, reply) => {
    const end = meetingRequestDuration.startTimer({ endpoint: '/:id', method: 'PUT' });

    try {
      const meetingId = request.params.id;
      const meetingBody = request.body;
      const validationErrors = validateMeetingData(meetingBody);

      if (validationErrors) {
        reply.status(400).send({ error: 'Invalid Data', details: validationErrors });
        meetingRequestErrors.inc({ endpoint: '/:id', method: 'PUT' });
        return;
      }

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
  });

  fastify.delete('/:id', async (request, reply) => {
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
  });

  fastify.get('/QRCode', async (request, reply) => {
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
  });

}
