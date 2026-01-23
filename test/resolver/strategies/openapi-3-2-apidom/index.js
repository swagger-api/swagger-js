import path from 'node:path';
import * as undici from 'undici';

import SwaggerClient from '../../../../src/index.js';

const fixturePath = path.join(__dirname, '__fixtures__');

describe('resolve', () => {
  let mockAgent;
  let originalGlobalDispatcher;

  beforeEach(() => {
    mockAgent = new undici.MockAgent();
    originalGlobalDispatcher = undici.getGlobalDispatcher();
    undici.setGlobalDispatcher(mockAgent);
  });

  afterEach(() => {
    undici.setGlobalDispatcher(originalGlobalDispatcher);
    mockAgent = null;
    originalGlobalDispatcher = null;
  });

  describe('OpenAPI 3.2.0 strategy', () => {
    test('should expose a resolver function', () => {
      expect(SwaggerClient.resolve).toBeInstanceOf(Function);
    });

    test('should match OpenAPI 3.2.0 specs', () => {
      const spec = { openapi: '3.2.0', paths: {} };
      const strategy = SwaggerClient.resolveStrategies['openapi-3-2-apidom'];

      expect(strategy.match(spec)).toBe(true);
    });

    test('should not match OpenAPI 3.1.0 specs', () => {
      const spec = { openapi: '3.1.0', paths: {} };
      const strategy = SwaggerClient.resolveStrategies['openapi-3-2-apidom'];

      expect(strategy.match(spec)).toBe(false);
    });

    describe('given OpenAPI 3.2.0 definition via URL', () => {
      test('should resolve', async () => {
        const url = 'https://example.com/petstore.json';
        const mockPool = mockAgent.get('https://example.com');
        mockPool
          .intercept({ path: '/petstore.json' })
          .reply(200, globalThis.loadFile(path.join(fixturePath, 'petstore.json')));
        const resolvedSpec = await SwaggerClient.resolve({
          url,
          allowMetaPatches: false,
        });

        expect(resolvedSpec.spec.openapi).toBe('3.2.0');
        expect(resolvedSpec.spec.info.title).toBe('Swagger Petstore');
        expect(resolvedSpec.spec.paths['/pets'].get.operationId).toBe('listPets');
      });

      describe('and allowMetaPatches=true', () => {
        test('should resolve', async () => {
          const url = 'https://example.com/petstore.json';
          const mockPool = mockAgent.get('https://example.com');
          mockPool
            .intercept({ path: '/petstore.json' })
            .reply(200, globalThis.loadFile(path.join(fixturePath, 'petstore.json')));
          const resolvedSpec = await SwaggerClient.resolve({
            url,
            allowMetaPatches: true,
          });

          expect(resolvedSpec.spec.openapi).toBe('3.2.0');
        });
      });

      describe('and useCircularStructures=true', () => {
        test('should resolve circular references', async () => {
          const url = 'https://example.com/circular-refs.json';
          const mockPool = mockAgent.get('https://example.com');
          mockPool
            .intercept({ path: '/circular-refs.json' })
            .reply(200, globalThis.loadFile(path.join(fixturePath, 'circular-refs.json')));
          const resolvedSpec = await SwaggerClient.resolve({
            url,
            useCircularStructures: true,
          });

          expect(resolvedSpec.spec.openapi).toBe('3.2.0');
          expect(resolvedSpec.spec.components.schemas.Node).toBeDefined();
        });
      });

      describe('and useCircularStructures=false', () => {
        test('should resolve circular references with replacer', async () => {
          const url = 'https://example.com/circular-refs.json';
          const mockPool = mockAgent.get('https://example.com');
          mockPool
            .intercept({ path: '/circular-refs.json' })
            .reply(200, globalThis.loadFile(path.join(fixturePath, 'circular-refs.json')));
          const resolvedSpec = await SwaggerClient.resolve({
            url,
            useCircularStructures: false,
          });

          expect(resolvedSpec.spec.openapi).toBe('3.2.0');
          expect(resolvedSpec.spec.components.schemas.Node).toBeDefined();
        });
      });
    });

    describe('given OpenAPI 3.2.0 definition via spec option', () => {
      describe('and neither baseDoc nor url option is provided', () => {
        test('should resolve using implicit baseURI', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
          });

          expect(resolvedSpec.spec.openapi).toBe('3.2.0');
          expect(resolvedSpec.spec.info.title).toBe('Swagger Petstore');
        });
      });

      describe('and baseDoc option is provided', () => {
        test('should resolve', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            baseDoc: 'https://example.com/',
          });

          expect(resolvedSpec.spec.openapi).toBe('3.2.0');
        });
      });

      describe('and url option is provided', () => {
        test('should resolve', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            url: 'https://example.com/petstore.json',
          });

          expect(resolvedSpec.spec.openapi).toBe('3.2.0');
        });
      });

      describe('and skipNormalization=true', () => {
        test('should skip normalization', async () => {
          const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
          const resolvedSpec = await SwaggerClient.resolve({
            spec,
            skipNormalization: true,
          });

          expect(resolvedSpec.spec.openapi).toBe('3.2.0');
          expect(resolvedSpec.spec.$$normalized).toBeUndefined();
        });
      });
    });

    describe('$ref resolution', () => {
      test('should resolve internal $refs', async () => {
        const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
        const resolvedSpec = await SwaggerClient.resolve({ spec });

        // Check that schema $refs are resolved
        expect(
          resolvedSpec.spec.paths['/pets'].get.responses['200'].content['application/json'].schema
        ).toBeDefined();
      });
    });

    describe('normalization', () => {
      test('should normalize operation IDs', async () => {
        const spec = {
          openapi: '3.2.0',
          info: { title: 'Test', version: '1.0.0' },
          paths: {
            '/test': {
              get: {
                operationId: 'getTest',
              },
            },
          },
        };
        const resolvedSpec = await SwaggerClient.resolve({ spec });

        expect(resolvedSpec.spec.paths['/test'].get.operationId).toBe('getTest');
      });

      test('should normalize parameters from path level to operation level', async () => {
        const spec = {
          openapi: '3.2.0',
          info: { title: 'Test', version: '1.0.0' },
          paths: {
            '/test/{id}': {
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              get: {
                operationId: 'getTest',
              },
            },
          },
        };
        const resolvedSpec = await SwaggerClient.resolve({ spec });

        expect(resolvedSpec.spec.paths['/test/{id}'].get.parameters).toBeDefined();
        expect(resolvedSpec.spec.paths['/test/{id}'].get.parameters[0].name).toBe('id');
      });
    });
  });
});
