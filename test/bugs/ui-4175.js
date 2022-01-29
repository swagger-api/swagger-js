// https://github.com/swagger-api/swagger-ui/issues/4175

import Swagger from '../../src/index.js';

const spec = {
  definitions: {
    hal: {
      properties: {
        _links: {
          type: 'object',
          additionalProperties: {
            $ref: '#/definitions/link',
          },
        },
      },
      example: {
        _links: {
          self: {
            href: '/exampleApi/things/r12300',
          },
          up: {
            href: '/exampleApi/otherThings',
          },
        },
      },
    },
    link: {
      type: 'object',
      properties: {
        href: {
          type: 'string',
          format: 'uri',
        },
      },
    },
    model: {
      allOf: [{ $ref: '#/definitions/hal' }],
      properties: {
        id: {
          type: 'string',
        },
      },
      example: {
        id: 1,
        _links: {
          self: {
            href: '/exampleApi/models/1',
          },
        },
      },
    },
  },
};

test('should suppress merging examples when composing a schema', async () => {
  const res = await Swagger.resolve({
    spec,
  });
  expect(res.errors).toEqual([]);
  expect(res.spec.definitions.model.example).toEqual({
    id: 1,
    _links: {
      self: {
        href: '/exampleApi/models/1',
      },
    },
  });
});
