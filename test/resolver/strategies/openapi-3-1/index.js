import path from 'node:path';
import fetchMock from 'fetch-mock';
import { EvaluationJsonPointerError } from '@swagger-api/apidom-json-pointer';

import SwaggerClient from '../../../../src/index.js';

const fixturePath = path.join(__dirname, '__fixtures__');

describe('resolve', () => {
  describe('OpenAPI 3.1.0 strategy', () => {
    test('should expose a resolver function', () => {
      expect(SwaggerClient.resolve).toBeInstanceOf(Function);
    });

    describe('given OpenAPI 3.1.0 definition via URL', () => {
      test('should resolve', async () => {
        const url = 'https://example.com/petstore.json';
        const response = new Response(globalThis.loadFile(path.join(fixturePath, 'petstore.json')));
        fetchMock.get(url, response, { repeat: 1 });
        const resolvedSpec = await SwaggerClient.resolve({
          url: 'https://example.com/petstore.json',
          allowMetaPatches: false,
        });

        expect(resolvedSpec).toMatchSnapshot();

        fetchMock.restore();
      });

      describe('and allowMetaPatches=true', () => {
        test('should resolve', async () => {
          const url = 'https://example.com/petstore.json';
          const response = new Response(
            globalThis.loadFile(path.join(fixturePath, 'petstore.json'))
          );
          fetchMock.get(url, response, { repeat: 1 });
          const resolvedSpec = await SwaggerClient.resolve({
            url: 'https://example.com/petstore.json',
            allowMetaPatches: true,
          });

          expect(resolvedSpec).toMatchSnapshot();

          fetchMock.restore();
        });
      });

      describe('and allowMetaPatches=false', () => {
        test('should resolve', async () => {
          const url = 'https://example.com/petstore.json';
          const response = new Response(
            globalThis.loadFile(path.join(fixturePath, 'petstore.json'))
          );
          fetchMock.get(url, response, { repeat: 1 });
          const resolvedSpec = await SwaggerClient.resolve({
            url: 'https://example.com/petstore.json',
            allowMetaPatches: false,
          });

          expect(resolvedSpec).toMatchSnapshot();

          fetchMock.restore();
        });
      });

      describe('and useCircularStructures=true', () => {
        test('should resolve', async () => {
          const url = 'https://example.com/circular-structures.json';
          const response = new Response(
            globalThis.loadFile(path.join(fixturePath, 'circular-structures.json'))
          );
          fetchMock.get(url, response, { repeat: 1 });
          const resolvedSpec = await SwaggerClient.resolve({
            url: 'https://example.com/circular-structures.json',
            useCircularStructures: true,
          });

          expect(resolvedSpec).toMatchSnapshot();

          fetchMock.restore();
        });
      });

      describe('and useCircularStructures=false', () => {
        test('should resolve', async () => {
          const url = 'https://example.com/circular-structures.json';
          const response = new Response(
            globalThis.loadFile(path.join(fixturePath, 'circular-structures.json'))
          );
          fetchMock.get(url, response, { repeat: 1 });
          const resolvedSpec = await SwaggerClient.resolve({
            url: 'https://example.com/circular-structures.json',
            useCircularStructures: false,
          });

          expect(resolvedSpec).toMatchSnapshot();

          fetchMock.restore();
        });
      });
    });

    describe('given OpenAPI 3.1.0 definition via spec option', () => {
      describe('and neither baseDoc nor url option is provided', () => {
        test('should resolve', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({ spec });

          expect(resolvedSpec).toMatchSnapshot();
        });
      });

      describe('and baseDoc option is provided', () => {
        test('should resolve', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            baseDoc: 'https://example.com/',
          });

          expect(resolvedSpec).toMatchSnapshot();
        });
      });

      describe('and url option is provided', () => {
        test('should resolve', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            url: 'https://example.com/',
          });

          expect(resolvedSpec).toMatchSnapshot();
        });
      });

      describe('and skipNormalization=true', () => {
        test('should resolve and skip normalization', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            skipNormalization: true,
          });

          expect(resolvedSpec).toMatchSnapshot();
        });
      });

      describe('and skipNormalization=false', () => {
        test('should resolve and normalize', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            skipNormalization: false,
          });

          expect(resolvedSpec).toMatchSnapshot();
        });
      });

      describe('and pathDiscriminator is empty list', () => {
        test('should resolve entire spec', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            pathDiscriminator: [],
          });

          expect(resolvedSpec).toMatchSnapshot();
        });
      });

      describe('and pathDiscriminator=[paths, /pets]', () => {
        test('should resolve within the pathDiscriminator', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            pathDiscriminator: ['paths', '/pets'],
          });

          expect(resolvedSpec).toMatchSnapshot();
        });
      });

      describe('and pathDiscriminator compiles into invalid JSON Pointer', () => {
        test('should throw error', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolveThunk = () =>
            SwaggerClient.resolve({
              spec,
              pathDiscriminator: ['path', 'to', 'nothing'],
            });

          await expect(resolveThunk()).rejects.toThrow(EvaluationJsonPointerError);
        });
      });
    });
  });
});
