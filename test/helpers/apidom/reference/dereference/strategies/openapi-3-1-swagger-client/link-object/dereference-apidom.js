import path from 'node:path';
import { mediaTypes, isLinkElement, isOperationElement } from '@swagger-api/apidom-ns-openapi-3-1';
import { evaluate } from '@swagger-api/apidom-json-pointer';
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
      describe('Link Object', () => {
        describe('given single LinkElement passed to dereferenceApiDOM', () => {
          const fixturePath = path.join(
            __dirname,
            '__fixtures__',
            'operation-ref-external',
            'root.json'
          );

          test('should dereference', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const linkElement = evaluate('/components/links/link1', parseResult.api);
            const dereferenced = await dereferenceApiDOM(linkElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: fixturePath },
            });

            expect(isLinkElement(dereferenced)).toBe(true);
            expect(isOperationElement(dereferenced.operationRef?.meta.get('operation'))).toBe(true);
          });

          test('should dereference and contain metadata about origin', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const linkElement = evaluate('/components/links/link1', parseResult.api);
            const dereferenced = await dereferenceApiDOM(linkElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: fixturePath },
            });

            expect(
              dereferenced.operationRef?.meta.get('operation').meta.get('ref-origin').toValue()
            ).toEqual(expect.stringMatching(/operation-ref-external\/ex\.json$/));
          });
        });
      });
    });
  });
});
