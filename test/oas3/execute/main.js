import path from 'path';
import fs from 'fs';
import jsYaml from 'js-yaml';
import { escape } from 'querystring';

import { buildRequest, baseUrl } from '../../../src/execute/index.js';

const petstoreSpec = jsYaml.load(
  fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8')
);

// Supported shape...  { spec, operationId, parameters, securities, fetch }
// One can use operationId or pathItem + method

describe('buildRequest - OpenAPI Specification 3.0', () => {
  describe('fundamentals', () => {
    it('should build a request for the given operationId', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getMe',
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/one',
        credentials: 'same-origin',
        headers: {},
      });
    });

    it('should build a twice-included path parameter request', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/one/{myParam}/{myParam}': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'myParam',
                  in: 'path',
                  required: true,
                  schema: {
                    type: 'string',
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
        operationId: 'getMe',
        parameters: {
          myParam: 'hi',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/one/hi/hi',
        credentials: 'same-origin',
        headers: {},
      });
    });
    it('should build a request for the given operationId, using the first server by default', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
          {
            url: 'http://not-real-petstore.swagger.io/v2',
            name: 'Fake Petstore (should not be selected)',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      // when
      const req = buildRequest({ spec, operationId: 'getMe' });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {},
      });
    });

    it('should build a request for the given operationId, using a specfied server', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://not-real-petstore.swagger.io/v2',
            name: 'Fake Petstore (should not be selected)',
          },
          {
            url: 'http://petstore.swagger.io/{version}',
            name: 'Petstore',
            variables: {
              version: {
                default: 'v1',
              },
            },
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        server: 'http://petstore.swagger.io/{version}',
        serverVariables: {
          version: 'v2',
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {},
      });
    });

    it('should build a request for the given operationId with a requestBody', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2,
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { a: 1, b: 2 },
      });
    });

    it('should stringify object values of form data bodies', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/x-www-form-urlencoded': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: {
            c: 3,
            d: 4,
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'a=1&b=%7B%22c%22%3A3%2C%22d%22%3A4%7D',
      });
    });

    it('should build a request for the given operationId with a requestBody, and not be overriden by an invalid Swagger2 body parameter value', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2,
        },
        parameters: {
          body: {
            c: 3,
            d: 4,
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { a: 1, b: 2 },
      });
    });

    it('should build a request for the given operationId with a requestBody and a defined requestContentType', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2,
        },
        requestContentType: 'application/json',
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { a: 1, b: 2 },
      });
    });

    it('should build an operation without a body or Content-Type if the requestBody definition lacks the requestContentType', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2,
        },
        requestContentType: 'application/not-json',
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {},
      });
    });

    it('should build a request body-bearing operation with a provided requestContentType that appears in the requestBody definition even if no payload is present', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestContentType: 'application/json',
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should build a request body-bearing operation without a provided requestContentType that does not appear in the requestBody definition even if no payload is present', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
        ],
        paths: {
          '/one': {
            get: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestContentType: 'application/not-json',
      });

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {},
      });
    });

    it('should not add a Content-Type when the operation has no OAS3 request body definition', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [{ url: 'http://swagger.io/' }],
        paths: { '/one': { get: { operationId: 'getMe' } } },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        requestContentType: 'application/josh',
      });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {},
        credentials: 'same-origin',
        method: 'GET',
      });
    });
  });
  describe('with petstore v3', () => {
    it('should build updatePetWithForm correctly', () => {
      const req = buildRequest({
        spec: petstoreSpec,
        requestContentType: 'application/x-www-form-urlencoded',
        operationId: 'updatePetWithForm',
        parameters: {
          petId: 1234,
        },
        requestBody: {
          thePetId: 1234,
          name: 'OAS3 pet',
        },
      });

      expect(req).toEqual({
        method: 'POST',
        url: 'http://petstore.swagger.io/v2/pet/1234',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'thePetId=1234&name=OAS3%20pet',
      });
    });

    it('should build addPet correctly', () => {
      const req = buildRequest({
        spec: petstoreSpec,
        operationId: 'addPet',
        requestBody: {
          one: 1,
        },
      });

      expect(req).toEqual({
        method: 'POST',
        url: 'http://petstore.swagger.io/v2/pet',
        credentials: 'same-origin',
        headers: {},
        body: {
          one: 1,
        },
      });
    });
  });

  describe('`schema` parameters', () => {
    it('should encode JSON values provided as objects', () => {
      const req = buildRequest({
        spec: {
          openapi: '3.0.0',
          paths: {
            '/{pathPartial}': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'query',
                    in: 'query',
                    schema: {
                      type: 'object',
                    },
                  },
                  {
                    name: 'FooHeader',
                    in: 'header',
                    schema: {
                      type: 'object',
                    },
                    explode: true,
                  },
                  {
                    name: 'pathPartial',
                    in: 'path',
                    schema: {
                      type: 'object',
                    },
                    explode: true,
                  },
                  {
                    name: 'myCookie',
                    in: 'cookie',
                    schema: {
                      type: 'object',
                    },
                  },
                ],
              },
            },
          },
        },
        operationId: 'myOp',
        parameters: {
          query: {
            a: {
              b: {
                c: 'd',
              },
            },
          },
          FooHeader: {
            a: {
              b: {
                c: {
                  d: 'e',
                },
              },
            },
          },
          pathPartial: {
            foo: {
              bar: { baz: 'qux' },
            },
            a: {
              b: {
                c: 'd',
              },
            },
          },
          myCookie: {
            foo: {
              bar: { baz: 'qux' },
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'POST',
        url: `/foo=${escape('{"bar":{"baz":"qux"}}')},a=${escape('{"b":{"c":"d"}}')}?a=${escape('{"b":{"c":"d"}}')}`,
        credentials: 'same-origin',
        headers: {
          FooHeader: 'a={"b":{"c":{"d":"e"}}}',
          Cookie: 'myCookie=foo,{"bar":{"baz":"qux"}}',
        },
      });
    });

    it('should encode arrays of arrays and objects', () => {
      const req = buildRequest({
        spec: {
          openapi: '3.0.0',
          paths: {
            '/': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'arrayOfObjects',
                    in: 'query',
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                      },
                    },
                    explode: false,
                  },
                  {
                    name: 'arrayOfArrays',
                    in: 'query',
                    schema: {
                      type: 'array',
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                    },
                    explode: false,
                  },
                  {
                    name: 'headerArrayOfObjects',
                    in: 'header',
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                      },
                    },
                  },
                  {
                    name: 'headerArrayOfArrays',
                    in: 'header',
                    schema: {
                      type: 'array',
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        operationId: 'myOp',
        parameters: {
          arrayOfObjects: [
            {
              a: {
                b: 'c',
              },
            },
            {
              d: {
                e: 'f',
              },
            },
          ],
          arrayOfArrays: [
            [
              {
                a: {
                  b: 'c',
                },
              },
            ],
          ],
          headerArrayOfObjects: [
            {
              a: {
                b: 'c',
              },
            },
            {
              d: {
                e: 'f',
              },
            },
          ],
          headerArrayOfArrays: [
            [
              {
                a: {
                  b: 'c',
                },
              },
            ],
            [
              {
                d: {
                  e: 'f',
                },
              },
            ],
          ],
        },
      });

      expect(req).toEqual({
        method: 'POST',
        url: `/?arrayOfObjects=${escape('{"a":{"b":"c"}},{"d":{"e":"f"}}')}&arrayOfArrays=${escape('[{"a":{"b":"c"}}]')}`,
        credentials: 'same-origin',
        headers: {
          headerArrayOfObjects: '{"a":{"b":"c"}},{"d":{"e":"f"}}',
          headerArrayOfArrays: '[{"a":{"b":"c"}}],[{"d":{"e":"f"}}]',
        },
      });
    });
  });

  describe('`content` parameters', () => {
    it('should serialize JSON values provided as objects', () => {
      const req = buildRequest({
        spec: {
          openapi: '3.0.0',
          paths: {
            '/{pathPartial}': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'query',
                    in: 'query',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                        },
                      },
                    },
                  },
                  {
                    name: 'FooHeader',
                    in: 'header',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                        },
                      },
                    },
                  },
                  {
                    name: 'pathPartial',
                    in: 'path',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                        },
                      },
                    },
                  },
                  {
                    name: 'myCookie',
                    in: 'cookie',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        operationId: 'myOp',
        parameters: {
          query: { a: 1, b: '2' },
          FooHeader: { foo: 'bar' },
          pathPartial: { baz: 'qux' },
          myCookie: { flavor: 'chocolate chip' },
        },
      });

      expect(req).toEqual({
        method: 'POST',
        url: `/${escape('{"baz":"qux"}')}?query=${escape('{"a":1,"b":"2"}')}`,
        credentials: 'same-origin',
        headers: {
          FooHeader: '{"foo":"bar"}',
          Cookie: 'myCookie={"flavor":"chocolate chip"}',
        },
      });
    });

    it('should serialize JSON values provided as objects in `deepObject` style', () => {
      const req = buildRequest({
        spec: {
          openapi: '3.0.0',
          paths: {
            '/': {
              post: {
                operationId: 'myOp',
                requestBody: {
                  content: {
                    'application/x-www-form-urlencoded': {
                      schema: {
                        type: 'object',
                        properties: {
                          a: {
                            type: 'object',
                            properties: {
                              b: {
                                type: 'string',
                              },
                              c: {
                                type: 'array',
                              },
                              d: {
                                type: 'object',
                              },
                            },
                          },
                        },
                      },
                      encoding: {
                        a: {
                          style: 'deepObject',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        operationId: 'myOp',
        requestBody: {
          a: {
            b: 'c',
            c: ['d', 'e'],
            d: {
              e: 'f',
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'POST',
        url: `/`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'same-origin',
        body: 'a%5Bb%5D=c&a%5Bc%5D=%5B%22d%22%2C%22e%22%5D&a%5Bd%5D=%7B%22e%22%3A%22f%22%7D',
      });
    });

    it('should serialize JSON values provided as arrays of stringified objects', () => {
      const req = buildRequest({
        spec: {
          openapi: '3.0.0',
          paths: {
            '/{pathPartial}': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'query',
                    in: 'query',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'array',
                          items: {
                            type: 'object',
                          },
                        },
                      },
                    },
                  },
                  {
                    name: 'FooHeader',
                    in: 'header',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'array',
                          items: {
                            type: 'object',
                          },
                        },
                      },
                    },
                  },
                  {
                    name: 'pathPartial',
                    in: 'path',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'array',
                          items: {
                            type: 'object',
                          },
                        },
                      },
                    },
                  },
                  {
                    name: 'myCookie',
                    in: 'cookie',
                    content: {
                      'application/json': {
                        schema: {
                          type: 'array',
                          items: {
                            type: 'object',
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        operationId: 'myOp',
        parameters: {
          query: ['{"a":1}', '{"b":"2"}'],
          FooHeader: ['{"foo":"bar"}'],
          pathPartial: ['{"baz":"qux"}'],
          myCookie: ['{"flavor":"chocolate chip"}'],
        },
      });

      expect(req).toEqual({
        method: 'POST',
        url: `/${escape('[{"baz":"qux"}]')}?query=${escape('[{"a":1},{"b":"2"}]')}`,
        credentials: 'same-origin',
        headers: {
          FooHeader: '[{"foo":"bar"}]',
          Cookie: 'myCookie=[{"flavor":"chocolate chip"}]',
        },
      });
    });

    it('should serialize JSON values provided for schemas without properties', () => {
      const req = buildRequest({
        spec: {
          openapi: '3.0.0',
          paths: {
            '/': {
              post: {
                operationId: 'myOp',
                requestBody: {
                  content: {
                    'application/x-www-form-urlencoded': {
                      schema: {
                        type: 'object',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        operationId: 'myOp',
        requestBody: JSON.stringify({
          primitiveParam: 'string',
          objectParam: { a: { b: 'c' }, d: [1, 2, 3] },
        }),
      });

      expect(req).toEqual({
        method: 'POST',
        url: `/`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'same-origin',
        body: 'primitiveParam=string&objectParam=%7B%22a%22%3A%7B%22b%22%3A%22c%22%7D%2C%22d%22%3A%5B1%2C2%2C3%5D%7D',
      });
    });

    it('should not serialize undefined parameters', () => {
      const spec = {
        openapi: '3.0.1',
        info: {
          title: 'OpenAPI definition',
          version: 'v0',
        },
        servers: [
          {
            url: 'http://localhost:8080',
            description: 'Generated server url',
          },
        ],
        paths: {
          '/{pathParam}': {
            post: {
              operationId: 'undefinedParams',
              parameters: [
                {
                  name: 'pathParam',
                  in: 'path',
                  content: {
                    'text/plain': {
                      schema: {},
                    },
                  },
                },
                {
                  name: 'headerParam',
                  in: 'header',
                  content: {
                    'text/plain': {
                      schema: {},
                    },
                  },
                },
                {
                  name: 'queryParam',
                  in: 'query',
                  content: {
                    'text/plain': {
                      schema: {},
                    },
                  },
                },
                {
                  name: 'cookieParam',
                  in: 'cookie',
                  content: {
                    'text/plain': {
                      schema: {},
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const request = buildRequest({
        spec,
        operationId: 'undefinedParams',
        parameters: {
          pathParam: undefined,
          queryParam: undefined,
          headerParam: undefined,
          cookieParam: undefined,
        },
      });

      expect(request).toEqual({
        url: 'http://localhost:8080/{pathParam}',
        credentials: 'same-origin',
        headers: {},
        method: 'POST',
      });
    });
  });
  describe('baseUrl', () => {
    // Verify that given serverUrl and contextUrl produces exepcted baseUrl
    function testUrlResolving(serverUrl, contextUrl, expectedBaseUrl) {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: serverUrl,
          },
        ],
      };

      const res = baseUrl({
        spec,
        contextUrl,
      });
      expect(res).toEqual(expectedBaseUrl);
    }

    it('should use absolute server url when context url is not empty', () => {
      testUrlResolving('http://t.com/app/', 'http://t.com/doc/api.json', 'http://t.com/app');
    });
    it('should use absolute server url when context url is empty', () => {
      testUrlResolving('http://t.com/app/', '', 'http://t.com/app');
    });
    it('should use host of context url when server url is empty', () => {
      testUrlResolving('', 'http://t.com/doc/api.json', 'http://t.com');
    });
    it('should resolve url correctly when server url is absolute path', () => {
      testUrlResolving('/app/', 'http://t.com/doc/api.json', 'http://t.com/app');
    });
    it('should resolve url correctly when server url is absolute path and context url is empty', () => {
      testUrlResolving('/app/', '', '/app');
    });
    it('should return empty when both server url and context url are empty', () => {
      testUrlResolving('', '', '');
    });
    it('should resolve relative server url correctly against context url', () => {
      testUrlResolving('./', 'http://t.com/doc/api.json', 'http://t.com/doc');
      testUrlResolving('../app/', 'http://t.com/doc/api.json', 'http://t.com/app');
    });
    it('should default to using the first server if none is explicitly chosen', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com',
          },
          {
            url: 'https://petstore.net',
          },
        ],
      };

      const res = baseUrl({
        spec,
      });

      expect(res).toEqual('https://petstore.com');
    });
    it('should use an explicitly chosen server', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com',
          },
          {
            url: 'https://petstore.net',
          },
        ],
      };

      const res = baseUrl({
        spec,
        server: 'https://petstore.net',
      });

      expect(res).toEqual('https://petstore.net');
    });
    it('should use an explicitly chosen server at the operation level', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com',
          },
          {
            url: 'https://petstore.net',
          },
        ],
        paths: {
          '/': {
            get: {
              servers: [
                {
                  url: 'https://petstore-operation.net/{path}',
                  variables: {
                    path: {
                      default: 'foobar',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const res = baseUrl({
        spec,
        server: 'https://petstore-operation.net/{path}',
        pathName: '/',
        method: 'GET',
      });

      const resWithVariables = baseUrl({
        spec,
        server: 'https://petstore-operation.net/{path}',
        serverVariables: {
          path: 'fizzbuzz',
        },
        pathName: '/',
        method: 'GET',
      });

      expect(res).toEqual('https://petstore-operation.net/foobar');
      expect(resWithVariables).toEqual('https://petstore-operation.net/fizzbuzz');
    });

    it('should use an explicitly chosen server at the path level', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com',
          },
          {
            url: 'https://petstore.net',
          },
        ],
        paths: {
          '/': {
            servers: [
              {
                url: 'https://petstore-path.net/{path}',
                variables: {
                  path: {
                    default: 'foobar',
                  },
                },
              },
            ],
            get: {},
          },
        },
      };

      const res = baseUrl({
        spec,
        server: 'https://petstore-path.net/{path}',
        pathName: '/',
        method: 'GET',
      });

      const resWithVariables = baseUrl({
        spec,
        server: 'https://petstore-path.net/{path}',
        serverVariables: {
          path: 'fizzbuzz',
        },
        pathName: '/',
        method: 'GET',
      });

      expect(res).toEqual('https://petstore-path.net/foobar');
      expect(resWithVariables).toEqual('https://petstore-path.net/fizzbuzz');
    });
    it('should not use an explicitly chosen server that is not present in the spec', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com',
          },
          {
            url: 'https://petstore.net',
          },
        ],
      };

      const res = baseUrl({
        spec,
        server: 'https://petstore.org',
      });

      expect(res).toEqual('https://petstore.com');
    });
    it('should handle server variable substitution', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.{tld}',
            variables: {
              tld: {
                default: 'com',
              },
            },
          },
        ],
      };

      const res = baseUrl({
        spec,
        serverVariables: {
          tld: 'org',
        },
      });

      expect(res).toEqual('https://petstore.org');
    });
    it('should handle server variable substitution defaults', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.{tld}',
            variables: {
              tld: {
                default: 'com',
              },
            },
          },
        ],
      };

      const res = baseUrl({
        spec,
      });

      expect(res).toEqual('https://petstore.com');
    });
    it('should fall back to contextUrls if no servers are provided', () => {
      const spec = {
        openapi: '3.0.0',
      };

      const res = baseUrl({
        spec,
        server: 'http://some-invalid-server.com/',
        contextUrl: 'http://google.com/',
      });

      expect(res).toEqual('http://google.com');
    });
    it('should fall back to contextUrls if servers list is empty', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [],
      };

      const res = baseUrl({
        spec,
        server: 'http://some-invalid-server.com/',
        contextUrl: 'http://google.com/',
      });

      expect(res).toEqual('http://google.com');
    });
    it('should create a relative url based on a relative server if no contextUrl is available', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: '/mypath',
          },
        ],
      };

      const res = baseUrl({
        spec,
        server: '/mypath',
      });

      expect(res).toEqual('/mypath');
    });
    it('should return an empty string if no servers or contextUrl are provided', () => {
      const spec = {
        openapi: '3.0.0',
      };

      const res = baseUrl({
        spec,
        server: 'http://some-invalid-server.com/',
      });

      expect(res).toEqual('');
    });
  });
  describe('attachContentTypeForEmptyPayload', () => {
    it('should attach the first media type as Content-Type to an OAS3 operation with a request body defined but no body provided', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://swagger.io/',
          },
        ],
        paths: {
          '/one': {
            post: {
              operationId: 'myOp',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      };

      const req = buildRequest({
        spec,
        operationId: 'myOp',
        attachContentTypeForEmptyPayload: true,
      });

      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        method: 'POST',
      });
    });
    it('should not attach a Content-Type to an OAS3 operation with no request body definition present', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://swagger.io/',
          },
        ],
        paths: {
          '/one': {
            post: {
              operationId: 'myOp',
            },
          },
        },
      };

      const req = buildRequest({
        spec,
        operationId: 'myOp',
        attachContentTypeForEmptyPayload: true,
      });

      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {},
        credentials: 'same-origin',
        method: 'POST',
      });
    });
    it('should not attach the first media type as Content-Type without the option enabled', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://swagger.io/',
          },
        ],
        paths: {
          '/one': {
            post: {
              operationId: 'myOp',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      };

      const req = buildRequest({
        spec,
        operationId: 'myOp',
        // attachContentTypeForEmptyPayload is omitted
      });

      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {},
        credentials: 'same-origin',
        method: 'POST',
      });
    });
  });
  describe('allowEmptyValue', () => {
    describe('query', () => {
      it('should include empty parameter values for a query param with allowEmptyValue', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'name',
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
          operationId: 'getMe',
          parameters: {
            name: '',
          },
        });

        expect(req).toMatchObject({
          method: 'GET',
          url: '/one?name=',
          credentials: 'same-origin',
          headers: {},
        });
      });
      it('should not include omitted parameter values for a query param with allowEmptyValue', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'name',
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
          operationId: 'getMe',
          parameters: {},
        });

        expect(req).toMatchObject({
          method: 'GET',
          url: '/one',
          credentials: 'same-origin',
          headers: {},
        });
      });
      it('should not include empty parameter values for a query param lacking allowEmptyValue', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'name',
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
          operationId: 'getMe',
          parameters: {
            name: '',
          },
        });

        expect(req).toMatchObject({
          method: 'GET',
          url: '/one',
          credentials: 'same-origin',
          headers: {},
        });
      });
      it('should not include omitted parameter values for a query param lacking allowEmptyValue', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'name',
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
          operationId: 'getMe',
          parameters: {},
        });

        expect(req).toMatchObject({
          method: 'GET',
          url: '/one',
          credentials: 'same-origin',
          headers: {},
        });
      });
    });
  });
  describe('special media types', () => {
    describe('file-as-body types', () => {
      it('should preserve Buffer for application/octet-stream', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                requestBody: {
                  content: {
                    'application/octet-stream': {
                      schema: {
                        type: 'string',
                        format: 'binary',
                      },
                    },
                  },
                },
              },
            },
          },
        };

        // when
        const req = buildRequest({
          spec,
          operationId: 'getMe',
          requestBody: Buffer.from('this is a test'),
        });

        expect(req).toMatchObject({
          method: 'GET',
          url: '/one',
          credentials: 'same-origin',
          headers: {},
        });

        expect(req.body.toString('base64')).toEqual('dGhpcyBpcyBhIHRlc3Q=');
      });

      it('should preserve fs.ReadStream for application/octet-stream', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                requestBody: {
                  content: {
                    'application/octet-stream': {
                      schema: {
                        type: 'string',
                        format: 'binary',
                      },
                    },
                  },
                },
              },
            },
          },
        };

        // when
        const readStream = fs.createReadStream(path.join(__dirname, 'data', 'payload.txt'));

        const req = buildRequest({
          spec,
          operationId: 'getMe',
          requestBody: readStream,
        });

        expect(req).toMatchObject({
          method: 'GET',
          url: '/one',
          credentials: 'same-origin',
          headers: {},
        });

        expect(req.body).toStrictEqual(readStream);
      });
    });
  });
});
