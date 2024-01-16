import Attending from '../models/attending';
import { Histogram } from 'prom-client';
import fastify from "../server";

export const dbOperationDurationAttending = new Histogram({
  name: 'db_operation_duration_seconds_attending',
  help: 'Duration of database operations in seconds for attendings',
  labelNames: ['operation', 'entity']
});

type Attending = {
  meeting?: string;
  user?: string;
  joined_at?: string;
};

export const createAttending = async data => {
  const end = dbOperationDurationAttending.startTimer({ operation: 'create', entity: 'attending' });
  const newAttending = new Attending(data);
  try {
    return await newAttending.save();
  } finally {
    end();
  }
};

export const getAllAttendings = async () => {
  const end = dbOperationDurationAttending.startTimer({ operation: 'readAll', entity: 'attending' });
  try {
    return await Attending.find({}, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};

export const getAttendingById = async id => {
  const end = dbOperationDurationAttending.startTimer({ operation: 'read', entity: 'attending' });
  try {
    let attending = await fastify.redis.get(id)
    if (!attending) {
      await Attending.findOne({ attendingId: id }, { _id: 0, __v: 0 });
      await fastify.redis.set(id, attending, 'EX', 120)
    }

    return attending
  } finally {
    end();
  }
};

export const updateAttendingById = async (id, body) => {
  const end = dbOperationDurationAttending.startTimer({ operation: 'update', entity: 'attending' });

  let attending = await Attending.findOne({ attendingId: id });
  if (!attending) {
    end();
    return null;
  }

  try {
    attending = await Attending.findByIdAndUpdate(attending._id, body, { new: true });
    let attendingStr = JSON.stringify(attending, ['meeting', 'user', 'joined_at', 'attendingId'])
    await fastify.redis.set(id, attendingStr, 'EX', 120)
    return attending
  } finally {
    end();
  }
};

export const deleteAttendingById = async id => {
  const end = dbOperationDurationAttending.startTimer({ operation: 'delete', entity: 'attending' });
  await fastify.redis.del(id)
  const attending = await Attending.findOne({ attendingId: id });
  if (!attending) {
    end();
    return null;
  }

  try {
    return await Attending.findByIdAndRemove(attending._id);
  } finally {
    end();
  }
};
