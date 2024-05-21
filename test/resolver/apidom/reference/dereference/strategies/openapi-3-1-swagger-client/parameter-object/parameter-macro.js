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
      describe('Parametr Object', () => {
        test('should resolve reference and apply modelPropertyMacro function', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            paths: {
              '/': {
                get: {
                  operationId: 'test',
                  parameters: [
                    {
                      $ref: '#/components/parameters/Baz',
                    },
                  ],
                },
              },
            },
            components: {
              parameters: {
                Baz: {
                  name: 'baz',
                  in: 'query',
                  schema: {
                    allOf: [{ allOf: [{ allOf: [{ type: 'object' }] }] }],
                  },
                },
              },
            },
          });

          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
            dereference: {
              strategies: [
                new OpenAPI3_1SwaggerClientDereferenceStrategy({
                  parameterMacro: (operation, parameter) =>
                    `${operation.operationId}-${parameter.name}`,
                }),
              ],
            },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            paths: {
              '/': {
                get: {
                  operationId: 'test',
                  parameters: [
                    {
                      name: 'baz',
                      in: 'query',
                      schema: { type: 'object' },
                      default: 'test-baz',
                    },
                  ],
                },
              },
            },
            components: {
              parameters: {
                Baz: {
                  name: 'baz',
                  in: 'query',
                  schema: {
                    type: 'object',
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
