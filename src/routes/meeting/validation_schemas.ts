export const updateBodyJsonSchema = {
  type: 'object',
  required: ['title', 'timeFrom', 'timeTo', 'groups'],
  properties: {
    title: { type: 'string' },
    timeFrom: { type: 'string' },
    timeTo: { type: 'string' },
    groupIds: {
      type: 'array',
      items: { type: 'string' }
    },
    teacherIds: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

export const createBodyJsonSchema = {
  type: 'object',
  required: ['title', 'timeFrom', 'timeTo', 'groups'],
  properties: {
    title: { type: 'string' },
    timeFrom: { type: 'string' },
    timeTo: { type: 'string' },
    groupIds: {
      type: 'array',
      items: { type: 'string' }
    },
    teacherIds: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

export const routeParamsJsonSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' }
  }
};

export const queryStringJsonSchema = {
  type: 'object',
  required: ['userId'],
  properties: {
    userId: { type: 'string' }
  }
}

export const qrCodeHeadersJsonSchema = {
  type: 'object',
  properties: {
    'url': { type: 'string' }
  },
  required: ['url']
}
