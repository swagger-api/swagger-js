/* eslint-disable camelcase */
import { toValue } from '@swagger-api/apidom-core';
import { mediaTypes, OpenApi3_2Element } from '@swagger-api/apidom-ns-openapi-3-2';
import { dereferenceApiDOM } from '@swagger-api/apidom-reference/configuration/empty';

import * as jestSetup from '../__utils__/jest.local.setup.js';
import OpenAPI3_2SwaggerClientDereferenceStrategy from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-2-swagger-client/index.js';

describe('dereference', () => {
  beforeAll(() => {
    jestSetup.beforeAll();
  });

  afterAll(() => {
    jestSetup.afterAll();
  });

  describe('strategies', () => {
    describe('openapi-3-2-swagger-client', () => {
      describe('visitors', () => {
        describe('RootVisitor', () => {
          describe('given mode is not set (default)', () => {
            test('should merge allOf schemas', async () => {
              const spec = OpenApi3_2Element.refract({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: { allOf: [{ type: 'string' }, { maxLength: 10 }] },
                  },
                },
              });
              const result = await dereferenceApiDOM(spec, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

              expect(toValue(result).components.schemas.Cat).toEqual({
                type: 'string',
                maxLength: 10,
              });
            });
          });

          describe('given mode=strict', () => {
            test('should NOT merge allOf schemas', async () => {
              const spec = OpenApi3_2Element.refract({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: { allOf: [{ type: 'string' }, { maxLength: 10 }] },
                  },
                },
              });
              const result = await dereferenceApiDOM(spec, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [new OpenAPI3_2SwaggerClientDereferenceStrategy({ mode: 'strict' })],
                },
              });

              expect(toValue(result).components.schemas.Cat).toEqual({
                allOf: [{ type: 'string' }, { maxLength: 10 }],
              });
            });

            test('should still dereference $refs in strict mode', async () => {
              const spec = OpenApi3_2Element.refract({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: { $ref: '#/components/schemas/Animal' },
                    Animal: { type: 'object' },
                  },
                },
              });
              const result = await dereferenceApiDOM(spec, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [new OpenAPI3_2SwaggerClientDereferenceStrategy({ mode: 'strict' })],
                },
              });

              expect(toValue(result).components.schemas.Cat).toMatchObject({ type: 'object' });
            });
          });

          describe('given modelPropertyMacro is provided', () => {
            test('should apply the macro to schema properties', async () => {
              const spec = OpenApi3_2Element.refract({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    User: {
                      type: 'object',
                      properties: { id: { type: 'integer' } },
                    },
                  },
                },
              });
              const result = await dereferenceApiDOM(spec, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [
                    new OpenAPI3_2SwaggerClientDereferenceStrategy({
                      modelPropertyMacro: (prop) => `${prop.type}-default`,
                    }),
                  ],
                },
              });

              expect(toValue(result).components.schemas.User.properties.id.default).toBe(
                'integer-default'
              );
            });
          });

          describe('given parameterMacro is provided', () => {
            test('should apply the macro to operation parameters', async () => {
              const spec = OpenApi3_2Element.refract({
                openapi: '3.2.0',
                paths: {
                  '/pets': {
                    get: {
                      operationId: 'listPets',
                      parameters: [{ name: 'limit', in: 'query' }],
                      responses: { 200: { description: 'OK' } },
                    },
                  },
                },
              });
              const result = await dereferenceApiDOM(spec, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [
                    new OpenAPI3_2SwaggerClientDereferenceStrategy({
                      parameterMacro: (op, param) => `${op.operationId}-${param.name}`,
                    }),
                  ],
                },
              });

              expect(toValue(result).paths['/pets'].get.parameters[0].default).toBe(
                'listPets-limit'
              );
            });
          });
        });
      });
    });
  });
});
/* eslint-enable camelcase */
