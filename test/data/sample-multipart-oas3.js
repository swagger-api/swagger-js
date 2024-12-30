export default {
  openapi: '3.0.4',
  servers: [
    {
      url: '/api/v1',
    },
  ],
  info: {
    version: '1',
    title: 'MULTI PART TEST - OAS3',
    description: '',
  },
  paths: {
    '/land/content/ViewOfAuthOwner': {
      post: {
        summary: '',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  'hhlContent:sort': {
                    description: '',
                    default: 'id',
                    type: 'string',
                    enum: ['id', 'title'],
                  },
                  'hhlContent:order': {
                    description: '',
                    default: 'desc',
                    type: 'string',
                    enum: ['asc', 'desc'],
                  },
                  'email[]': {
                    description: 'The list of emails.',
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
              encoding: {
                'email[]': {
                  style: 'form',
                  explode: true,
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
    '/land/content/uploadImage': {
      post: {
        summary: 'upload image(s)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  imageId: {
                    description: '',
                    default: 'id',
                    type: 'string',
                  },
                  'images[]': {
                    description: 'The list of files',
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
        },
      },
    },
  },
};
