import path from 'node:path';
import { mediaTypes, isExampleElement } from '@swagger-api/apidom-ns-openapi-3-1';
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
      describe('Example Object', () => {
        describe('given single ExampleElement passed to dereferenceApiDOM', () => {
          const fixturePath = path.join(
            __dirname,
            '__fixtures__',
            'external-value-json',
            'root.json'
          );

          test('should dereference', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const exampleElement = evaluate('/components/examples/example1', parseResult.api);
            const dereferenced = await dereferenceApiDOM(exampleElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: fixturePath },
            });

            expect(isExampleElement(dereferenced)).toBe(true);
          });

          test('should dereference and contain metadata about origin', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const exampleElement = evaluate('/components/examples/example1', parseResult.api);
            const dereferenced = await dereferenceApiDOM(exampleElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: fixturePath },
            });

            expect(dereferenced.value?.meta.get('ref-origin').toValue()).toEqual(
              expect.stringMatching(/external-value-json\/ex\.json$/)
            );
          });
        });
      });
    });
  });
});
