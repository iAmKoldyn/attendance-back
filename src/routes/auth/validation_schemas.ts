export const registerBodyJsonSchema = {
  type: 'object',
  required: ['email', 'lastname', 'firstname', 'middlename', 'password'],
  properties: {
    email: { type: 'string' },
    lastname: { type: 'string' },
    firstname: { type: 'string' },
    middlename: { type: 'string' },
    password: { type: 'string' }
  }
}

export const loginBodyJsonSchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string' },
    password: { type: 'string' }
  }
}

export const refreshHeadersJsonSchema = {
  type: 'object',
  properties: {
    'refreshToken': { type: 'string' }
  },
  required: ['refreshToken']
}
