/* eslint-disable camelcase */
import { visit, toValue } from '@swagger-api/apidom-core';
import { OpenApi3_2Element, getNodeType, keyMap } from '@swagger-api/apidom-ns-openapi-3-2';

import AllOfVisitor from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-2-swagger-client/visitors/all-of.js';

const buildOptions = (errors = []) => ({
  dereference: { dereferenceOpts: { errors } },
});

const applyAllOf = (spec, errors = []) => {
  const element = OpenApi3_2Element.refract(spec);
  const visitor = new AllOfVisitor({ options: buildOptions(errors) });
  return visit(element, visitor, { keyMap, nodeTypeGetter: getNodeType });
};

describe('dereference', () => {
  describe('strategies', () => {
    describe('openapi-3-2-swagger-client', () => {
      describe('visitors', () => {
        describe('AllOfVisitor', () => {
          describe('given a schema without allOf keyword', () => {
            test('should leave the schema unchanged', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: { schemas: { User: { type: 'object' } } },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: { schemas: { User: { type: 'object' } } },
              });
            });
          });

          describe('given allOf is not an array', () => {
            test('should leave the schema unchanged', () => {
              const spec = {
                openapi: '3.2.0',
                components: { schemas: { User: { allOf: {} } } },
              };
              const result = applyAllOf(spec);

              expect(toValue(result)).toEqual(spec);
            });

            test('should collect an error', () => {
              const errors = [];

              applyAllOf(
                { openapi: '3.2.0', components: { schemas: { User: { allOf: {} } } } },
                errors
              );

              expect(errors).toHaveLength(1);
              expect(errors[0]).toMatchObject({
                message: expect.stringMatching(/^allOf must be an array/),
                fullPath: ['components', 'schemas', 'User', 'allOf'],
              });
            });
          });

          describe('given allOf is an empty array', () => {
            test('should remove the allOf keyword from the schema', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: { schemas: { User: { allOf: [] } } },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: { schemas: { User: {} } },
              });
            });
          });

          describe('given allOf contains a non-object item', () => {
            test('should leave the schema unchanged', () => {
              const spec = {
                openapi: '3.2.0',
                components: { schemas: { User: { allOf: [{ type: 'string' }, 2] } } },
              };
              const result = applyAllOf(spec);

              expect(toValue(result)).toEqual(spec);
            });

            test('should collect an error', () => {
              const errors = [];

              applyAllOf(
                {
                  openapi: '3.2.0',
                  components: { schemas: { User: { allOf: [{ type: 'string' }, 2] } } },
                },
                errors
              );

              expect(errors).toHaveLength(1);
              expect(errors[0]).toMatchObject({
                message: expect.stringMatching(/^Elements in allOf must be objects/),
                fullPath: ['components', 'schemas', 'User', 'allOf'],
              });
            });
          });

          describe('given a simple allOf with two schemas', () => {
            test('should merge all schemas into one', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    User: { allOf: [{ type: 'string' }, { maxLength: 10 }] },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: { schemas: { User: { type: 'string', maxLength: 10 } } },
              });
            });
          });

          describe('given a schema with allOf and its own keywords', () => {
            test('should give priority to the schema own keywords over allOf items', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    User: {
                      type: 'object',
                      allOf: [{ type: 'string', description: 'from allOf' }],
                    },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    User: { type: 'object', description: 'from allOf' },
                  },
                },
              });
            });
          });

          describe('given nested allOf schemas', () => {
            test('should fully resolve all nesting levels', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: {
                      allOf: [
                        { allOf: [{ type: 'string' }] },
                        { maximum: 1 },
                        {
                          allOf: [
                            { exclusiveMaximum: 2 },
                            { allOf: [{ minimum: 3 }, { exclusiveMinimum: 4 }] },
                          ],
                        },
                      ],
                    },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: {
                      type: 'string',
                      maximum: 1,
                      exclusiveMaximum: 2,
                      minimum: 3,
                      exclusiveMinimum: 4,
                    },
                  },
                },
              });
            });
          });

          describe('given allOf items with deeply nested objects', () => {
            test('should deep-merge nested objects', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: {
                      allOf: [
                        { properties: { cat: { type: 'object' } } },
                        { properties: { cat: { type: 'string' } } },
                      ],
                    },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: { schemas: { Cat: { properties: { cat: { type: 'string' } } } } },
              });
            });
          });

          describe('given allOf items with array keywords', () => {
            test('should concatenate arrays from all items', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    one: {
                      allOf: [
                        {
                          type: 'object',
                          required: ['c', 'd'],
                          properties: { nested: { type: 'object', required: ['f'] } },
                        },
                        {
                          type: 'object',
                          required: ['a', 'b'],
                          properties: { nested: { type: 'object', required: ['e'] } },
                        },
                      ],
                    },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    one: {
                      type: 'object',
                      required: ['c', 'd', 'a', 'b'],
                      properties: { nested: { type: 'object', required: ['f', 'e'] } },
                    },
                  },
                },
              });
            });
          });

          describe('given a schema with an example keyword', () => {
            test('should keep the original example instead of merging', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: {
                      example: { name: 'my cat' },
                      allOf: [{ example: { name: 'other' }, type: 'object' }],
                    },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: { example: { name: 'my cat' }, type: 'object' },
                  },
                },
              });
            });
          });

          describe('given a schema with an examples keyword', () => {
            test('should keep the original examples instead of merging', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: {
                      examples: [{ name: 'my cat' }],
                      allOf: [{ examples: [{ name: 'other' }], type: 'object' }],
                    },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: { examples: [{ name: 'my cat' }], type: 'object' },
                  },
                },
              });
            });
          });

          describe('given a schema without $$ref', () => {
            test('should strip $$ref introduced by allOf merging', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: {
                      allOf: [{ $$ref: 'some-ref', type: 'object' }],
                    },
                  },
                },
              });

              const value = toValue(result);
              expect(value.components.schemas.Cat).not.toHaveProperty('$$ref');
              expect(value.components.schemas.Cat).toEqual({ type: 'object' });
            });
          });

          describe('given a schema with an existing $$ref', () => {
            test('should retain the $$ref from the original schema', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    Cat: {
                      $$ref: 'original-ref',
                      allOf: [{ $$ref: 'other-ref', type: 'object' }],
                    },
                  },
                },
              });

              const value = toValue(result);
              expect(value.components.schemas.Cat.$$ref).toEqual('original-ref');
            });
          });

          describe('given primitive enum values in allOf items', () => {
            test('should deduplicate primitive enum values', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    one: {
                      allOf: [
                        { properties: { foo: { enum: [1, 2, 3, 4] } } },
                        { properties: { foo: { enum: [1, 2, 3, 5] } } },
                      ],
                    },
                  },
                },
              });

              expect(toValue(result)).toEqual({
                openapi: '3.2.0',
                components: {
                  schemas: { one: { properties: { foo: { enum: [1, 2, 3, 4, 5] } } } },
                },
              });
            });

            test('should not deduplicate complex enum values', () => {
              const result = applyAllOf({
                openapi: '3.2.0',
                components: {
                  schemas: {
                    one: {
                      allOf: [
                        { properties: { bar: { enum: [{ enum: [1, 2, 3] }] } } },
                        { properties: { bar: { enum: [{ enum: [1, 2, 3] }] } } },
                      ],
                    },
                  },
                },
              });

              const value = toValue(result);
              expect(value.components.schemas.one.properties.bar.enum).toHaveLength(2);
            });
          });
        });
      });
    });
  });
});
/* eslint-enable camelcase */
