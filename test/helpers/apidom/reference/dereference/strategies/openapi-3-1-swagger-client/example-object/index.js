import path from 'node:path';
import { toValue } from '@swagger-api/apidom-core';
import { mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import { dereference, DereferenceError } from '@swagger-api/apidom-reference/configuration/empty';

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
      describe('Example Object', () => {
        describe('given in components/examples field', () => {
          const fixturePath = path.join(rootFixturePath, 'components-examples');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given in Parameter Object', () => {
          const fixturePath = path.join(rootFixturePath, 'parameter-object');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given in Media Type Object', () => {
          const fixturePath = path.join(rootFixturePath, 'media-type-object');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });
        });

        describe('given externalValue field', () => {
          describe('and pointing to a JSON file', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-json');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('and pointing to a JSON file and having JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-pointer');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('and pointing to a YAML file', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-yaml');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('and pointing to a text file', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-text');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('and pointing to a binary file', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-binary');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });
          });

          describe('and with unresolvable URI', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-unresolvable');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });

          describe('with external resolution disabled', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-ignore-external');

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

          describe('given both value and externalValue fields are defined', () => {
            const fixturePath = path.join(rootFixturePath, 'external-value-value-both-defined');

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
