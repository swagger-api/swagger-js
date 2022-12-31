import path from 'node:path';
import { toValue } from '@swagger-api/apidom-core';
import { isOperationElement, mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import { evaluate } from '@swagger-api/apidom-json-pointer';
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
      describe('Link Object', () => {
        describe('given in components/links field', () => {
          const fixturePath = path.join(rootFixturePath, 'components-links');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should set Operation Object as metadata of Link.operationId field', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const link1 = evaluate('/0/components/links/link1', dereferenced);
            const link2 = evaluate('/0/components/links/link2', dereferenced);

            expect(isOperationElement(link1.operationId?.meta.get('operation'))).toBe(true);
            expect(isOperationElement(link2.operationId?.meta.get('operation'))).toBe(true);
          });
        });

        describe('given in Response Object', () => {
          const fixturePath = path.join(rootFixturePath, 'response-object');

          test('should dereference', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const actual = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

            expect(toValue(actual)).toEqual(expected);
          });

          test('should set Operation Object as metadata of Link.operationId field', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenced = await dereference(rootFilePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const link1 = evaluate('/0/components/responses/201/links/link', dereferenced);
            const link2 = evaluate('/0/components/links/link1', dereferenced);

            expect(isOperationElement(link1.operationId?.meta.get('operation'))).toBe(true);
            expect(isOperationElement(link2.operationId?.meta.get('operation'))).toBe(true);
          });
        });

        describe('given operationRef field', () => {
          describe('and with internal JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'operation-ref-internal');

            test('should dereference', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });

            test('should set Operation Object as metadata of Link.operationRef field', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenced = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const link1 = evaluate('/0/components/links/link1', dereferenced);

              expect(isOperationElement(link1.operationRef?.meta.get('operation'))).toBe(true);
            });
          });

          describe('and with external JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'operation-ref-external');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });

            test('should apply semantics to external fragment', async () => {
              const dereferenced = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

              expect(
                isOperationElement(dereferenced.api.components.links.get('link1').operation)
              ).toBe(true);
            });

            test('should set Operation Object as metadata of Link.operationRef field', async () => {
              const dereferenced = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const link1 = evaluate('/0/components/links/link1', dereferenced);

              expect(isOperationElement(link1.operationRef?.meta.get('operation'))).toBe(true);
            });
          });

          describe('with external resolution disabled', () => {
            const fixturePath = path.join(rootFixturePath, 'operation-ref-ignore-external');

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

          describe('and with invalid JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'operation-ref-invalid-pointer');

            test('should throw error', async () => {
              const rootFilePath = path.join(fixturePath, 'root.json');
              const dereferenceThunk = () =>
                dereference(rootFilePath, {
                  parse: { mediaType: mediaTypes.latest('json') },
                });

              await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            });
          });

          describe('and with unresolvable JSON Pointer', () => {
            const fixturePath = path.join(rootFixturePath, 'operation-ref-unresolvable');

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

        describe('given operationId field', () => {
          describe('and OperationElement with operationId exists', () => {
            const fixturePath = path.join(rootFixturePath, 'operation-id');
            const rootFilePath = path.join(fixturePath, 'root.json');

            test('should dereference', async () => {
              const actual = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const expected = globalThis.loadJsonFile(path.join(fixturePath, 'dereferenced.json'));

              expect(toValue(actual)).toEqual(expected);
            });

            test('should set Operation Object as metadata of Link.operationId field', async () => {
              const dereferenced = await dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });
              const link1 = evaluate('/0/components/links/link1', dereferenced);

              expect(isOperationElement(link1.operationId?.meta.get('operation'))).toBe(true);
            });
          });

          describe("and OperationElement with operationId doesn't exist", () => {
            const fixturePath = path.join(rootFixturePath, 'operation-id-non-existent');

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

        describe('given both operationRef and operationId fields are defined', () => {
          const fixturePath = path.join(rootFixturePath, 'operation-ref-id-both-defined');

          test('should throw error', async () => {
            const rootFilePath = path.join(fixturePath, 'root.json');
            const dereferenceThunk = () =>
              dereference(rootFilePath, {
                parse: { mediaType: mediaTypes.latest('json') },
              });

            await expect(dereferenceThunk()).rejects.toThrow(DereferenceError);
            await expect(dereferenceThunk()).rejects.toHaveProperty(
              'cause.cause.message',
              'LinkElement operationRef and operationId fields are mutually exclusive.'
            );
          });
        });
      });
    });
  });
});
