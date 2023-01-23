import path from 'node:path';
import { toValue } from '@swagger-api/apidom-core';
import { isSchemaElement, mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import { evaluate } from '@swagger-api/apidom-json-pointer';
import {
  DereferenceError,
  MaximumDereferenceDepthError,
  MaximumResolverDepthError,
  ResolverError,
  dereference,
  resolve,
} from '@swagger-api/apidom-reference/configuration/empty';
import { EvaluationJsonSchema$anchorError } from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1/selectors/$anchor';
import { EvaluationJsonSchemaUriError } from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1/selectors/uri';

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
      describe('Schema Object - $ref keyword from core vocabulary', () => {
        describe('given Schema Objects pointing internally and externally', () => {
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
            const fragment = evaluate('/0/components/schemas/Order', dereferenced);

            expect(isSchemaElement(fragment)).toBe(true);
          });

          test('should annotate transcluded element with additional metadata', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const fragment = evaluate(
              '/0/components/schemas/User/properties/profile',
              dereferenced
            );

            expect(fragment.meta.get('ref-fields').get('$ref').toValue()).toStrictEqual(
              '#/components/schemas/UserProfile'
            );
          });
        });

        describe('given Schema Objects pointing internally only', () => {
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

        describe('given Schema Objects pointing to internal indirections', () => {
          const fixturePath = path.join(rootFixturePath, 'indirect-internal');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects with internal cycles', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, 'cycle-internal');
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

          describe('and useCircularStructures=false', () => {
            test('should avoid cycles by skipping transclusion', async () => {
              const fixturePath = path.join(rootFixturePath, 'cycle-internal-disabled');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });

            describe('and using HTTP protocol', () => {
              test('should make JSON Pointer absolute', async () => {
                const fixturePath = path.join(rootFixturePath, 'cycle-internal-disabled-http');
                const dereferenceThunk = async () => {
                  const httpServer = globalThis.createHTTPServer({ port: 8123, cwd: fixturePath });

                  try {
                    return toValue(
                      await dereference('http://localhost:8123/root.json', {
                        parse: { mediaType: mediaTypes.latest('json') },
                        dereference: {
                          strategies: [
                            OpenApi3_1SwaggerClientDereferenceStrategy({
                              useCircularStructures: false,
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
        });

        describe('given Schema Objects with external cycles', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, 'cycle-external');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const parent = evaluate(
              '/0/components/schemas/User/properties/profile/properties/parent',
              dereferenced
            );
            const cyclicParent = evaluate(
              '/0/components/schemas/User/properties/profile/properties/parent/properties/parent',
              dereferenced
            );

            expect(parent).toStrictEqual(cyclicParent);
          });

          describe('and useCircularStructures=false', () => {
            test('should avoid cycles by skipping transclusion', async () => {
              const fixturePath = path.join(rootFixturePath, 'cycle-external-disabled');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              refSet.refs[1].uri = '/home/smartbear/ex.json';
              const actual = await dereference('/home/smartbear/root.json', {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Object pointing internally', () => {
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

        describe('given Schema Object pointing externally', () => {
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

        describe('given Schema Objects with internal and external cycles', () => {
          const fixturePath = path.join(rootFixturePath, 'cycle-internal-external');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const user = evaluate(
              '/0/components/schemas/User/properties/profile/properties/user',
              dereferenced
            );
            const cyclicUserInProfile = evaluate(
              '/0/components/schemas/User/properties/profile/properties/user/properties/profile/properties/user',
              dereferenced
            );

            expect(user).toStrictEqual(cyclicUserInProfile);
          });
        });

        describe('given Schema Objects with external circular dependency', () => {
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

        describe('given Schema Objects with external resolution disabled', () => {
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

        describe('given Schema Objects with overlapping keywords', () => {
          const fixturePath = path.join(rootFixturePath, 'merging-keywords');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects pointing externally only', () => {
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

        describe('given Schema Objects pointing to external indirections', () => {
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
            const fragment = evaluate('/0/components/schemas/Indirection', dereferenced);

            expect(isSchemaElement(fragment)).toBe(true);
          });
        });

        describe('given Schema Objects with $schema keyword defined', () => {
          const fixturePath = path.join(rootFixturePath, '$schema-defined');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects with $schema keyword defined in enclosing Schema Object', () => {
          let dereferenced;
          let expected;

          beforeEach(async () => {
            const fixturePath = path.join(rootFixturePath, '$schema-enclosing');
            const rootFilePath = path.join(fixturePath, 'root.json');
            dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));
          });

          test('should dereference', async () => {
            expect(toValue(dereferenced)).toEqual(expected);
          });

          test('should retain $schema before dereferencing', () => {
            const profile = evaluate('/0/components/schemas/User/properties/profile', dereferenced);

            expect(profile.meta.get('inherited$schema').toValue()).toStrictEqual(
              'https://spec.openapis.org/oas/3.1/dialect/base'
            );
          });
        });

        describe('given Schema Objects with mixed $schema keyword defined', () => {
          const fixturePath = path.join(rootFixturePath, '$schema-mixed');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects with undefined $schema keyword', () => {
          let dereferenced;
          let expected;

          beforeEach(async () => {
            const fixturePath = path.join(rootFixturePath, '$schema-undefined');
            const rootFilePath = path.join(fixturePath, 'root.json');
            dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));
          });

          test('should dereference', async () => {
            expect(toValue(dereferenced)).toEqual(expected);
          });

          test('should inherit default $schema dialect for User', () => {
            const user = evaluate('/0/components/schemas/User', dereferenced);

            expect(user.meta.get('inherited$schema').toValue()).toStrictEqual(
              'https://spec.openapis.org/oas/3.1/dialect/base'
            );
          });

          test('should inherit default $schema dialect for User.login', () => {
            const user = evaluate('/0/components/schemas/User/properties/login', dereferenced);

            expect(user.meta.get('inherited$schema').toValue()).toStrictEqual(
              'https://spec.openapis.org/oas/3.1/dialect/base'
            );
          });

          test('should inherit default $schema dialect for UserProfile', () => {
            const user = evaluate('/0/components/schemas/UserProfile', dereferenced);

            expect(user.meta.get('inherited$schema').toValue()).toStrictEqual(
              'https://spec.openapis.org/oas/3.1/dialect/base'
            );
          });

          test('should inherit default $schema dialect for UserProfile.login', () => {
            const user = evaluate(
              '/0/components/schemas/UserProfile/properties/avatar',
              dereferenced
            );

            expect(user.meta.get('inherited$schema').toValue()).toStrictEqual(
              'https://spec.openapis.org/oas/3.1/dialect/base'
            );
          });
        });

        describe('given Schema Objects with unrecognized $schema keyword defined', () => {
          const fixturePath = path.join(rootFixturePath, '$schema-unrecognized');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects with $id keyword defined directly in referencing Schema Object', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$id-uri-direct');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$id-uri-direct-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              refSet.refs[1].uri = '/home/smartbear/nested/ex.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $id keyword defined in enclosing Schema Object', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$id-uri-enclosing');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$id-uri-enclosing-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              refSet.refs[1].uri = '/home/smartbear/nested/ex.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $id keyword pointing to external files', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$id-uri-external');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$id-uri-external-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              refSet.refs[1].uri = '/home/smartbear/nested/ex.json';
              refSet.refs[2].uri = '/home/smartbear/nested/nested/ex.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with unresolvable $id values', () => {
          const fixturePath = path.join(rootFixturePath, '$id-unresolvable');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            await expect(dereferenceThunk()).rejects.toMatchObject({
              cause: {
                cause: expect.any(ResolverError),
              },
            });
            await expect(dereferenceThunk()).rejects.toHaveProperty(
              'cause.cause.message',
              expect.stringMatching(/\/schemas\/nested\/ex\.json"$/)
            );
          });
        });

        describe('given Schema Objects with $ref keyword containing URL', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$ref-url');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-url-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing relative references', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$ref-url-relative-reference');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$ref-url-relative-reference-meta-patches'
              );
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing URL and JSON Pointer fragment', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$ref-url-pointer');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-url-pointer-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing URL and $anchor', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$ref-url-$anchor');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-url-$anchor-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing resolvable URL', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$ref-url-resolvable');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-url-resolvable-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              refSet.refs[1].uri = '/home/smartbear/ex.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing unresolvable URL', () => {
          const fixturePath = path.join(rootFixturePath, '$ref-url-unresolvable');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            await expect(dereferenceThunk()).rejects.toMatchObject({
              cause: {
                cause: expect.any(ResolverError),
              },
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing Uniform Resource Name', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$ref-urn');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-urn-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing Uniform Resource Name and JSON Pointer fragment', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$ref-urn-pointer');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-urn-pointer-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  refSet,
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing Uniform Resource Name and $anchor', () => {
          const fixturePath = path.join(rootFixturePath, '$ref-urn-$anchor');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects with $ref keyword containing unresolvable Uniform Resource Name', () => {
          const fixturePath = path.join(rootFixturePath, '$ref-urn-unresolvable');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            await expect(dereferenceThunk()).rejects.toMatchObject({
              cause: {
                cause: expect.any(EvaluationJsonSchemaUriError),
              },
            });
          });
        });

        describe('given Schema Objects with $anchor keyword pointing to internal schema', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$anchor-internal');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$anchor-internal-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                  refSet,
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $anchor keyword pointing to external schema', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, '$anchor-external');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          describe('and allowMetaPatches=true', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$anchor-external-meta-patches');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs.forEach((ref) => {
                ref.uri = `/home/smartbear/${path.basename(ref.uri)}`;
              });
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches: true }),
                  ],
                  refSet,
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with various document boundaries', () => {
          const fixturePath = path.join(rootFixturePath, 'document-boundaries');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.yml');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('yaml') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects with not found $anchor', () => {
          const fixturePath = path.join(rootFixturePath, '$anchor-not-found');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            await expect(dereferenceThunk()).rejects.toMatchObject({
              cause: {
                cause: expect.any(EvaluationJsonSchema$anchorError),
              },
            });
          });
        });

        describe('given Boolean JSON Schemas', () => {
          const fixturePath = path.join(rootFixturePath, 'boolean-json-schema');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given Schema Objects and maxDepth of dereference', () => {
          const fixturePath = path.join(rootFixturePath, 'max-depth');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: { maxDepth: 2 },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            await expect(dereferenceThunk()).rejects.toMatchObject({
              cause: {
                cause: expect.any(MaximumDereferenceDepthError),
              },
            });
            await expect(dereferenceThunk()).rejects.toHaveProperty(
              'cause.cause.message',
              expect.stringMatching(/__fixtures__\/max-depth\/ex2.json"$/)
            );
          });
        });

        describe('given Schema Objects and maxDepth of resolution', () => {
          const fixturePath = path.join(rootFixturePath, 'max-depth');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
                resolve: { maxDepth: 2 },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            await expect(dereferenceThunk()).rejects.toMatchObject({
              cause: {
                cause: expect.any(MaximumResolverDepthError),
              },
            });
            await expect(dereferenceThunk()).rejects.toHaveProperty(
              'cause.cause.message',
              expect.stringMatching(/__fixtures__\/max-depth\/ex2.json"$/)
            );
          });
        });

        describe('given Schema Objects with unresolvable reference', () => {
          const fixturePath = path.join(rootFixturePath, 'unresolvable-reference');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
          });
        });

        describe('given Schema Objects with invalid JSON Pointer', () => {
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

        describe('given Schema Objects with infinite recursion', () => {
          const fixturePath = path.join(rootFixturePath, 'infinite-recursion');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
          });
        });

        describe('given Schema Objects with direct circular external reference', () => {
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

        describe('given Schema Objects with direct circular internal reference', () => {
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

        describe('given Schema Objects with indirect circular external reference', () => {
          const fixturePath = path.join(rootFixturePath, 'indirect-external-circular');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
          });

          describe('and useCircularStructures=false', () => {
            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: {
                    strategies: [
                      OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                    ],
                  },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });
        });

        describe('given Schema Objects with indirect circular internal reference', () => {
          const fixturePath = path.join(rootFixturePath, 'indirect-internal-circular');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
          });

          describe('and useCircularStructures=false', () => {
            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                  dereference: {
                    strategies: [
                      OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                    ],
                  },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });
        });
      });
    });
  });
});
