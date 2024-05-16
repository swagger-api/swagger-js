import path from 'node:path';
import { mediaTypes, isSchemaElement } from '@swagger-api/apidom-ns-openapi-3-1';
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
      describe('Schema Object', () => {
        describe('given single SchemaElement passed to dereferenceApiDOM with internal references', () => {
          const fixturePath = path.join(__dirname, '__fixtures__', 'internal-only', 'root.json');

          test('should dereference', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const schemaElement = evaluate(
              '/components/schemas/User/properties/profile',
              parseResult.api
            );
            const dereferenced = await dereferenceApiDOM(schemaElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: `${fixturePath}#/components/schemas/User/properties/profile` },
            });

            expect(isSchemaElement(dereferenced)).toBe(true);
          });

          test('should dereference and contain metadata about origin', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const schemaElement = evaluate(
              '/components/schemas/User/properties/profile',
              parseResult.api
            );
            const dereferenced = await dereferenceApiDOM(schemaElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: `${fixturePath}#/components/schemas/User/properties/profile` },
            });

            expect(dereferenced.meta.get('ref-origin').toValue()).toEqual(
              expect.stringMatching(/internal-only\/root\.json$/)
            );
          });
        });

        describe('given single SchemaElement passed to dereferenceApiDOM with external references', () => {
          const fixturePath = path.join(__dirname, '__fixtures__', 'external-only', 'root.json');

          test('should dereference', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const schemaElement = evaluate(
              '/components/schemas/User/properties/profile',
              parseResult.api
            );
            const dereferenced = await dereferenceApiDOM(schemaElement, {
              parse: { mediaType: mediaTypes.latest('json') },
              resolve: { baseURI: fixturePath },
            });

            expect(isSchemaElement(dereferenced)).toBe(true);
          });

          test('should dereference and contain metadata about origin', async () => {
            const parseResult = await parse(fixturePath, {
              parse: { mediaType: mediaTypes.latest('json') },
            });
            const schemaElement = evaluate(
              '/components/schemas/User/properties/profile',
              parseResult.api
            );
            const dereferenced = await dereferenceApiDOM(schemaElement, {
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
