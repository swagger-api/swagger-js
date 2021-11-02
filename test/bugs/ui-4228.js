// https://github.com/swagger-api/swagger-ui/issues/4228

import Swagger from '../../src/index.js';

const spec = {
  paths: {
    '/product/{productId}': {
      get: {
        operationId: 'Get',
        produces: ['application/json'],
        responses: {
          200: {
            description: 'Ok',
            schema: {
              $ref: '#/definitions/ProductModel',
            },
          },
        },
        security: [],
        parameters: [
          {
            in: 'path',
            name: 'productId',
            required: true,
            format: 'double',
            type: 'number',
          },
        ],
      },
    },
  },
  definitions: {
    Props: {
      properties: {
        height: {
          type: 'number',
          format: 'double',
        },
      },
      required: ['height'],
      type: 'object',
    },
    ProductModel: {
      properties: {
        properties: {
          $ref: '#/definitions/Props',
        },
      },
      required: ['properties'],
      type: 'object',
    },
  },
};

test('should resolve "properties" property name in model definition correctly', async () => {
  const res = await Swagger.resolve({
    spec,
  });

  expect(res).toEqual({
    errors: [],
    spec: {
      $$normalized: true,
      definitions: {
        ProductModel: {
          properties: {
            properties: {
              $$ref: '#/definitions/Props',
              properties: {
                height: {
                  format: 'double',
                  type: 'number',
                },
              },
              required: ['height'],
              type: 'object',
            },
          },
          required: ['properties'],
          type: 'object',
        },
        Props: {
          properties: {
            height: {
              format: 'double',
              type: 'number',
            },
          },
          required: ['height'],
          type: 'object',
        },
      },
      paths: {
        '/product/{productId}': {
          get: {
            __originalOperationId: 'Get',
            operationId: 'Get',
            parameters: [
              {
                format: 'double',
                in: 'path',
                name: 'productId',
                required: true,
                type: 'number',
              },
            ],
            produces: ['application/json'],
            responses: {
              200: {
                description: 'Ok',
                schema: {
                  $$ref: '#/definitions/ProductModel',
                  properties: {
                    properties: {
                      $$ref: '#/definitions/Props',
                      properties: {
                        height: {
                          format: 'double',
                          type: 'number',
                        },
                      },
                      required: ['height'],
                      type: 'object',
                    },
                  },
                  required: ['properties'],
                  type: 'object',
                },
              },
            },
            security: [],
          },
        },
      },
    },
  });
});
