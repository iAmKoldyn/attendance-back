import Group from '../models/group';
import User from '../models/user';
import Meeting from '../models/meeting';
import Attending from '../models/attending';
import Role from '../models/role';

const seed = async (fastify): Promise<void> => {
  const users = await User.find({ firstname: 'Ivan' });
  if (users.length === 0) {
    const user1 = new User({
      firstname: 'Ivan',
      lastname: 'Ivanov',
      middlename: 'Ivanovich',
      password: 'qwerty',
      email: 'ivan_ivanov'
    });
    await user1.save();
    const user2 = new User({
      firstname: 'Alexander',
      lastname: 'Zagar',
      middlename: 'Andreevich',
      password: 'qwerty1',
      email: 'alex_zagar'
    });
    await user2.save();
    const user3 = new User({
      firstname: 'Вася',
      lastname: 'Пупкин',
      middlename: null,
      password: 'abc123',
      email: 'ganibbal'
    });
    await user3.save();
    const teacher = new User({
      firstname: 'Леша',
      lastname: 'Учитель',
      middlename: null,
      password: 'abc123',
      email: 'floppa_poppa'
    });
    await teacher.save();
    const admin = new User({
      firstname: 'Админ',
      lastname: 'Админ',
      middlename: null,
      password: 'admin',
      email: 'admin'
    });
    await admin.save();
    fastify.log.info('users are created');

    const student_role = new Role({
      title: 'Студент',
      slug: 'student',
      users: [user1, user2, user3]
    });
    await student_role.save();
    const teacher_role = new Role({
      title: 'Преподаватель',
      slug: 'teacher',
      users: [teacher]
    });
    await teacher_role.save();
    const admin_role = new Role({
      title: 'Админ',
      slug: 'admin',
      users: [admin]
    });
    await admin_role.save();
    fastify.log.info('roles are created');

    const group = new Group({
      name: 'k0711-21/1',
      users: [user1, user2, user3]
    });
    await group.save();
    fastify.log.info('groups are created');

    const meeting1 = new Meeting({
      title: 'JS разработка',
      timeFrom: new Date(2025, 4, 22, 18, 30, 0),
      timeTo: new Date(2025, 4, 22, 20, 0, 0),
      teachers: teacher,
      groups: [group]
    });
    await meeting1.save();
    const meeting2 = new Meeting({
      title: 'Как писать код красиво',
      timeFrom: new Date(2025, 4, 22, 18, 30, 0),
      timeTo: new Date(2025, 4, 22, 20, 0, 0),
      teachers: teacher,
      groups: [group]
    });
    await meeting2.save();
    fastify.log.info('meetings are created');

    const attendance1 = new Attending({
      meeting: meeting1,
      user: user1,
      joined_at: new Date(2025, 4, 22, 18, 30, 10)
    });
    await attendance1.save();
    const attendance2 = new Attending({
      meeting: meeting1,
      user: user2,
      joined_at: new Date(2025, 4, 22, 18, 35, 21)
    });
    await attendance2.save();
    fastify.log.info('attendances are created');
  }
};

export default seed;
