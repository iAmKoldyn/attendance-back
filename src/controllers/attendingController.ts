import Attending from '../models/attending';
import { Histogram } from 'prom-client';
import fastify from '../server';

export const dbOperationDurationAttending = new Histogram({
  name: 'db_operation_duration_seconds_attending_db',
  help: 'Duration of database operations in seconds for attendings',
  labelNames: ['operation', 'entity']
});

export const redisOperationDurationAttending = new Histogram({
  name: 'redis_operation_duration_seconds_attending',
  help: 'Duration of Redis operations in seconds for attendings',

  labelNames: ['operation', 'entity']
});

type Attending = {
  meeting?: string;
  user?: string;
  joined_at?: string;
};

export const createAttending = async data => {
  const endDb = dbOperationDurationAttending.startTimer({ operation: 'create', entity: 'attending' });
  const newAttending = new Attending(data);
  try {
    await newAttending.save();
    endDb();
    return newAttending;
  } finally {
    endDb();
  }
};

export const getAllAttendings = async () => {
  const endDb = dbOperationDurationAttending.startTimer({ operation: 'readAll', entity: 'attending' });
  try {
    const attendings = await Attending.find({}, { _id: 0, __v: 0 });
    endDb();
    return attendings;
  } finally {
    endDb();
  }
};

export const getAttendingById = async id => {
  const endDb = dbOperationDurationAttending.startTimer({ operation: 'read', entity: 'attending' });
  const endRedis = redisOperationDurationAttending.startTimer({ operation: 'read', entity: 'attending' });

  try {
    let attending = await fastify.redis.get(id);
    if (!attending) {
      endRedis();
      attending = await Attending.findOne({ attendingId: id }, { _id: 0, __v: 0 });
      await fastify.redis.set(id, JSON.stringify(attending), 'EX', 120);
      endDb();
    } else {
      endRedis();
    }
    return attending;
  } finally {
    endDb();
    endRedis();
  }
};

export const updateAttendingById = async (id, body) => {
  const endDb = dbOperationDurationAttending.startTimer({ operation: 'update', entity: 'attending' });
  const endRedis = redisOperationDurationAttending.startTimer({ operation: 'update', entity: 'attending' });

  let attending = await Attending.findOne({ attendingId: id });
  if (!attending) {
    endDb();
    return null;
  }

  try {
    attending = await Attending.findByIdAndUpdate(attending._id, body, { new: true });
    const attendingStr = JSON.stringify(attending);
    await fastify.redis.set(id, attendingStr, 'EX', 120);
    endDb();
    endRedis();
    return attending;
  } finally {
    endDb();
    endRedis();
  }
};

export const deleteAttendingById = async id => {
  const endDb = dbOperationDurationAttending.startTimer({ operation: 'delete', entity: 'attending' });
  const endRedis = redisOperationDurationAttending.startTimer({ operation: 'delete', entity: 'attending' });

  try {
    await fastify.redis.del(id);
    const attending = await Attending.findOne({ attendingId: id });
    if (!attending) {
      endDb();
      return null;
    }
    await Attending.findByIdAndRemove(attending._id);
    endDb();
    endRedis();
    return attending;
  } finally {
    endDb();
    endRedis();
  }
};
