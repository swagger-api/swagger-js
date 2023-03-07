import path from 'node:path';
import { ParseResultElement, toValue } from '@swagger-api/apidom-core';
import { isParameterElement, mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import { evaluate } from '@swagger-api/apidom-json-pointer';
import {
  dereference,
  dereferenceApiDOM,
  resolve,
  parse,
  Reference,
  ReferenceSet,
} from '@swagger-api/apidom-reference/configuration/empty';

// eslint-disable-next-line camelcase
import OpenApi3_1SwaggerClientDereferenceStrategy from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';
import * as jestSetup from '../__utils__/jest.local.setup.js';

const rootFixturePath = path.join(__dirname, '__fixtures__');

describe('dereference', () => {
  beforeAll(() => {
    jestSetup.beforeAll();
  });

  afterAll(() => {
    jestSetup.afterAll();
  });

  describe('strategies', () => {
    describe('openapi-3-1-swagger-client', () => {
      describe('Reference Object', () => {
        describe('given Reference Objects pointing internally and externally', () => {
          const fixturePath = path.join(rootFixturePath, 'internal-external');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should apply semantics to external fragment', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const fragment = evaluate('/0/components/parameters/externalRef', dereferenced);

            expect(isParameterElement(fragment)).toBe(true);
          });

          test('should annotate transcluded element with additional metadata', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const fragment = evaluate('/0/components/parameters/userId', dereferenced);

            expect(fragment.meta.get('ref-fields').get('$ref').toValue()).toStrictEqual(
              '#/components/parameters/indirection1'
            );
            expect(fragment.meta.get('ref-fields').get('description').toValue()).toStrictEqual(
              'override'
            );
          });
        });

        describe('given Reference Objects pointing internally only', () => {
          const fixturePath = path.join(rootFixturePath, 'internal-only');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Reference Objects pointing externally only', () => {
          const fixturePath = path.join(rootFixturePath, 'external-only');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Reference Objects pointing to external indirections', () => {
          const fixturePath = path.join(rootFixturePath, 'external-indirections');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should apply semantics to eventual external fragment', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const fragment = evaluate('/0/components/parameters/externalRef', dereferenced);

            expect(isParameterElement(fragment)).toBe(true);
          });
        });

        describe('given Reference Objects with additional fields', () => {
          const fixturePath = path.join(rootFixturePath, 'additional-fields');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Reference Objects with additional ignored fields', () => {
          const fixturePath = path.join(rootFixturePath, 'additional-ignored-fields');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Reference Objects pointing internally', () => {
          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, 'meta-patches-internal');
              const dereferenceThunk = async () => {
                const httpServer = globalThis.createHTTPServer({ port: 8123, cwd: fixturePath });

                try {
                  return toValue(
                    await dereference('http://localhost:8123/root.json', {
                      parse: { mediaType: mediaTypes.latest('json') },
                      dereference: {
                        strategies: [
                          OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                        ],
                      },
                    })
                  );
                } finally {
                  await httpServer.terminate();
                }
              };
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              await expect(dereferenceThunk()).resolves.toEqual(expected);
            });
          });
        });

        describe('given Reference Objects pointing externally', () => {
          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, 'meta-patches-external');
              const dereferenceThunk = async () => {
                const httpServer = globalThis.createHTTPServer({ port: 8123, cwd: fixturePath });

                try {
                  return toValue(
                    await dereference('http://localhost:8123/root.json', {
                      parse: { mediaType: mediaTypes.latest('json') },
                      dereference: {
                        strategies: [
                          OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                        ],
                      },
                    })
                  );
                } finally {
                  await httpServer.terminate();
                }
              };
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              await expect(dereferenceThunk()).resolves.toEqual(expected);
            });
          });
        });

        describe('given Reference Objects with internal cycles', () => {
          const fixturePath = path.join(rootFixturePath, 'cycle-internal');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const parent = evaluate('/0/components/schemas/User/properties/parent', dereferenced);
            const cyclicParent = evaluate(
              '/0/components/schemas/User/properties/parent/properties/parent',
              dereferenced
            );

            expect(parent).toStrictEqual(cyclicParent);
          });
        });

        describe('given Reference Objects with external resolution disabled', () => {
          const fixturePath = path.join(rootFixturePath, 'ignore-external');

          test('should not dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { external: false },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Reference Objects with direct circular internal reference', () => {
          const fixturePath = path.join(rootFixturePath, 'direct-internal-circular');
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Recursive JSON Pointer detected/
              ),
              baseDoc: expect.stringMatching(/direct-internal-circular\/root\.json$/),
              $ref: '#/components/parameters/userId',
              pointer: '/components/parameters/userId',
              fullPath: ['components', 'parameters', 'userId', '$ref'],
            });
          });
        });

        describe('given Reference Objects with indirect circular internal reference', () => {
          const fixturePath = path.join(rootFixturePath, 'indirect-internal-circular');
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(4);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Recursive JSON Pointer detected/
              ),
              baseDoc: expect.stringMatching(/indirect-internal-circular\/root\.json$/),
              $ref: '#/components/parameters/userId',
              pointer: '/components/parameters/userId',
              fullPath: ['components', 'parameters', 'userId', '$ref'],
            });
          });
        });

        describe('given Reference Objects with direct circular external reference', () => {
          const fixturePath = path.join(rootFixturePath, 'direct-external-circular');
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Recursive JSON Pointer detected/
              ),
              baseDoc: expect.stringMatching(/direct-external-circular\/ex\.json$/),
              $ref: './root.json#/components/parameters/externalRef',
              pointer: '/components/parameters/externalRef',
              fullPath: ['components', 'parameters', 'externalRef', '$ref'],
            });
          });
        });

        describe('given Reference Objects with indirect circular external reference', () => {
          const fixturePath = path.join(rootFixturePath, 'indirect-external-circular');
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Recursive JSON Pointer detected/
              ),
              baseDoc: expect.stringMatching(/indirect-external-circular\/ex3\.json$/),
              $ref: './root.json#/components/parameters/externalRef',
              pointer: '/components/parameters/externalRef',
              fullPath: ['components', 'parameters', 'externalRef', '$ref'],
            });
          });
        });

        describe('given Reference Objects with unresolvable reference', () => {
          const fixturePath = path.join(rootFixturePath, 'unresolvable-reference');
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(/^Could not resolve reference: ENOENT/),
              baseDoc: expect.stringMatching(/unresolvable-reference\/root\.json$/),
              $ref: './ex.json#/externalParameter',
              pointer: '/externalParameter',
              fullPath: ['components', 'parameters', 'externalRef', '$ref'],
            });
          });
        });

        describe('given Reference Objects with invalid JSON Pointer', () => {
          const fixturePath = path.join(rootFixturePath, 'invalid-pointer');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(/^Could not resolve reference: ENOENT/),
              baseDoc: expect.stringMatching(/invalid-pointer\/root\.json$/),
              $ref: 'invalid-pointer',
              pointer: '',
              fullPath: ['components', 'parameters', 'userId', '$ref'],
            });
          });
        });

        describe('given Reference Objects with arbitrary circular references', () => {
          const fixturePath = path.join(rootFixturePath, 'ignore-arbitrary-$refs');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Reference Objects with external circular dependency', () => {
          const fixturePath = path.join(rootFixturePath, 'external-circular-dependency');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Reference Objects and maxDepth of dereference', () => {
          const fixturePath = path.join(rootFixturePath, 'max-depth');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { maxDepth: 2 },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { maxDepth: 2, dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Maximum dereference depth/
              ),
              baseDoc: expect.stringMatching(/max-depth\/ex2\.json$/),
              $ref: './ex3.json#/externalParameter',
              pointer: '/externalParameter',
              fullPath: ['components', 'parameters', 'externalRef', '$ref'],
            });
          });
        });

        describe('given Reference Objects and maxDepth of resolution', () => {
          const fixturePath = path.join(rootFixturePath, 'max-depth');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              resolve: { maxDepth: 2 },
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const errors = [];

            await dereference(rootFilePath, {
              resolve: { maxDepth: 2 },
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { dereferenceOpts: { errors } },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Maximum resolution depth/
              ),
              baseDoc: expect.stringMatching(/max-depth\/ex2\.json$/),
              $ref: './ex3.json#/externalParameter',
              pointer: '/externalParameter',
              fullPath: ['components', 'parameters', 'externalRef', '$ref'],
            });
          });
        });

        describe('given refSet is provided as an option', () => {
          test('should dereference without external resolution', async () => {
            const fixturePath = path.join(rootFixturePath, 'refset-as-option');
            const uri = path.join(fixturePath, 'root.json');
            const refSet = await resolve(uri, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const actual = await dereference(uri, { dereference: { refSet } });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should dereference single ApiDOM fragment', async () => {
            const fixturePath = path.join(rootFixturePath, 'refset-as-option');
            const uri = path.join(fixturePath, 'root.json');
            const parseResult = await parse(uri, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const referenceElement = parseResult.api?.components.parameters.get('externalRef');
            const refSet = ReferenceSet();
            const rootFileReference = Reference({ uri, value: parseResult });
            const referenceElementReference = Reference({
              uri: `${uri}#/single-reference-object`,
              value: new ParseResultElement([referenceElement]),
            });
            // referenceElementReference needs to be added as first to create rootRef
            refSet.add(referenceElementReference).add(rootFileReference);

            const actual = await dereferenceApiDOM(referenceElement, {
              parse: { mediaType: mediaTypes.latest('generic') },
              resolve: { baseURI: uri },
              dereference: { refSet },
            });

            const expected = {
              name: 'externalParameter',
              in: 'query',
              description: 'external ref',
              required: true,
            };

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given path with invalid URL characters - spaces', () => {
          const fixturePath = path.join(rootFixturePath, 'path-encoding', 'path with spaces');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });
      });
    });
  });
});
