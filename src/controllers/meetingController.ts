import { ObjectId } from 'mongoose';
import Meeting from '../models/meeting';
import { Histogram } from 'prom-client';

export const dbOperationDurationMeeting = new Histogram({
  name: 'db_operation_duration_seconds_meeting',
  help: 'Duration of database operations in seconds for meetings',
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
  const end = dbOperationDurationMeeting.startTimer({ operation: 'create', entity: 'meeting' });
  const newMeeting = new Meeting(data);
  try {
    return await newMeeting.save();
  } finally {
    end();
  }
};

export const getAllMeetings = async () => {
  const end = dbOperationDurationMeeting.startTimer({ operation: 'readAll', entity: 'meeting' });
  try {
    return await Meeting.find({}, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};

export const getMeetingById = async id => {
  const end = dbOperationDurationMeeting.startTimer({ operation: 'read', entity: 'meeting' });
  try {
    return await Meeting.findOne({ meetingId: id }, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};

export const updateMeetingById = async (id, body) => {
  const end = dbOperationDurationMeeting.startTimer({ operation: 'update', entity: 'meeting' });

  const meeting = await Meeting.findOne({ meetingId: id });
  if (!meeting) {
    end();
    return null;
  }

  try {
    return await Meeting.findByIdAndUpdate(meeting._id, body, { new: true });
  } finally {
    end();
  }
};

export const deleteMeetingById = async id => {
  const end = dbOperationDurationMeeting.startTimer({ operation: 'delete', entity: 'meeting' });

  const meeting = await Meeting.findOne({ meetingId: id });
  if (!meeting) {
    end();
    return null;
  }

  try {
    return await Meeting.findByIdAndRemove(meeting._id);
  } finally {
    end();
  }
};

export const validateMeetingData = meetingData => {
  const errors: Meeting = {};

  return Object.keys(errors).length === 0 ? null : errors;
};
