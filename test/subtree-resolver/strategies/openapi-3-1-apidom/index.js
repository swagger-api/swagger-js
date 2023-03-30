import path from 'node:path';

import SwaggerClient from '../../../../src/index.js';

const fixturePath = path.join(__dirname, '__fixtures__');

describe('subtree-resolver', () => {
  describe('OpenAPI 3.1.0 strategy', () => {
    test('should expose a resolver function', () => {
      expect(SwaggerClient.resolveSubtree).toBeInstanceOf(Function);
    });

    test('should resolve a subtree of an object, and return the targeted subtree', async () => {
      const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
      const resolvedSpec = await SwaggerClient.resolveSubtree(spec, [
        'components',
        'schemas',
        'Pets',
      ]);

      expect(resolvedSpec).toMatchSnapshot();
    });

    test('should return null when the path is invalid', async () => {
      const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
      const { spec: resolvedSpec } = await SwaggerClient.resolveSubtree(spec, ['asdfgh']);

      expect(resolvedSpec).toBeNull();
    });

    test('should not resolve an untargeted subtree', async () => {
      const spec = globalThis.loadJsonFile(path.join(fixturePath, 'petstore.json'));
      const resolvedSpec = await SwaggerClient.resolveSubtree(
        spec,
        ['components', 'schemas', 'Pets'],
        {
          returnEntireTree: true,
        }
      );

      expect(resolvedSpec).toMatchSnapshot();
    });
  });
});
