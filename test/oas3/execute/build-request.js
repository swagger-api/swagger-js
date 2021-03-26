// https://github.com/swagger-api/swagger-js/issues/1116
import { buildRequest } from '../../../src/execute';

describe('test accept header for oas 3', () => {
  const spec = {
    openapi: '3.0.0',
    servers: [
      {
        url: 'https://test.com/v1',
      },
    ],
    paths: {
      '/getMultiple': {
        get: {
          operationId: 'getMultiple',
          responses: {
            200: {
              content: {
                'application/xml': {
                  schema: {
                    type: 'array',
                    items: 'string',
                  },
                },
                'application/json': {
                  schema: {
                    type: 'array',
                    items: 'string',
                  },
                },
              },
            },
            default: {
              description: 'Unexpected error',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  test('oas 3: should generate accept header according to defined responses', () => {
    const req = buildRequest({
      spec,
      operationId: 'getMultiple',
    });

    expect(req).toEqual({
      url: 'https://test.com/v1/getMultiple',
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        accept: 'application/xml, application/json',
      },
    });
  });

  test('oas 3: should allow to override accept header according to defined responses', () => {
    const req = buildRequest({
      spec,
      operationId: 'getMultiple',
      responseContentType: 'application/xml',
    });

    expect(req).toEqual({
      url: 'https://test.com/v1/getMultiple',
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        accept: 'application/xml',
      },
    });
  });
});
