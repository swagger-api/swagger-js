import { buildRequest } from '../../../../src/execute/index.js';

describe('OAS 3.0 - buildRequest w/ `style` & `explode` - path parameters', () => {
  describe('primitive values', () => {
    test('default: should build a path parameter in a simple/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: 'wow!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/wow%21',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a simple/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'simple',
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
          id: 'wow!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/wow%21',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter with escaped non-RFC3986 characters', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'simple',
                  explode: false,
                  allowReserved: true,
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
          id: 'wow this is nice!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/wow%20this%20is%20nice!',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a simple/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'simple',
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
          id: 'wow!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/wow%21',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a label/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: 'wow!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.wow%21',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a label/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: 'wow!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.wow%21',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a matrix/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: 'wow!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=wow%21',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a matrix/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: 'wow!',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=wow%21',
        credentials: 'same-origin',
        headers: {},
      });
    });
  });
  describe('array values', () => {
    test('default: should build a path parameter in a simple/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: [3, 4, 5],
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/3,4,5',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a simple/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'simple',
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
          id: [3, 4, 5],
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/3,4,5',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a simple/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'simple',
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
          id: [3, 4, 5],
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/3,4,5',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a label/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: [3, 4, 5],
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.3.4.5',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a label/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: [3, 4, 5],
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.3.4.5',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a matrix/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: [3, 4, 5],
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=3,4,5',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a matrix/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: [3, 4, 5],
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=3;id=4;id=5',
        credentials: 'same-origin',
        headers: {},
      });
    });
  });
  describe('object values', () => {
    test('default: should build a path parameter in a simple/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: {
            role: 'admin',
            firstName: 'Alex',
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/role,admin,firstName,Alex',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a simple/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'simple',
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
          id: {
            role: 'admin',
            firstName: 'Alex',
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/role,admin,firstName,Alex',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a simple/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'simple',
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
          id: {
            role: 'admin',
            firstName: 'Alex',
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/role=admin,firstName=Alex',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a label/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: {
            role: 'admin',
            firstName: 'Alex',
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.role.admin.firstName.Alex',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a label/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: {
            role: 'admin',
            firstName: 'Alex',
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.role=admin.firstName=Alex',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a matrix/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: {
            role: 'admin',
            firstName: 'Alex',
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=role,admin,firstName,Alex',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a path parameter in a matrix/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: {
            role: 'admin',
            firstName: 'Alex',
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;role=admin;firstName=Alex',
        credentials: 'same-origin',
        headers: {},
      });
    });
  });
});
