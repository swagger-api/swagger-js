import path from 'node:path';
import { toValue } from '@swagger-api/apidom-core';
import { mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import {
  dereference,
  DereferenceError,
  MaximumDereferenceDepthError,
} from '@swagger-api/apidom-reference/configuration/empty';

// eslint-disable-next-line camelcase
import OpenApi3_1SwaggerClientDereferenceStrategy from '../../../../../../../../src/helpers/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';
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
                            OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
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
                const dereferenceThunk = async () => {
                  const httpServer = globalThis.createHTTPServer({
                    port: 8123,
                    cwd: fixturePath,
                  });
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
                const expected = globalThis.loadJsonFile(
                  path.join(fixturePath, 'dereferenced.json')
                );

                await expect(dereferenceThunk()).resolves.toEqual(expected);
              });
            });
          });

          describe('given $ref field with invalid JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'invalid-pointer');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });

          describe('given $ref field and maxDepth of dereference', () => {
            const fixturePath = path.join(rootFixturePath, 'max-depth');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: { maxDepth: 1 },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
              await expect(dereferenceThunk()).rejects.toMatchObject({
                cause: {
                  cause: expect.any(MaximumDereferenceDepthError),
                },
              });
              await expect(dereferenceThunk()).rejects.toHaveProperty(
                'cause.cause.message',
                expect.stringMatching(/__fixtures__\/max-depth\/ex1\.json"$/)
              );
            });
          });

          describe('given $ref field with unresolvable JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'unresolvable-path-item');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });

          describe('given $ref field with with direct circular internal reference', () => {
            const fixturePath = path.join(rootFixturePath, 'direct-internal-circular');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });

          describe('given $ref field with with indirect circular internal reference', () => {
            const fixturePath = path.join(rootFixturePath, 'indirect-internal-circular');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });

          describe('given $ref field with with direct circular external reference', () => {
            const fixturePath = path.join(rootFixturePath, 'direct-external-circular');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });

          describe('given $ref field with with indirect circular external reference', () => {
            const fixturePath = path.join(rootFixturePath, 'indirect-external-circular');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });
        });
      });
    });
  });
});
