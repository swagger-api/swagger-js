// https://github.com/swagger-api/swagger-ui/issues/4466
// https://github.com/swagger-api/swagger-ui/issues/4467

import resolveSubtree from '../../src/subtree-resolver/index.js';

const spec = {
  swagger: '2.0',
  info: {
    version: 'v1',
    title: 'Foo',
  },
  basePath: '/v1/foo',
  produces: ['application/json'],
  parameters: {
    testHeader: {
      name: 'test-header',
      description: 'some request header',
      type: 'string',
      in: 'header',
      required: false,
    },
  },
  paths: {
    '/': {
      parameters: [
        {
          $ref: '#/parameters/testHeader',
        },
      ],
      get: {
        responses: {
          200: {
            description: 'Successful response',
            schema: {
              type: 'object',
              properties: {
                bar: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  },
};

test('should resolve test case from UI-4466 and UI-4467 correctly', async () => {
  const res = await resolveSubtree(spec, []);

  expect(res).toEqual({
    errors: [],
    spec: {
      swagger: '2.0',
      $$normalized: true,
      basePath: '/v1/foo',
      info: {
        title: 'Foo',
        version: 'v1',
      },
      parameters: {
        testHeader: {
          description: 'some request header',
          in: 'header',
          name: 'test-header',
          required: false,
          type: 'string',
        },
      },
      paths: {
        '/': {
          get: {
            parameters: [
              {
                $$ref: '#/parameters/testHeader',
                description: 'some request header',
                in: 'header',
                name: 'test-header',
                required: false,
                type: 'string',
              },
            ],
            produces: ['application/json'],
            responses: {
              200: {
                description: 'Successful response',
                schema: {
                  properties: {
                    bar: {
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
            },
          },
          parameters: [
            {
              $$ref: '#/parameters/testHeader',
              description: 'some request header',
              in: 'header',
              name: 'test-header',
              required: false,
              type: 'string',
            },
          ],
        },
      },
      produces: ['application/json'],
    },
  });
});

test('should resolve modified test case where parameter is badly formatted', async () => {
  const invalidSpec = {
    swagger: '2.0',
    info: {
      version: 'v1',
      title: 'Foo',
    },
    basePath: '/v1/foo',
    produces: ['application/json'],
    parameters: {
      testHeader: {
        name: 'test-header',
        description: 'some request header',
        type: 'string',
        in: 'header',
        required: false,
      },
    },
    paths: {
      '/': {
        parameters: [{}],
        get: {
          responses: {
            200: {
              description: 'Successful response',
              schema: {
                type: 'object',
                properties: {
                  bar: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const res = await resolveSubtree(invalidSpec, []);

  expect(res).toEqual({
    errors: [],
    spec: {
      swagger: '2.0',
      $$normalized: true,
      basePath: '/v1/foo',
      info: {
        title: 'Foo',
        version: 'v1',
      },
      parameters: {
        testHeader: {
          description: 'some request header',
          in: 'header',
          name: 'test-header',
          required: false,
          type: 'string',
        },
      },
      paths: {
        '/': {
          get: {
            parameters: [{}],
            produces: ['application/json'],
            responses: {
              200: {
                description: 'Successful response',
                schema: {
                  properties: {
                    bar: {
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
              },
            },
          },
          parameters: [{}],
        },
      },
      produces: ['application/json'],
    },
  });
});
