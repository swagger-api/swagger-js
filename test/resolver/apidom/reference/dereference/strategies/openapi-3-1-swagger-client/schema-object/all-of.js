/* eslint-disable camelcase */
import { toValue } from '@swagger-api/apidom-core';
import { mediaTypes, OpenApi3_1Element } from '@swagger-api/apidom-ns-openapi-3-1';
import { dereferenceApiDOM } from '@swagger-api/apidom-reference/configuration/empty';

import * as jestSetup from '../__utils__/jest.local.setup.js';
import OpenApi3_1SwaggerClientDereferenceStrategy from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

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
        describe('given allOf is not an array', () => {
          const openApiElement = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  allOf: {},
                },
              },
            },
          });

          test('should dereference', async () => {
            const actual = await dereferenceApiDOM(openApiElement, {
              parse: { mediaType: mediaTypes.latest('json') },
            });

            expect(toValue(actual)).toEqual(toValue(openApiElement));
          });

          test('should collect error', async () => {
            const errors = [];

            await dereferenceApiDOM(openApiElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(/^allOf must be an array/),
              fullPath: ['components', 'schemas', 'User', 'allOf'],
            });
          });
        });

        describe('given allOf contains empty list', () => {
          test('should remove the keyword from Schema Object', async () => {
            const spec = OpenApi3_1Element.refract({
              openapi: '3.1.0',
              components: {
                schemas: {
                  User: {
                    allOf: [],
                  },
                },
              },
            });
            const dereferenced = await dereferenceApiDOM(spec, {
              parse: { mediaType: mediaTypes.latest('json') },
            });

            expect(toValue(dereferenced)).toEqual({
              openapi: '3.1.0',
              components: {
                schemas: {
                  User: {},
                },
              },
            });
          });
        });

        describe('give allOf contains non-object item', () => {
          const openApiElement = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  allOf: [{ type: 'string' }, 2],
                },
              },
            },
          });

          test('should dereference', async () => {
            const actual = await dereferenceApiDOM(openApiElement, {
              parse: { mediaType: mediaTypes.latest('json') },
            });

            expect(toValue(actual)).toEqual(toValue(openApiElement));
          });

          test('should collect error', async () => {
            const errors = [];

            await dereferenceApiDOM(openApiElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(/^Elements in allOf must be objects/),
              fullPath: ['components', 'schemas', 'User', 'allOf'],
            });
          });
        });

        test('should resolve simple allOf', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  allOf: [{ type: 'string' }, { $id: 'urn:uuid:smartbear' }],
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  type: 'string',
                  $id: 'urn:uuid:smartbear',
                },
              },
            },
          });
        });

        test('should resolve local references in allOf keyword', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  properties: {},
                  allOf: [
                    { $ref: '#/components/schemas/UserProfile' },
                    { $id: 'urn:uuid:smartbear' },
                  ],
                },
                UserProfile: {
                  type: 'object',
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  properties: {},
                  $id: 'urn:uuid:smartbear',
                  type: 'object',
                },
                UserProfile: {
                  type: 'object',
                },
              },
            },
          });
        });

        test("shouldn't override properties of target Schema Object", async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  type: 'object',
                  allOf: [
                    { type: 'string', customKeyword: 'val1' },
                    { $id: 'urn:uuid:smartbear', customKeyword: 'val2' },
                  ],
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                User: {
                  type: 'object',
                  customKeyword: 'val2',
                  $id: 'urn:uuid:smartbear',
                },
              },
            },
          });
        });

        test('should retain $$ref meta patches', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                Pet: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                },
                Cat: {
                  allOf: [
                    { $ref: '#/components/schemas/Pet' },
                    {
                      type: 'object',
                      properties: {
                        meow: {
                          type: 'string',
                        },
                      },
                    },
                  ],
                },
                Animal: {
                  type: 'object',
                  properties: {
                    pet: {
                      $ref: '#/components/schemas/Pet',
                    },
                    cat: {
                      $ref: '#/components/schemas/Cat',
                    },
                  },
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
            dereference: {
              strategies: [
                OpenApi3_1SwaggerClientDereferenceStrategy({
                  allowMetaPatches: true,
                }),
              ],
            },
          });

          expect(toValue(dereferenced)).toMatchObject({
            openapi: '3.1.0',
            components: {
              schemas: {
                Pet: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                },
                Cat: {
                  properties: {
                    meow: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                  },
                  type: 'object',
                },
                Animal: {
                  type: 'object',
                  properties: {
                    pet: {
                      $$ref: expect.stringMatching(/#\/components\/schemas\/Pet$/),
                      properties: {
                        name: {
                          type: 'string',
                        },
                      },
                      type: 'object',
                    },
                    cat: {
                      $$ref: expect.stringMatching(/#\/components\/schemas\/Cat$/),
                      properties: {
                        meow: {
                          type: 'string',
                        },
                        name: {
                          type: 'string',
                        },
                      },
                      type: 'object',
                    },
                  },
                },
              },
            },
          });
        });

        test('should merge allOf items, deeply', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
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
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                Cat: {
                  properties: {
                    cat: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          });
        });

        test('should resolve nested allOf', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                Cat: {
                  allOf: [
                    {
                      allOf: [{ type: 'string' }],
                    },
                    { maximum: 1 },
                    {
                      allOf: [
                        { exclusiveMaximum: 2 },
                        {
                          allOf: [{ minimum: 3 }, { exclusiveMinimum: 4 }],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
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

        test('should support nested allOfs with $refs', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                D: {
                  type: 'object',
                  properties: {
                    z: {
                      type: 'string',
                      description: 'Some Z string',
                    },
                  },
                },
                C: {
                  type: 'object',
                  properties: {
                    d: {
                      title: 'D',
                      allOf: [
                        {
                          description: 'Some D',
                        },
                        {
                          $ref: '#/components/schemas/D',
                        },
                      ],
                    },
                  },
                },
                B: {
                  type: 'object',
                  properties: {
                    c: {
                      title: 'C',
                      allOf: [
                        {
                          description: 'Some C',
                        },
                        {
                          $ref: '#/components/schemas/C',
                        },
                      ],
                    },
                  },
                },
                A: {
                  type: 'object',
                  properties: {
                    b: {
                      title: 'B',
                      allOf: [
                        {
                          $ref: '#/components/schemas/B',
                        },
                        {
                          description: 'Some B',
                        },
                      ],
                    },
                  },
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                D: {
                  type: 'object',
                  properties: { z: { type: 'string', description: 'Some Z string' } },
                },
                C: {
                  type: 'object',
                  properties: {
                    d: {
                      description: 'Some D',
                      type: 'object',
                      properties: { z: { type: 'string', description: 'Some Z string' } },
                      title: 'D',
                    },
                  },
                },
                B: {
                  type: 'object',
                  properties: {
                    c: {
                      description: 'Some C',
                      type: 'object',
                      properties: {
                        d: {
                          description: 'Some D',
                          type: 'object',
                          properties: { z: { type: 'string', description: 'Some Z string' } },
                          title: 'D',
                        },
                      },
                      title: 'C',
                    },
                  },
                },
                A: {
                  type: 'object',
                  properties: {
                    b: {
                      type: 'object',
                      properties: {
                        c: {
                          description: 'Some C',
                          type: 'object',
                          properties: {
                            d: {
                              description: 'Some D',
                              type: 'object',
                              properties: { z: { type: 'string', description: 'Some Z string' } },
                              title: 'D',
                            },
                          },
                          title: 'C',
                        },
                      },
                      description: 'Some B',
                      title: 'B',
                    },
                  },
                },
              },
            },
          });
        });

        test('should deepmerge arrays inside of an `allOf`', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                one: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/two',
                    },
                    {
                      type: 'object',
                      required: ['a', 'b'],
                      properties: {
                        nested: {
                          type: 'object',
                          required: ['e'],
                        },
                      },
                    },
                  ],
                },
                two: {
                  allOf: [
                    {
                      type: 'object',
                      required: ['c', 'd'],
                      properties: {
                        nested: {
                          type: 'object',
                          required: ['f'],
                        },
                      },
                    },
                  ],
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                one: {
                  type: 'object',
                  required: ['c', 'd', 'a', 'b'],
                  properties: {
                    nested: {
                      type: 'object',
                      required: ['f', 'e'],
                    },
                  },
                },
                two: {
                  type: 'object',
                  required: ['c', 'd'],
                  properties: {
                    nested: {
                      type: 'object',
                      required: ['f'],
                    },
                  },
                },
              },
            },
          });
        });

        test('should handle case, with an `allOf` referencing an `allOf`', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                one: {
                  allOf: [
                    {
                      $ref: '#/components/schemas/two',
                    },
                    {
                      type: 'object',
                    },
                  ],
                },
                two: {
                  allOf: [
                    {
                      type: 'object',
                    },
                  ],
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                one: {
                  type: 'object',
                },
                two: {
                  type: 'object',
                },
              },
            },
          });
        });

        test('should suppress merging example keyword', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                Pet: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                  example: {
                    name: 'my pet',
                  },
                },
                Cat: {
                  allOf: [
                    { $ref: '#/components/schemas/Pet' },
                    {
                      type: 'object',
                      properties: {
                        meow: {
                          type: 'string',
                        },
                      },
                      example: {
                        name: 'my cat',
                        meow: 'meow',
                      },
                    },
                  ],
                },
                PetCat: {
                  allOf: [
                    { $ref: '#/components/schemas/Pet' },
                    { $ref: '#/components/schemas/Cat' },
                  ],
                  properties: {
                    id: {
                      type: 'string',
                    },
                  },
                  example: {
                    id: '1',
                  },
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                Pet: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                  example: {
                    name: 'my pet',
                  },
                },
                Cat: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    meow: {
                      type: 'string',
                    },
                  },
                  example: {
                    name: 'my cat',
                    meow: 'meow',
                  },
                },
                PetCat: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    meow: {
                      type: 'string',
                    },
                  },
                  example: {
                    id: '1',
                  },
                },
              },
            },
          });
        });

        test('should suppress merging examples keyword', async () => {
          const spec = OpenApi3_1Element.refract({
            openapi: '3.1.0',
            components: {
              schemas: {
                Pet: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                  examples: [
                    {
                      name: 'my pet',
                    },
                  ],
                },
                Cat: {
                  allOf: [
                    { $ref: '#/components/schemas/Pet' },
                    {
                      type: 'object',
                      properties: {
                        meow: {
                          type: 'string',
                        },
                      },
                      examples: [
                        {
                          name: 'my cat',
                          meow: 'meow',
                        },
                      ],
                    },
                  ],
                },
                PetCat: {
                  allOf: [
                    { $ref: '#/components/schemas/Pet' },
                    { $ref: '#/components/schemas/Cat' },
                  ],
                  properties: {
                    id: {
                      type: 'string',
                    },
                  },
                  examples: [
                    {
                      id: '1',
                    },
                  ],
                },
              },
            },
          });
          const dereferenced = await dereferenceApiDOM(spec, {
            parse: { mediaType: mediaTypes.latest('json') },
          });

          expect(toValue(dereferenced)).toEqual({
            openapi: '3.1.0',
            components: {
              schemas: {
                Pet: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                  },
                  examples: [
                    {
                      name: 'my pet',
                    },
                  ],
                },
                Cat: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                    },
                    meow: {
                      type: 'string',
                    },
                  },
                  examples: [
                    {
                      name: 'my pet',
                    },
                    {
                      name: 'my cat',
                      meow: 'meow',
                    },
                  ],
                },
                PetCat: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    meow: {
                      type: 'string',
                    },
                  },
                  examples: [
                    {
                      id: '1',
                    },
                  ],
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
