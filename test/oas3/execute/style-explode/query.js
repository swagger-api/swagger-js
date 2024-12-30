import { buildRequest } from '../../../../src/execute/index.js';

// Expecting the space to become `%20`, not `+`, because it's just better that way
// See: https://stackoverflow.com/a/40292688
const UNSAFE_INPUT = ' <>"%{}|\\^';
const UNSAFE_INPUT_RESULT = '%20%3C%3E%22%25%7B%7D%7C%5C%5E';

const RESERVED_INPUT = ":/?#[]@!$&'()*+,;=";
// !allowReserved
const RESERVED_INPUT_ENCODED_RESULT = '%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D';
// !!allowReserved
const RESERVED_INPUT_UNENCODED_RESULT = RESERVED_INPUT;

const SAFE_INPUT = 'This.Shouldnt_Be~Encoded-1234';
const SAFE_INPUT_RESULT = SAFE_INPUT; // should be the same

describe('OAS 3.0 - buildRequest w/ `style` & `explode` - query parameters', () => {
  describe('primitive values', () => {
    const VALUE = SAFE_INPUT;

    test('default: should build a query parameter in form/explode format', () => {
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
                  in: 'query',
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
        url: `/users?id=${VALUE}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter with escaped non-RFC3986 characters', () => {
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
                  in: 'query',
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
          id: UNSAFE_INPUT,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${UNSAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter with escaped non-RFC3986 characters with allowReserved', () => {
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
                  in: 'query',
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
          // these characters taken from RFC1738 Section 2.2
          // https://tools.ietf.org/html/rfc1738#section-2.2, "Unsafe"
          id: UNSAFE_INPUT,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        // FIXME: ~ should be encoded as well
        url: `/users?id=${UNSAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter with escaped non-RFC3986 characters in parameter name', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id[role]',
                  in: 'query',
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
          'id[role]': 'admin',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users?id%5Brole%5D=admin',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build an empty query parameter with escaped non-RFC3986 characters in parameter name', () => {
      // Given
      const spec = {
        openapi: '3.0.4',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id[role]',
                  in: 'query',
                  allowEmptyValue: true,
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
          'id[role]': '',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users?id%5Brole%5D=',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/explode format', () => {
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
                  in: 'query',
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
        url: `/users?id=${VALUE}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format', () => {
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
                  in: 'query',
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
        url: `/users?id=${VALUE}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format with allowReserved', () => {
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
                  in: 'query',
                  style: 'form',
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
          id: RESERVED_INPUT,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${RESERVED_INPUT_UNENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format with percent-encoding if allowReserved is not set', () => {
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
                  in: 'query',
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
          id: RESERVED_INPUT,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${RESERVED_INPUT_ENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });
  });
  describe('array values', () => {
    const VALUE = [3, 4, 5, SAFE_INPUT];

    test('default: should build a query parameter in form/explode format', () => {
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
                  in: 'query',
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
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter with escaped non-RFC3986 characters', () => {
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
                  in: 'query',
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
          id: VALUE.concat([UNSAFE_INPUT]),
        },
      });

      expect(req).toEqual({
        method: 'GET',
        // FIXME: ~ should be encoded as well
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}&id=${UNSAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter with escaped non-RFC3986 characters with allowReserved', () => {
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
                  in: 'query',
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
          id: VALUE.concat([UNSAFE_INPUT]),
        },
      });

      expect(req).toEqual({
        method: 'GET',
        // FIXME: ~ should be encoded as well
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}&id=${UNSAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/explode format', () => {
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
                  in: 'query',
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
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format', () => {
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
                  in: 'query',
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
        url: `/users?id=3,4,5,${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format with allowReserved', () => {
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
                  in: 'query',
                  style: 'form',
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
          id: RESERVED_INPUT.split(''),
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${RESERVED_INPUT_UNENCODED_RESULT.split('').join(',')}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format without allowReserved', () => {
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
                  in: 'query',
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
          id: RESERVED_INPUT.split(''),
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/users?id=%3A,%2F,%3F,%23,%5B,%5D,%40,%21,%24,%26,%27,%28,%29,%2A,%2B,%2C,%3B,%3D',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in space-delimited/explode format', () => {
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
                  in: 'query',
                  style: 'spaceDelimited',
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
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in space-delimited/explode format with allowReserved', () => {
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
                  in: 'query',
                  style: 'spaceDelimited',
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
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in space-delimited/no-explode format', () => {
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
                  in: 'query',
                  style: 'spaceDelimited',
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
        url: `/users?id=3%204%205%20${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in pipe-delimited/explode format', () => {
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
                  in: 'query',
                  style: 'pipeDelimited',
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
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in pipe-delimited/explode format with allowReserved', () => {
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
                  in: 'query',
                  style: 'pipeDelimited',
                  explode: true,
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
          id: VALUE.concat([RESERVED_INPUT]),
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=3&id=4&id=5&id=${SAFE_INPUT_RESULT}&id=${RESERVED_INPUT_UNENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in pipe-delimited/no-explode format', () => {
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
                  in: 'query',
                  style: 'pipeDelimited',
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
        url: `/users?id=3|4|5|${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in pipe-delimited/no-explode format with allowReserved', () => {
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
                  in: 'query',
                  style: 'pipeDelimited',
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
          id: VALUE.concat([RESERVED_INPUT]),
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=3|4|5|${SAFE_INPUT_RESULT}|${RESERVED_INPUT_UNENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });
  });
  describe('object values', () => {
    const VALUE = {
      role: 'admin',
      firstName: 'Alex',
      greeting: SAFE_INPUT,
    };

    test('default: should build a query parameter in form/explode format', () => {
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
                  in: 'query',
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
        url: `/users?role=admin&firstName=Alex&greeting=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should handle building a query parameter in form/explode format, with a stringified object provided, if schema type is indicated', () => {
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
                  in: 'query',
                  schema: {
                    type: 'object',
                  },
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
          id: JSON.stringify(VALUE),
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?role=admin&firstName=Alex&greeting=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter with escaped non-RFC3986 characters', () => {
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
                  in: 'query',
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
            firstName: UNSAFE_INPUT,
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?role=admin&firstName=${UNSAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter with escaped non-RFC3986 characters with allowReserved', () => {
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
                  in: 'query',
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
          id: {
            role: 'admin',
            firstName: UNSAFE_INPUT,
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?role=admin&firstName=${UNSAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/explode format', () => {
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
                  in: 'query',
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
        url: `/users?role=admin&firstName=Alex&greeting=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format', () => {
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
                  in: 'query',
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
        url: `/users?id=role,admin,firstName,Alex,greeting,${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format with allowReserved', () => {
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
                  in: 'query',
                  style: 'form',
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
          id: {
            role: 'admin',
            firstName: RESERVED_INPUT,
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=role,admin,firstName,${RESERVED_INPUT_UNENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in form/no-explode format without allowReserved', () => {
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
                  in: 'query',
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
          id: {
            role: 'admin',
            firstName: RESERVED_INPUT,
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=role,admin,firstName,${RESERVED_INPUT_ENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should build a query parameter in deepObject/explode format', () => {
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
                  in: 'query',
                  style: 'deepObject',
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
        url: `/users?id%5Brole%5D=admin&id%5BfirstName%5D=Alex&id%5Bgreeting%5D=${SAFE_INPUT_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      });
    });
  });
});
