// https://github.com/swagger-api/swagger-js/issues/1116
import { buildRequest } from '../../src/execute';

describe('test accept header for swagger 2', () => {
  const spec = {
    host: 'test.com',
    basePath: '/v1',
    schemes: ['https'],
    paths: {
      '/getMultiple': {
        get: {
          operationId: 'getMultiple',
          produces: ['application/xml', 'application/json'],
          responses: {
            200: {
              schema: {
                type: 'array',
                items: 'string',
              },
            },
          },
        },
      },
    },
  };

  test('swagger 2: should generate accept header according to defined responses', () => {
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

  test('swagger 2: should allow to override accept header according to defined responses', () => {
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
