export const updateBodyJsonSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' }
  }
};

export const createBodyJsonSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' }
  }
};

export const routeParamsJsonSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' }
  }
};
