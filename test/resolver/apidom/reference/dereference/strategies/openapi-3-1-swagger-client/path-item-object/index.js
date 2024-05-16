import path from 'node:path';
import { toValue } from '@swagger-api/apidom-core';
import { mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import { dereference } from '@swagger-api/apidom-reference/configuration/empty';

// eslint-disable-next-line camelcase
import OpenAPI3_1SwaggerClientDereferenceStrategy from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';
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
      describe('Path Item Object', () => {
        describe('given in webhooks field', () => {
          const fixturePath = path.join(rootFixturePath, 'webhooks');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given in components/pathItems field', () => {
          const fixturePath = path.join(rootFixturePath, 'components-path-items');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given in Callback Object', () => {
          const fixturePath = path.join(rootFixturePath, 'callback-object');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Path Item Object $ref field', () => {
          describe('given $ref field pointing internally only', () => {
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

          describe('given $ref field pointing externally only', () => {
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

          describe('given $ref field pointing internally and externally', () => {
            const fixturePath = path.join(rootFixturePath, 'internal-external');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('given $ref field + additional fields', () => {
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

          describe('given external resolution disabled', () => {
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

          describe('given $ref field pointing to internal indirection', () => {
            const fixturePath = path.join(rootFixturePath, 'internal-indirections');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('given $ref field pointing to external indirections', () => {
            const fixturePath = path.join(rootFixturePath, 'external-indirections');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('given $ref field pointing internally', () => {
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
                            new OpenAPI3_1SwaggerClientDereferenceStrategy({
                              allowMetaPatches: true,
                            }),
                          ],
                        },
                      })
                    );
                  } finally {
                    await httpServer.terminate();
                  }
                };
                const expected = globalThis.loadJsonFile(
                  path.join(fixturePath, 'dereferenced.json')
                );

                await expect(dereferenceThunk()).resolves.toEqual(expected);
              });
            });
          });

          describe('given $ref field pointing externally', () => {
            describe('and allowMetaPatches=true', () => {
              test('should dereference', async () => {
                const fixturePath = path.join(rootFixturePath, 'meta-patches-external');
                const httpServer = globalThis.createHTTPServer({
                  port: 8123,
                  cwd: fixturePath,
                });

                const dereferenceThunk = async () =>
                  toValue(
                    await dereference('http://localhost:8123/root.json', {
                      parse: { mediaType: mediaTypes.latest('json') },
                      dereference: {
                        strategies: [
                          new OpenAPI3_1SwaggerClientDereferenceStrategy({
                            allowMetaPatches: true,
                          }),
                        ],
                      },
                    })
                  );

                const expected = globalThis.loadJsonFile(
                  path.join(fixturePath, 'dereferenced.json')
                );

                await expect(dereferenceThunk()).resolves.toEqual(expected);
                await httpServer.terminate();
              });
            });
          });

          describe('given $ref field with invalid JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'invalid-pointer');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                resolve: { maxDepth: 2 },
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
                message: expect.stringMatching(/^Could not resolve reference: ENOENT:/),
                baseDoc: expect.stringMatching(/invalid-pointer\/root\.json$/),
                $ref: 'invalid-pointer',
                pointer: '',
                fullPath: ['paths', '/path1', '$ref'],
              });
            });
          });

          describe('given $ref field and maxDepth of dereference', () => {
            const fixturePath = path.join(rootFixturePath, 'max-depth');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                resolve: { maxDepth: 1 },
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });

            test('should collect error', async () => {
              const errors = [];

              await dereference(rootFilePath, {
                resolve: { maxDepth: 1 },
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: { dereferenceOpts: { errors } },
              });

              expect(errors).toHaveLength(1);
              expect(errors[0]).toMatchObject({
                message: expect.stringMatching(
                  /^Could not resolve reference: Maximum resolution depth/
                ),
                baseDoc: expect.stringMatching(/max-depth\/ex1\.json$/),
                $ref: './ex2.json#/~1path3',
                pointer: '/~1path3',
                fullPath: ['paths', '/path1', '$ref'],
              });
            });
          });

          describe('given $ref field with unresolvable JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'unresolvable-path-item');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                resolve: { maxDepth: 2 },
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
                  /^Could not resolve reference: JSON Pointer evaluation failed while evaluating/
                ),
                baseDoc: expect.stringMatching(/unresolvable-path-item\/root\.json$/),
                $ref: '#/paths/invalid-pointer',
                pointer: '/paths/invalid-pointer',
                fullPath: ['paths', '/path1', '$ref'],
              });
            });
          });

          describe('given $ref field with with direct circular internal reference', () => {
            const fixturePath = path.join(rootFixturePath, 'direct-internal-circular');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('given $ref field with with indirect circular internal reference', () => {
            const fixturePath = path.join(rootFixturePath, 'indirect-internal-circular');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('given $ref field with with direct circular external reference', () => {
            const fixturePath = path.join(rootFixturePath, 'direct-external-circular');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('given $ref field with with indirect circular external reference', () => {
            const fixturePath = path.join(rootFixturePath, 'indirect-external-circular');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
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
});
