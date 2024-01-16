import User, { UserType } from '../models/user';
import Role from '../models/role';
import { Histogram } from 'prom-client';

export const dbOperationDurationTeacher = new Histogram({
  name: 'db_operation_duration_seconds_teacher',
  help: 'Duration of database operations in seconds for teachers',
  labelNames: ['operation', 'entity']
});

type User = {
  firstname?: string;
  lastname?: string;
  middlename?: string;
  email?: string;
  password?: string;
};

export const getAllTeachers = async (): Promise<UserType[]> => {
  const end = dbOperationDurationTeacher.startTimer({ operation: 'readAll', entity: 'teacher' });
  try {
    const teacherRole = await Role.findOne({ slug: 'teacher' });
    return await User.find({ _id: teacherRole.users }, { _id: 0, __v: 0 });
  } finally {
    end();
  }
};
