export const updateBodyJsonSchema = {
  type: 'object',
  required: ['firstname', 'lastname', 'middlename', 'email', 'password'],
  properties: {
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    middlename: { type: 'string' },
    email: { type: 'string', minLength: 5 },
    password: { type: 'string', minLength: 8 }
  }
};

export const createBodyJsonSchema = {
  type: 'object',
  required: ['firstname', 'lastname', 'middlename', 'email', 'password'],
  properties: {
    firstname: { type: 'string' },
    lastname: { type: 'string' },
    middlename: { type: 'string' },
    email: { type: 'string', minLength: 5 },
    password: { type: 'string', minLength: 8 }
  }
};

export const routeParamsJsonSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' }
  }
};
