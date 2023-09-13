// https://github.com/swagger-api/swagger-js/issues/1116
import { buildRequest } from '../../../src/execute/index.js';

describe('buildRequest - OAS 3.0.x', () => {
  describe('test accept header', () => {
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

    test('should generate accept header according to defined responses', () => {
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

    test('should allow to override accept header according to defined responses', () => {
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

  describe('given Encoding Object to describe multipart/form-data', () => {
    const spec = {
      openapi: '3.0.0',
      paths: {
        '/upload/': {
          post: {
            tags: ['upload'],
            operationId: 'upload',
            requestBody: {
              required: true,
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      options: {
                        type: 'object',
                        properties: {
                          some_array: {
                            type: 'array',
                            items: {
                              type: 'string',
                            },
                          },
                          max_bar: {
                            type: 'integer',
                            default: 300,
                          },
                        },
                      },
                    },
                  },
                  encoding: {
                    options: {
                      contentType: 'application/json; charset=utf-8',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    test('should attach mime type to appropriate boundaries', async () => {
      const options = {
        some_array: ['string'],
        max_bar: 300,
      };
      const req = buildRequest({
        spec,
        operationId: 'upload',
        requestBody: { options },
      });
      const file = req.formdata.get('options');
      const json = await file.text();

      expect(json).toStrictEqual(JSON.stringify(options));
      expect(file).toBeInstanceOf(File);
      expect(file.valueOf()).toStrictEqual(JSON.stringify(options));
      expect(file.type).toStrictEqual('application/json;charset=utf-8');
    });
  });

  describe('given Encoding Object to describe application/x-www-form-urlencoded', () => {
    const spec = {
      openapi: '3.0.0',
      paths: {
        '/upload/': {
          post: {
            tags: ['upload'],
            operationId: 'upload',
            requestBody: {
              required: true,
              content: {
                'application/x-www-form-urlencoded': {
                  schema: {
                    type: 'object',
                    properties: {
                      options: {
                        type: 'object',
                        properties: {
                          some_array: {
                            type: 'array',
                            items: {
                              type: 'string',
                            },
                          },
                          max_bar: {
                            type: 'integer',
                            default: 300,
                          },
                        },
                      },
                    },
                  },
                  encoding: {
                    options: {
                      contentType: 'application/json; charset=utf-8',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    test('should create proper application/x-www-form-urlencoded request', async () => {
      const options = {
        some_array: ['string'],
        max_bar: 300,
      };
      const req = buildRequest({
        spec,
        operationId: 'upload',
        requestBody: { options },
      });

      expect(req).toEqual({
        url: '/upload/',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        body: 'options=%7B%22some_array%22%3A%5B%22string%22%5D%2C%22max_bar%22%3A300%7D',
      });
    });
  });
});
