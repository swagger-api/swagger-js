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
        describe('OpenAPI3_2SwaggerClientDereferenceVisitor', () => {
          describe('ReferenceElement', () => {
            describe('given allowMetaPatches=true', () => {
              test('should annotate dereferenced element with $$ref', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    parameters: {
                      userId: { $ref: '#/components/parameters/userIdRef' },
                      userIdRef: { name: 'id', in: 'query' },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: {
                    strategies: [
                      new OpenAPI3_2SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                    ],
                  },
                });

                expect(toValue(result).components.parameters.userId).toHaveProperty('$$ref');
                expect(toValue(result).components.parameters.userId.$$ref).toMatch(
                  /#\/components\/parameters\/userIdRef$/
                );
              });
            });

            describe('given allowMetaPatches=false', () => {
              test('should NOT annotate dereferenced element with $$ref', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    parameters: {
                      userId: { $ref: '#/components/parameters/userIdRef' },
                      userIdRef: { name: 'id', in: 'query' },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: {
                    strategies: [
                      new OpenAPI3_2SwaggerClientDereferenceStrategy({ allowMetaPatches: false }),
                    ],
                  },
                });

                expect(toValue(result).components.parameters.userId).not.toHaveProperty('$$ref');
              });
            });

            describe('given a Reference Object with description and the referenced element also has description', () => {
              test('should use the description from the Reference Object (outer wins)', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    parameters: {
                      userId: {
                        $ref: '#/components/parameters/userIdRef',
                        description: 'overriding description',
                      },
                      userIdRef: {
                        name: 'id',
                        in: 'query',
                        description: 'original description',
                      },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

                expect(toValue(result).components.parameters.userId.description).toBe(
                  'overriding description'
                );
              });
            });

            describe('given a Reference Object with both description and summary overrides', () => {
              test('should override both description and summary from the Reference Object', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  paths: {
                    '/pets': {
                      get: {
                        operationId: 'listPets',
                        responses: {
                          200: {
                            $ref: '#/components/responses/PetsResponse',
                            description: 'overriding description',
                            summary: 'overriding summary',
                          },
                        },
                      },
                    },
                  },
                  components: {
                    responses: {
                      PetsResponse: {
                        description: 'original description',
                        summary: 'original summary',
                        content: {
                          'application/json': {
                            schema: { type: 'array' },
                          },
                        },
                      },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

                const response = toValue(result).paths['/pets'].get.responses[200];
                expect(response.description).toBe('overriding description');
                expect(response.summary).toBe('overriding summary');
              });
            });

            describe('given resolve.internal=false', () => {
              test('should leave internal $refs unresolved', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    parameters: {
                      userId: { $ref: '#/components/parameters/userIdRef' },
                      userIdRef: { name: 'id', in: 'query' },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  resolve: { internal: false },
                });

                expect(toValue(result).components.parameters.userId).toHaveProperty('$ref');
              });
            });

            describe('given resolve.external=false', () => {
              test('should leave external $refs unresolved', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    parameters: {
                      userId: {
                        $ref: 'https://schemas.example.com/parameters.json#/userId',
                      },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  resolve: {
                    internal: true,
                    external: false,
                    baseURI: 'https://smartbear.com/spec.json',
                  },
                });

                expect(toValue(result).components.parameters.userId).toHaveProperty('$ref');
              });
            });

            describe('given an invalid $ref that cannot be resolved', () => {
              test('should collect an error and leave the element in place', async () => {
                const errors = [];
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    parameters: {
                      userId: { $ref: '#/components/parameters/doesNotExist' },
                    },
                  },
                });
                await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: { dereferenceOpts: { errors } },
                });

                expect(errors).toHaveLength(1);
                expect(errors[0]).toMatchObject({
                  $ref: '#/components/parameters/doesNotExist',
                });
              });
            });
          });

          describe('PathItemElement', () => {
            describe('given allowMetaPatches=true', () => {
              test('should annotate dereferenced path item with $$ref', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  paths: {
                    '/users': { $ref: '#/components/pathItems/UsersPath' },
                  },
                  components: {
                    pathItems: {
                      UsersPath: {
                        get: {
                          operationId: 'listUsers',
                          responses: { 200: { description: 'OK' } },
                        },
                      },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: {
                    strategies: [
                      new OpenAPI3_2SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                    ],
                  },
                });

                expect(toValue(result).paths['/users']).toHaveProperty('$$ref');
                expect(toValue(result).paths['/users'].$$ref).toMatch(
                  /#\/components\/pathItems\/UsersPath$/
                );
              });
            });

            describe('given allowMetaPatches=false', () => {
              test('should NOT annotate dereferenced path item with $$ref', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  paths: {
                    '/users': { $ref: '#/components/pathItems/UsersPath' },
                  },
                  components: {
                    pathItems: {
                      UsersPath: {
                        get: {
                          operationId: 'listUsers',
                          responses: { 200: { description: 'OK' } },
                        },
                      },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: {
                    strategies: [
                      new OpenAPI3_2SwaggerClientDereferenceStrategy({ allowMetaPatches: false }),
                    ],
                  },
                });

                expect(toValue(result).paths['/users']).not.toHaveProperty('$$ref');
              });
            });

            describe('given resolve.internal=false', () => {
              test('should leave internal PathItem $refs unresolved', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  paths: {
                    '/users': { $ref: '#/components/pathItems/UsersPath' },
                  },
                  components: {
                    pathItems: {
                      UsersPath: {
                        get: {
                          operationId: 'listUsers',
                          responses: { 200: { description: 'OK' } },
                        },
                      },
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  resolve: { internal: false },
                });

                expect(toValue(result).paths['/users']).toHaveProperty('$ref');
              });
            });

            describe('given an invalid PathItem $ref', () => {
              test('should collect an error', async () => {
                const errors = [];
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  paths: {
                    '/users': { $ref: '#/components/pathItems/doesNotExist' },
                  },
                });
                await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: { dereferenceOpts: { errors } },
                });

                expect(errors).toHaveLength(1);
                expect(errors[0]).toMatchObject({
                  $ref: '#/components/pathItems/doesNotExist',
                });
              });
            });
          });

          describe('SchemaElement', () => {
            describe('given a $ref to a boolean JSON Schema (true)', () => {
              test('should dereference to a boolean schema element', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    schemas: {
                      Item: {
                        type: 'object',
                        properties: {
                          extra: { $ref: '#/components/schemas/AlwaysValid' },
                        },
                      },
                      AlwaysValid: true,
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

                expect(toValue(result).components.schemas.Item.properties.extra).toBe(true);
              });
            });

            describe('given a $ref to a boolean JSON Schema (false)', () => {
              test('should dereference to a boolean schema element', async () => {
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    schemas: {
                      Item: {
                        type: 'object',
                        properties: {
                          blocked: { $ref: '#/components/schemas/NeverValid' },
                        },
                      },
                      NeverValid: false,
                    },
                  },
                });
                const result = await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

                expect(toValue(result).components.schemas.Item.properties.blocked).toBe(false);
              });
            });

            describe('given allowMetaPatches=true', () => {
              test('should annotate dereferenced schema with $$ref', async () => {
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
                    strategies: [
                      new OpenAPI3_2SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                    ],
                  },
                });

                expect(toValue(result).components.schemas.Cat).toHaveProperty('$$ref');
              });
            });

            describe('given an unresolvable Schema $ref', () => {
              test('should collect an error and continue', async () => {
                const errors = [];
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    schemas: {
                      Cat: { $ref: '#/components/schemas/doesNotExist' },
                    },
                  },
                });
                await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: { dereferenceOpts: { errors } },
                });

                expect(errors).toHaveLength(1);
                expect(errors[0].message).toMatch(/Could not resolve reference/);
              });
            });
          });

          describe('LinkElement', () => {
            test('should not attach operation metadata to Link Objects', async () => {
              const spec = OpenApi3_2Element.refract({
                openapi: '3.2.0',
                paths: {
                  '/pets': {
                    get: {
                      operationId: 'listPets',
                      responses: {
                        200: {
                          description: 'OK',
                          links: {
                            getPet: {
                              operationId: 'getPet',
                              parameters: { petId: '$response.body#/id' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              });
              const result = await dereferenceApiDOM(spec, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

              const link = toValue(result).paths['/pets'].get.responses[200].links.getPet;
              expect(link.operationId).toBe('getPet');
              // no operation object should be embedded in link metadata
              expect(link.operation).toBeUndefined();
            });
          });

          describe('ExampleElement', () => {
            describe('given an Example Object with an unresolvable externalValue', () => {
              test('should collect an error and continue', async () => {
                const errors = [];
                const spec = OpenApi3_2Element.refract({
                  openapi: '3.2.0',
                  components: {
                    examples: {
                      PetExample: {
                        externalValue: 'https://unresolvable-host-xyzabc123.invalid/example.json',
                      },
                    },
                  },
                });
                await dereferenceApiDOM(spec, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: { dereferenceOpts: { errors } },
                });

                expect(errors).toHaveLength(1);
                expect(errors[0]).toMatchObject({
                  externalValue: 'https://unresolvable-host-xyzabc123.invalid/example.json',
                });
              });
            });
          });
        });
      });
    });
  });
});
/* eslint-enable camelcase */
