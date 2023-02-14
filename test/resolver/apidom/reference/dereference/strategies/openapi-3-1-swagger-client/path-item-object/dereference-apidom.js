import path from 'node:path';
import { mediaTypes, isPathItemElement } from '@swagger-api/apidom-ns-openapi-3-1';
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
    describe('openapi-3-1-swagger-client', () => {
      describe('Path Item Object', () => {
        describe('given single PathItemElement passed to dereferenceApiDOM', () => {
          const fixturePath = path.join(__dirname, '__fixtures__', 'external-only', 'root.json');

          test('should dereference', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const pathItemElement = evaluate(compile(['paths', '/path1']), parseResult.api);
            const dereferenced = await dereferenceApiDOM(pathItemElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: fixturePath },
            });

            expect(isPathItemElement(dereferenced)).toBe(true);
          });

          test('should dereference and contain metadata about origin', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const pathItemElement = evaluate(compile(['paths', '/path1']), parseResult.api);
            const dereferenced = await dereferenceApiDOM(pathItemElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: fixturePath },
            });

            expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
              expect.stringMatching(/external-only\/ex\.json$/)
            );
          });
        });
      });
    });
  });
});
