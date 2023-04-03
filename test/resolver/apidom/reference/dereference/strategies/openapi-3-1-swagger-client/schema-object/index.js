import path from 'node:path';
import { toValue, toJSON } from '@swagger-api/apidom-core';
import { isSchemaElement, mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import { evaluate } from '@swagger-api/apidom-json-pointer';
import { dereference, resolve } from '@swagger-api/apidom-reference/configuration/empty';

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
              const fixturePath = path.join(rootFixturePath, 'cycle-internal-circular-structures');
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

              expect(typeof toJSON(actual)).toBe('string');
              expect(toValue(actual)).toEqual(expected);
            });

            describe('and using HTTP protocol', () => {
              test('should make JSON Pointer absolute', async () => {
                const fixturePath = path.join(
                  rootFixturePath,
                  'cycle-internal-http-circular-structures'
                );
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

        describe('given Schema Objects with advanced internal cycles', () => {
          test('should dereference', async () => {
            const fixturePath = path.join(rootFixturePath, 'cycle-internal-advanced');
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const parent = evaluate(
              '/0/components/schemas/PlatformMenuTreeNode/properties/children/items',
              dereferenced
            );
            const cyclicParent = evaluate(
              '/0/components/schemas/PlatformMenuTreeNode/properties/children/items/properties/children/items',
              dereferenced
            );

            expect(parent).toStrictEqual(cyclicParent);
          });

          describe('and useCircularStructures=false', () => {
            test('should avoid cycles by skipping transclusion', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                'cycle-internal-advanced-circular-structures'
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
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
              expect(toValue(actual)).toEqual(expected);
            });

            describe('and using HTTP protocol', () => {
              test('should make JSON Pointer absolute', async () => {
                const fixturePath = path.join(
                  rootFixturePath,
                  'cycle-internal-http-circular-structures'
                );
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
              const fixturePath = path.join(rootFixturePath, 'cycle-external-circular-structures');
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

              expect(typeof toJSON(actual)).toBe('string');
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$id-uri-direct-circular-structures');
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
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$id-uri-enclosing-circular-structures'
              );
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
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$id-uri-external-circular-structures'
              );
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
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with unresolvable $id values', () => {
          const fixturePath = path.join(rootFixturePath, '$id-unresolvable');
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
              baseDoc: expect.stringMatching(/\$id-unresolvable\/root\.json$/),
              $ref: './ex.json',
              fullPath: ['components', 'schemas', 'User', 'properties', 'profile', '$ref'],
            });
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-url-circular-structures');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
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

              expect(typeof toJSON(actual)).toBe('string');
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$ref-url-relative-reference-circular-structures'
              );
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
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

              expect(typeof toJSON(actual)).toBe('string');
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$ref-url-pointer-circular-structures'
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
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$ref-url-resolvable-circular-structures'
              );
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
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
              expect(toValue(actual)).toEqual(expected);
            });
          });
        });

        describe('given Schema Objects with $ref keyword containing unresolvable URL', () => {
          const fixturePath = path.join(rootFixturePath, '$ref-url-unresolvable');
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
              baseDoc: expect.stringMatching(/\$ref-url-unresolvable\/root\.json$/),
              $ref: './ex.json',
              fullPath: ['components', 'schemas', 'User', 'properties', 'profile', '$ref'],
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(rootFixturePath, '$ref-urn-circular-structures');
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
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

              expect(typeof toJSON(actual)).toBe('string');
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
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { maxDepth: 2 },
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
                /^Could not resolve reference: Evaluation failed on URI:/
              ),
              baseDoc: expect.stringMatching(/\$ref-urn-unresolvable\/root\.json$/),
              $ref: 'urn:uuid:3',
              fullPath: ['components', 'schemas', 'User', 'properties', 'profile', '$ref'],
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$anchor-internal-circular-structures'
              );
              const rootFilePath = path.join(fixturePath, 'root.json');
              const refSet = await resolve(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              refSet.refs[0].uri = '/home/smartbear/root.json';
              const actual = await dereference(refSet.refs[0].uri, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                  refSet,
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
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

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const fixturePath = path.join(
                rootFixturePath,
                '$anchor-external-circular-structures'
              );
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
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                  refSet,
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
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
                /^Could not resolve reference: Evaluation failed on token:/
              ),
              baseDoc: expect.stringMatching(/\$anchor-not-found\/root\.json$/),
              $ref: '#user-profile',
              fullPath: ['components', 'schemas', 'User', 'properties', 'profile', '$ref'],
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
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: { maxDepth: 2 },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
            const errors = [];

            await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              dereference: {
                maxDepth: 2,
                dereferenceOpts: { errors },
              },
            });

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Maximum dereference depth/
              ),
              baseDoc: expect.stringMatching(/max-depth\/ex2\.json$/),
              $ref: './ex3.json',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });
        });

        describe('given Schema Objects and maxDepth of resolution', () => {
          const fixturePath = path.join(rootFixturePath, 'max-depth');
          const rootFilePath = path.join(fixturePath, 'root.json');

          test('should dereference', async () => {
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { maxDepth: 2 },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should collect error', async () => {
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
              $ref: './ex3.json',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });
        });

        describe('given Schema Objects with unresolvable reference', () => {
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
              message: expect.stringMatching(
                /^Could not resolve reference: Evaluation failed on token/
              ),
              baseDoc: expect.stringMatching(/unresolvable-reference\/root\.json$/),
              $ref: '#/components/schemas/UserProfile',
              fullPath: ['components', 'schemas', 'User', 'properties', 'profile', '$ref'],
            });
          });
        });

        describe('given Schema Objects with invalid JSON Pointer', () => {
          const fixturePath = path.join(rootFixturePath, 'invalid-pointer');
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
                /^Could not resolve reference: Evaluation failed on token/
              ),
              baseDoc: expect.stringMatching(/invalid-pointer\/root\.json$/),
              $ref: '#/components/schemas/invalid-pointer',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });
        });

        describe('given Schema Objects with infinite recursion', () => {
          const fixturePath = path.join(rootFixturePath, 'infinite-recursion');
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
                /^Could not resolve reference: Recursive Schema Object reference detected/
              ),
              baseDoc: expect.stringMatching(/infinite-recursion\/root\.json$/),
              $ref: '#/components/schemas/User',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });
        });

        describe('given Schema Objects with direct circular external reference', () => {
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
                /^Could not resolve reference: Recursive Schema Object reference detected/
              ),
              baseDoc: expect.stringMatching(/direct-external-circular\/ex\.json$/),
              $ref: './root.json#/components/schemas/User',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });
        });

        describe('given Schema Objects with direct circular internal reference', () => {
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
                /^Could not resolve reference: Recursive Schema Object reference detected/
              ),
              baseDoc: expect.stringMatching(/direct-internal-circular\/root\.json$/),
              $ref: '#/components/schemas/User',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });
        });

        describe('given Schema Objects with indirect circular external reference', () => {
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
                /^Could not resolve reference: Recursive Schema Object reference detected/
              ),
              baseDoc: expect.stringMatching(/indirect-external-circular\/ex3\.json$/),
              $ref: './root.json#/components/schemas/User',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
              expect(toValue(actual)).toEqual(expected);
            });

            test('should collect error', async () => {
              const errors = [];

              await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  dereferenceOpts: { errors },
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });

              expect(errors).toHaveLength(1);
              expect(errors[0]).toMatchObject({
                message: expect.stringMatching(
                  /^Could not resolve reference: Recursive Schema Object reference detected/
                ),
                baseDoc: expect.stringMatching(/indirect-external-circular\/ex3\.json$/),
                $ref: './root.json#/components/schemas/User',
                fullPath: ['components', 'schemas', 'User', '$ref'],
              });
            });
          });
        });

        describe('given Schema Objects with indirect circular internal reference', () => {
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

            expect(errors).toHaveLength(1);
            expect(errors[0]).toMatchObject({
              message: expect.stringMatching(
                /^Could not resolve reference: Recursive Schema Object reference detected/
              ),
              baseDoc: expect.stringMatching(/indirect-internal-circular\/root\.json$/),
              $ref: '#/components/schemas/User',
              fullPath: ['components', 'schemas', 'User', '$ref'],
            });
          });

          describe('and useCircularStructures=false', () => {
            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(typeof toJSON(actual)).toBe('string');
              expect(toValue(actual)).toEqual(expected);
            });

            test('should collect error', async () => {
              const errors = [];

              await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
                dereference: {
                  dereferenceOpts: { errors },
                  strategies: [
                    OpenApi3_1SwaggerClientDereferenceStrategy({ useCircularStructures: false }),
                  ],
                },
              });

              expect(errors).toHaveLength(1);
              expect(errors[0]).toMatchObject({
                message: expect.stringMatching(
                  /^Could not resolve reference: Recursive Schema Object reference detected/
                ),
                baseDoc: expect.stringMatching(/indirect-internal-circular\/root\.json$/),
                $ref: '#/components/schemas/User',
                fullPath: ['components', 'schemas', 'User', '$ref'],
              });
            });
          });
        });
      });
    });
  });
});
