import { buildRequest } from '../../../../src/execute/index.js';

describe('OAS 3.0 - buildRequest w/ `style` & `explode` - cookie parameters', () => {
  describe('primitive values', () => {
    const VALUE = 5;

    test('default: should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=5',
        },
      });
    });

    test('should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
                  explode: false,
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=5',
        },
      });
    });

    test('should build a cookie parameter in form/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
                  explode: true,
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=5',
        },
      });
    });
  });
  describe('array values', () => {
    const VALUE = [3, 4, 5];

    test('default: should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  explode: false,
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=3%2C4%2C5',
        },
      });
    });

    test('should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
                  explode: false,
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=3%2C4%2C5',
        },
      });
    });

    test('should build a cookie parameter in form/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
                  explode: true,
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=id%3D3%26id%3D4%26id%3D5',
        },
      });
    });
  });
  describe('object values', () => {
    const VALUE = {
      role: 'admin',
      firstName: 'Alex',
    };

    test('default: should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=role%2Cadmin%2CfirstName%2CAlex',
        },
      });
    });

    test('should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
                  explode: false,
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=role%2Cadmin%2CfirstName%2CAlex',
        },
      });
    });

    test('should build a cookie parameter in form/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
                  explode: true,
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          id: VALUE,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=role%3Dadmin%26firstName%3DAlex',
        },
      });
    });
  });
});
