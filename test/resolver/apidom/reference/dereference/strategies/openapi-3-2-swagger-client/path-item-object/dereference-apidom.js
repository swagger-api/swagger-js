import path from 'node:path';
import { mediaTypes, isPathItemElement } from '@swagger-api/apidom-ns-openapi-3-2';
import { evaluate, compile } from '@swagger-api/apidom-json-pointer';
import { parse, dereferenceApiDOM } from '@swagger-api/apidom-reference/configuration/empty';

import * as jestSetup from '../__utils__/jest.local.setup.js';

describe('dereference', () => {
  beforeAll(() => {
    jestSetup.beforeAll();
  });

  afterAll(() => {
    jestSetup.afterAll();
  });

  describe('strategies', () => {
    describe('openapi-3-2-swagger-client', () => {
      describe('Path Item Object', () => {
        describe('given single PathItemElement passed to dereferenceApiDOM with internal references', () => {
          const fixturePath = path.join(__dirname, '__fixtures__', 'internal-only', 'root.json');

          test('should dereference', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const jsonPointer = compile(['paths', '/users']);
            const pathItemElement = evaluate(jsonPointer, parseResult.api);
            const dereferenced = await dereferenceApiDOM(pathItemElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: `${fixturePath}#${jsonPointer}` },
            });

            expect(isPathItemElement(dereferenced)).toBe(true);
          });

          test('should dereference and contain metadata about origin', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const jsonPointer = compile(['paths', '/users']);
            const pathItemElement = evaluate(jsonPointer, parseResult.api);
            const dereferenced = await dereferenceApiDOM(pathItemElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: `${fixturePath}#${jsonPointer}` },
            });

            expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
              expect.stringMatching(/internal-only\/root\.json$/)
            );
          });
        });
      });
    });
  });
});
