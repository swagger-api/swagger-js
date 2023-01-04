import path from 'node:path';
import fetchMock from 'fetch-mock';

import Swagger from '../../../../src/index.js';

const fixturePath = path.join(__dirname, '__fixtures__');

describe('resolve', () => {
  describe('OpenAPI 3.1.0 strategy', () => {
    test('should expose a resolver function', () => {
      expect(Swagger.resolve).toBeInstanceOf(Function);
    });

    describe('given OpenAPI 3.1.0 definition', () => {
      test('should resolve', async () => {
        const url = 'https://example.com/petstore.json';
        const response = new Response(globalThis.loadFile(path.join(fixturePath, 'petstore.json')));
        fetchMock.get(url, response, { repeat: 1 });
        const resolvedSpec = await Swagger.resolve({
          url: 'https://example.com/petstore.json',
        });

        expect(resolvedSpec).toMatchSnapshot();

        fetchMock.restore();
      });
    });
  });
});
