export const createBodyJsonSchema = {
  type: 'object',
  required: ['meetingId'],
  properties: {
    meetingId: { type: 'string' }
  }
}

export const updateBodyJsonSchema = {
  type: 'object',
  required: ['meetingId'],
  properties: {
    meetingId: { type: 'string' }
  }
}

export const routeParamsJsonSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' }
  }
}