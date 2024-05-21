/* eslint-disable camelcase */
import { toValue } from '@swagger-api/apidom-core';
import { mediaTypes, OpenApi3_1Element } from '@swagger-api/apidom-ns-openapi-3-1';
import { dereferenceApiDOM } from '@swagger-api/apidom-reference/configuration/empty';

import * as jestSetup from '../__utils__/jest.local.setup.js';
import OpenAPI3_1SwaggerClientDereferenceStrategy from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

describe('dereference', () => {
  beforeAll(() => {
    jestSetup.beforeAll();
  });

  afterAll(() => {
    jestSetup.afterAll();
  });

  describe('strategies', () => {
    describe('openapi-3-1-swagger-client', () => {
      describe('Schema Object', () => {
        test('should resolve reference and apply modelPropertyMacro function', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            paths: {
              '/': {
                get: {
                  responses: {
                    200: {
                      content: {
                        'application/json': {
                          schema: {
                            $ref: '#/components/schemas/Foo',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            components: {
              schemas: {
                Foo: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                    },
                    bar: {
                      $ref: '#/components/schemas/Bar',
                    },
                  },
                },
                Bar: {
                  type: 'object',
                },
              },
            },
          });

          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
            dereference: {
              strategies: [
                new OpenAPI3_1SwaggerClientDereferenceStrategy({
                  modelPropertyMacro: (property) => `${property.type}-test`,
                }),
              ],
            },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            paths: {
              '/': {
                get: {
                  responses: {
                    200: {
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              id: {
                                type: 'integer',
                                default: 'integer-test',
                              },
                              bar: {
                                type: 'object',
                                default: 'object-test',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            components: {
              schemas: {
                Bar: { type: 'object' },
                Foo: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      default: 'integer-test',
                    },
                    bar: {
                      type: 'object',
                      default: 'object-test',
                    },
                  },
                },
              },
            },
          });
        });
      });
    });
  });
});
/* eslint-enable camelcase */
