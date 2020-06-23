// https://github.com/swagger-api/swagger-ui/issues/4466
// https://github.com/swagger-api/swagger-ui/issues/4467

import resolveSubtree from '../../src/subtree-resolver';

const spec = {
  openapi: '3.0.0',
  paths: {
    '/order': {
      post: {
        requestBody: {
          content: {
            'application/json': {
              example: {
                user: {
                  $ref: '#/components/examples/User/value',
                },
                quantity: 1,
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                example: {
                  user: {
                    $ref: '#/components/examples/User/value',
                  },
                  quantity: 1,
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    examples: {
      User: {
        value: {
          id: 1,
          name: 'Sasha',
        },
      },
    },
  },
};

test(
  'should not resolve $ref pointers within OpenAPI RequestBody/Response media type examples',
  async () => {
    const res = await resolveSubtree(spec, []);

    expect(res).toEqual({
      errors: [],
      spec: {
        $$normalized: true,
        openapi: '3.0.0',
        paths: {
          '/order': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    example: {
                      user: {
                        $ref: '#/components/examples/User/value',
                      },
                      quantity: 1,
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: 'OK',
                  content: {
                    'application/json': {
                      example: {
                        user: {
                          $ref: '#/components/examples/User/value',
                        },
                        quantity: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          examples: {
            User: {
              value: {
                id: 1,
                name: 'Sasha',
              },
            },
          },
        },
      },
    });
  },
);
