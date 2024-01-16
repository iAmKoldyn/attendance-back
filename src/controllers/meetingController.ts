import Meeting from '../models/meeting';
import { Histogram } from 'prom-client';
import fastify from '../server';

export const dbOperationDurationMeeting = new Histogram({
  name: 'db_operation_duration_seconds_meeting_db',
  help: 'Duration of database operations in seconds for meetings',
  labelNames: ['operation', 'entity']
});

export const redisOperationDurationMeeting = new Histogram({
  name: 'redis_operation_duration_seconds_meeting',
  help: 'Duration of Redis operations in seconds for meetings',
  labelNames: ['operation', 'entity']
});

type Meeting = {
  title?: string;
  timeFrom?: string;
  timeTo?: string;
  author?: string;
  group?: string;
};

export const createMeeting = async data => {
  const endDb = dbOperationDurationMeeting.startTimer({ operation: 'create', entity: 'meeting' });
  const newMeeting = new Meeting(data);
  try {
    const savedMeeting = await newMeeting.save();
    endDb();
    return savedMeeting;
  } finally {
    endDb();
  }
};

export const getAllMeetings = async () => {
  const endDb = dbOperationDurationMeeting.startTimer({ operation: 'readAll', entity: 'meeting' });
  try {
    const meetings = await Meeting.find({}, { _id: 0, __v: 0 });
    endDb();
    return meetings;
  } finally {
    endDb();
  }
};

export const getMeetingById = async id => {
  const endRedis = redisOperationDurationMeeting.startTimer({ operation: 'read', entity: 'meeting' });
  let meeting = await fastify.redis.get(id);
  if (!meeting) {
    endRedis();
    const endDb = dbOperationDurationMeeting.startTimer({ operation: 'read', entity: 'meeting' });
    meeting = await Meeting.findOne({ meetingId: id }, { _id: 0, __v: 0 });
    if (meeting) {
      await fastify.redis.set(id, JSON.stringify(meeting), 'EX', 120);
    }
    endDb();
  } else {
    endRedis();
  }
  return meeting;
};

export const updateMeetingById = async (id, body) => {
  const endDb = dbOperationDurationMeeting.startTimer({ operation: 'update', entity: 'meeting' });
  let meeting = await Meeting.findOne({ meetingId: id });
  if (!meeting) {
    endDb();
    return null;
  }
  meeting = await Meeting.findByIdAndUpdate(meeting._id, body, { new: true });
  const meetingStr = JSON.stringify(meeting);
  const endRedis = redisOperationDurationMeeting.startTimer({ operation: 'update', entity: 'meeting' });
  await fastify.redis.set(id, meetingStr, 'EX', 120);
  endDb();
  endRedis();
  return meeting;
};

export const deleteMeetingById = async id => {
  const endDb = dbOperationDurationMeeting.startTimer({ operation: 'delete', entity: 'meeting' });
  const meeting = await Meeting.findOne({ meetingId: id });
  if (!meeting) {
    endDb();
    return null;
  }
  await Meeting.findByIdAndRemove(meeting._id);
  const endRedis = redisOperationDurationMeeting.startTimer({ operation: 'delete', entity: 'meeting' });
  await fastify.redis.del(id);
  endDb();
  endRedis();
  return meeting;
};
