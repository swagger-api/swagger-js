import { Readable } from 'stream';
import AbortController from 'abort-controller';

import { execute, buildRequest, self as stubs } from '../../src/execute/index.js';
import { normalizeSwagger } from '../../src/helpers.js';

// Supported shape...  { spec, operationId, parameters, securities, fetch }
// One can use operationId or pathItem + method

describe('execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buildRequest', () => {
    test('should build a request for the given operationId', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        schemes: ['http'],
        basePath: '/v1',
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
        url: 'http://swagger.io/v1/one',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should include host + port', () => {
      // Given
      const spec = {
        host: 'foo.com:8081',
        basePath: '/v1',
        paths: {
          '/': {
            get: {
              operationId: 'foo',
            },
          },
        },
      };

      // When
      const req = buildRequest({ spec, operationId: 'foo' });

      // Then
      expect(req).toEqual({
        url: 'http://foo.com:8081/v1/',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should include operation specifics', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      // When
      const req = buildRequest({ spec, operationId: 'getMe' });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/v1/one',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should execute a simple get request', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        schemes: ['https'],
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      const spy = jest.fn().mockImplementation(() => Promise.resolve());

      execute({
        fetch: spy,
        spec,
        operationId: 'getMe',
      });

      expect(spy.mock.calls.length).toEqual(1);
      expect(spy.mock.calls[0][0]).toEqual({
        method: 'GET',
        url: 'https://swagger.io/one',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should execute a simple get request with user-defined fetch', async () => {
      // cross-fetch exposes FetchAPI methods onto global
      require('cross-fetch/polyfill');

      // Given
      const spec = {
        host: 'swagger.io',
        schemes: ['https'],
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      // eslint-disable-next-line no-undef
      const spy = jest.fn().mockImplementation(() => Promise.resolve(new Response('data')));

      await execute({
        userFetch: spy,
        spec,
        operationId: 'getMe',
      });

      expect(spy.mock.calls.length).toEqual(1);
      expect(spy.mock.calls[0][1]).toEqual({
        method: 'GET',
        url: 'https://swagger.io/one',
        credentials: 'same-origin',
        headers: {},
        userFetch: spy,
      });
    });

    test('should allow aborting request during execution', async () => {
      // cross-fetch exposes FetchAPI methods onto global
      require('cross-fetch/polyfill');

      // Given
      const spec = {
        host: 'swagger.io',
        schemes: ['https'],
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      const spy = jest.fn().mockImplementation(() => Promise.resolve(new Response('data')));
      const controller = new AbortController();
      const { signal } = controller;

      const response = execute({
        userFetch: spy,
        spec,
        operationId: 'getMe',
        signal,
      });

      controller.abort();
      await response;

      expect(spy.mock.calls.length).toEqual(1);
      expect(spy.mock.calls[0][1]).toEqual({
        method: 'GET',
        url: 'https://swagger.io/one',
        credentials: 'same-origin',
        headers: {},
        userFetch: spy,
        signal,
      });
    });

    test('should include values for query parameters', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [{ name: 'petId', in: 'query' }],
            },
          },
        },
      };

      // When
      const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: 123 } });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/v1/one?petId=123',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should include values that have brackets', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'fields',
                  in: 'query',
                  type: 'string',
                },
              ],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        parameters: { fields: '[articles]=title' },
      });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/v1/one?fields=%5Barticles%5D%3Dtitle',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should include values and defaults that are falsy', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'zero',
                  in: 'query',
                  type: 'integer',
                },
                {
                  name: 'false',
                  in: 'query',
                  type: 'boolean',
                },
                {
                  name: 'zeroDefault',
                  in: 'query',
                  type: 'integer',
                  default: 0,
                },
                {
                  name: 'falseDefault',
                  in: 'query',
                  type: 'boolean',
                  default: false,
                },
              ],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        parameters: {
          false: false,
          zero: 0,
        },
      });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/v1/one?zero=0&false=false&zeroDefault=0&falseDefault=false',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should include values for boolean query parameters', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'petId',
                  in: 'query',
                  type: 'boolean',
                },
              ],
            },
          },
        },
      };

      // When
      const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: true } });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/v1/one?petId=true',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should include the default value', () => {
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'petId',
                  in: 'query',
                  type: 'integer',
                  default: 3,
                },
              ],
            },
          },
        },
      };

      const req = buildRequest({ spec, operationId: 'getMe', parameters: {} });

      expect(req).toEqual({
        url: 'http://swagger.io/v1/one?petId=3',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should throw error if required parameter value is not provided', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'petId',
                  in: 'query',
                  required: true,
                  type: 'string',
                },
              ],
            },
          },
        },
      };

      expect(() => buildRequest({ spec, operationId: 'getMe' })).toThrow(
        'Required parameter petId is not provided'
      );
    });

    test('should throw error if operation was not found', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
            },
          },
        },
      };

      expect(() => buildRequest({ spec, operationId: 'nonExistingOperationId' })).toThrow(
        'Operation nonExistingOperationId not found'
      );
    });

    describe('formData', () => {
      test('should add an empty query param if the value is empty and allowEmptyValue: true', () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              delete: {
                operationId: 'deleteMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'formData',
                    allowEmptyValue: true,
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({ spec, operationId: 'deleteMe', parameters: {} });

        // Then
        expect(req.body).toEqual('petId=');
      });

      test('should support collectionFormat', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'formData',
                    collectionFormat: 'csv',
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: [1, 2, 3] } });

        // Then
        expect(req.body).toEqual('petId=1,2,3');
      });
    });

    test('should correctly process boolean parameters', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        consumes: ['application/json'],
        paths: {
          '/pets/findByStatus': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  in: 'query',
                  name: 'status',
                  type: 'boolean',
                  required: false,
                },
              ],
            },
          },
        },
      };

      // When
      const req = buildRequest({ spec, operationId: 'getMe', parameters: { status: false } });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/v1/pets/findByStatus?status=false',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should throw error if there is no parameter value', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        consumes: ['application/json'],
        paths: {
          '/pets/findByStatus': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  in: 'query',
                  name: 'status',
                  type: 'string',
                  required: true,
                },
              ],
            },
          },
        },
      };

      // Then
      expect(() => buildRequest({ spec, operationId: 'getMe', parameters: {} })).toThrow();
    });

    test('should handle responseContentType', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        paths: { '/one': { get: { operationId: 'getMe' } } },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        responseContentType: 'application/josh',
      });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/one',
        credentials: 'same-origin',
        headers: {
          accept: 'application/josh',
        },
        method: 'GET',
      });
    });

    test('should set the correct scheme', () => {
      const spec = {
        host: 'swagger.io',
        basePath: '/v1',
        paths: {
          '/one': {
            get: {
              operationId: 'loginUser',
              parameters: [
                {
                  in: 'query',
                  name: 'username',
                  type: 'string',
                },
                {
                  in: 'query',
                  name: 'password',
                  type: 'string',
                },
              ],
            },
          },
        },
      };

      const req = buildRequest({
        spec,
        operationId: 'loginUser',
        parameters: { username: 'fred', password: 'meyer' },
      });

      expect(req).toEqual({
        url: 'http://swagger.io/v1/one?username=fred&password=meyer',
        method: 'GET',
        credentials: 'same-origin',
        headers: {},
      });
    });

    test('should add Content-Type if a body param definition is present but there is no payload', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'body',
                  in: 'body',
                  schema: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        },
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
        body: undefined,
        headers: {
          'Content-Type': 'application/josh',
        },
        credentials: 'same-origin',
        method: 'GET',
      });
    });

    test('should add Content-Type if a formData param definition is present but there is no payload', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        paths: {
          '/one': {
            get: {
              operationId: 'getMe',
              parameters: [
                {
                  name: 'data',
                  in: 'formData',
                  schema: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        requestContentType: 'application/x-www-form-encoded',
      });

      // Then
      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {
          'Content-Type': 'application/x-www-form-encoded',
        },
        credentials: 'same-origin',
        method: 'GET',
      });
    });

    test('should not add Content-Type if no form-data or body param definition is present', () => {
      // Given
      const spec = {
        host: 'swagger.io',
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

    test('should add Content-Type multipart/form-data when param type is file and no other sources of consumes', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        paths: {
          '/one': {
            post: {
              operationId: 'postMe',
              parameters: [{ name: 'foo', type: 'file', in: 'formData' }],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'postMe',
        parameters: { foo: 'test' },
      });

      // Then
      expect(req.headers).toEqual({
        'Content-Length': '134',
        'Content-Type': expect.stringMatching(/^multipart\/form-data/),
      });

      // Would like to do a more thourough test ( ie: ensure the value `foo` exists..
      // but I don't feel like attacking the interals of the node pollyfill
      // for FormData, as it seems to be missing `.get()`)
      expect(req.url).toEqual('http://swagger.io/one');
      expect(req.body).toBeInstanceOf(Readable);
    });

    test('should add Content-Type application/x-www-form-urlencoded when in: formData ', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        paths: {
          '/one': {
            post: {
              operationId: 'postMe',
              parameters: [{ name: 'file', in: 'formData' }],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'postMe',
        parameters: { file: 'test' },
      });

      // Then
      expect(req).toEqual({
        body: 'file=test',
        method: 'POST',
        url: 'http://swagger.io/one',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'same-origin',
      });
    });

    test('should add Content-Type from spec when no consumes in operation and no requestContentType passed', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        consumes: ['test'],
        paths: {
          '/one': {
            post: {
              operationId: 'postMe',
              parameters: [{ name: 'file', in: 'formData' }],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'postMe',
        parameters: { file: 'test' },
      });

      // Then
      expect(req).toEqual({
        body: 'file=test',
        method: 'POST',
        url: 'http://swagger.io/one',
        headers: {
          'Content-Type': 'test',
        },
        credentials: 'same-origin',
      });
    });

    test('should add Content-Type from operation when no requestContentType passed', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        consumes: ['no'],
        paths: {
          '/one': {
            post: {
              operationId: 'postMe',
              consumes: ['test'],
              parameters: [{ name: 'file', in: 'formData' }],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'postMe',
        parameters: { file: 'test' },
      });

      // Then
      expect(req).toEqual({
        body: 'file=test',
        method: 'POST',
        url: 'http://swagger.io/one',
        headers: {
          'Content-Type': 'test',
        },
        credentials: 'same-origin',
      });
    });

    test('should build a request for all given fields', () => {
      // Given
      const spec = {
        host: 'swagger.io',
        basePath: '/api',
        schemes: ['whoop'],
        paths: {
          '/one/{two}': {
            put: {
              operationId: 'getMe',
              produces: ['mime/silent-french-type'],
              parameters: [
                {
                  in: 'query',
                  name: 'question',
                  type: 'string',
                  example: 'hello',
                },
                {
                  in: 'header',
                  name: 'head',
                  type: 'string',
                  example: 'hi',
                },
                {
                  in: 'path',
                  name: 'two',
                  type: 'number',
                  example: '2',
                },
                {
                  in: 'body',
                  name: 'body',
                  schema: {
                    type: 'object',
                    properties: {
                      one: {
                        type: 'string',
                      },
                    },
                    example: '2',
                  },
                },
              ],
            },
          },
        },
      };

      // When
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        parameters: {
          head: 'justTheHead',
          two: '2',
          body: { json: 'rulez' },
          question: 'answer',
        },
      });

      // Then
      expect(req).toEqual({
        url: 'whoop://swagger.io/api/one/2?question=answer',
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          accept: 'mime/silent-french-type',
          head: 'justTheHead',
        },
        body: {
          json: 'rulez',
        },
      });
    });

    test('should NOT stringify the body, if provided with a javascript object', () => {
      // execute alone should do that, allowing us to modify the object in a clean way)

      // Given
      const spec = {
        host: 'swagger.io',
        paths: {
          '/me': { post: { parameters: [{ name: 'body', in: 'body' }], operationId: 'makeMe' } },
        },
      };

      const req = buildRequest({
        spec,
        operationId: 'makeMe',
        parameters: {
          body: {
            one: 1,
          },
        },
      });

      expect(req.body).toEqual({
        one: 1,
      });
    });

    describe('attachContentTypeForEmptyPayload', () => {
      test('should attach a Content-Type to a Swagger 2 operation with a body parameter defined but no body provided', () => {
        const spec = {
          swagger: '2.0',
          host: 'swagger.io',
          consumes: ['application/json'],
          paths: {
            '/one': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'body',
                    in: 'body',
                  },
                ],
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
          body: undefined,
        });
      });
      test('should attach a Content-Type to a Swagger 2 operation with a formData parameter defined but no body provided', () => {
        const spec = {
          swagger: '2.0',
          host: 'swagger.io',
          paths: {
            '/one': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'data',
                    in: 'formData',
                    type: 'string',
                  },
                ],
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
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'same-origin',
          method: 'POST',
        });
      });
      test('should not attach a Content-Type to a Swagger 2 operation with no body or formData parameter definition present', () => {
        const spec = {
          swagger: '2.0',
          host: 'swagger.io',
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
      test('should not attach a Content-Type to a Swagger 2 operation with a body parameter defined but no body provided if the option is not enabled', () => {
        const spec = {
          swagger: '2.0',
          host: 'swagger.io',
          consumes: ['application/json'],
          paths: {
            '/one': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'body',
                    in: 'body',
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({
          spec,
          operationId: 'myOp',
        });

        expect(req).toEqual({
          url: 'http://swagger.io/one',
          headers: {},
          credentials: 'same-origin',
          method: 'POST',
          body: undefined,
        });
      });
      test('should not attach a Content-Type to a Swagger 2 operation with a formData parameter defined but no body provided if the option is not enabled', () => {
        const spec = {
          swagger: '2.0',
          host: 'swagger.io',
          paths: {
            '/one': {
              post: {
                operationId: 'myOp',
                parameters: [
                  {
                    name: 'data',
                    in: 'formData',
                    type: 'string',
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({
          spec,
          operationId: 'myOp',
        });

        expect(req).toEqual({
          url: 'http://swagger.io/one',
          headers: {},
          credentials: 'same-origin',
          method: 'POST',
        });
      });
    });
  });

  // Note: this is to handle requestContentType and responseContentType
  // although more might end up using it.
  test('should pass extras props to buildRequest', () => {
    // Given
    const spec = {
      host: 'swagger.io',
      paths: { '/one': { get: { operationId: 'getMe' } } },
    };

    const buildRequestSpy = jest.spyOn(stubs, 'buildRequest').mockImplementation(() => ({}));

    execute({
      fetch: jest.fn().mockImplementation(() => ({
        then() {},
      })),
      spec,
      operationId: 'getMe',
      josh: 1,
      attachContentTypeForEmptyPayload: true,
    });

    expect(buildRequestSpy.mock.calls.length).toEqual(1);
    expect(buildRequestSpy.mock.calls[0][0]).toMatchObject({
      josh: 1,
      attachContentTypeForEmptyPayload: true,
    });
  });

  test('should stringify body, if provided with javascript object', () => {
    // Given
    const spec = {
      host: 'swagger.io',
      paths: {
        '/me': { post: { parameters: [{ name: 'body', in: 'body' }], operationId: 'makeMe' } },
      },
    };

    const fetchSpy = jest.fn().mockImplementation(() => ({
      then() {},
    }));

    execute({
      fetch: fetchSpy,
      spec,
      operationId: 'makeMe',
      parameters: {
        body: {
          one: 1,
          two: {
            three: 3,
          },
        },
      },
    });

    expect(fetchSpy.mock.calls.length).toEqual(1);
    expect(fetchSpy.mock.calls[0][0].body).toEqual('{"one":1,"two":{"three":3}}');
  });

  test('should NOT stringify body, if its a non-object', () => {
    // Given
    const spec = {
      host: 'swagger.io',
      paths: {
        '/me': { post: { parameters: [{ name: 'body', in: 'body' }], operationId: 'makeMe' } },
      },
    };

    const fetchSpy = jest.fn().mockImplementation(() => ({
      then() {},
    }));

    execute({
      fetch: fetchSpy,
      spec,
      operationId: 'makeMe',
      parameters: {
        body: 'hello',
      },
    });

    expect(fetchSpy.mock.calls.length).toEqual(1);
    expect(fetchSpy.mock.calls[0][0].body).toEqual('hello');
  });

  test('should NOT stringify body, if its an instance of FormData', () => {
    // Given
    const spec = {
      host: 'swagger.io',
      paths: {
        '/me': { post: { parameters: [{ name: 'one', in: 'formData' }], operationId: 'makeMe' } },
      },
    };

    const fetchSpy = jest.fn().mockImplementation(() => ({
      then() {},
    }));

    execute({
      fetch: fetchSpy,
      spec,
      operationId: 'makeMe',
      requestContentType: 'multipart/form-data',
      parameters: {
        one: { hello: true },
      },
    });

    expect(fetchSpy.mock.calls.length).toEqual(1);
    expect(fetchSpy.mock.calls[0][0].body).toBeInstanceOf(Readable);
  });

  describe('parameterBuilders', () => {
    describe('query', () => {
      test('should include the values for array of query parameters', () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'query',
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: ['a,b'] } });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?petId=a%2Cb',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test('should allow multiple collectionFormats', () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'ids',
                    in: 'query',
                    collectionFormat: 'csv',
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                  {
                    name: 'the names',
                    in: 'query',
                    collectionFormat: 'pipes',
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({
          spec,
          operationId: 'getMe',
          parameters: { ids: [1, 2, 3], 'the names': ['a,b', 'mary'] },
        });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?ids=1,2,3&the%20names=a%2Cb|mary',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test("should include values for array of query parameters 'csv' collectionFormat", () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'query',
                    collectionFormat: 'csv',
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: [1, 2, 3] } });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?petId=1,2,3',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test("should include values for array of query parameters 'ssv' collectionFormat", () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'query',
                    collectionFormat: 'ssv',
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: [1, 2, 3] } });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?petId=1%202%203',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test("should include values for array of query parameters 'multi' collectionFormat", () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'query',
                    collectionFormat: 'multi',
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: [1, 2, 3] } });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?petId=1&petId=2&petId=3',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test("should include values for array of query parameters 'tsv' collectionFormat", () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'query',
                    collectionFormat: 'tsv',
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: [1, 2, 3] } });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?petId=1%092%093',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test("should include values for array of query parameters 'pipes' collectionFormat", () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'name',
                    in: 'query',
                    collectionFormat: 'pipes',
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({
          spec,
          operationId: 'getMe',
          parameters: { name: ['john', 'smith'] },
        });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?name=john|smith',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test('should fall back to `name-in` format when a parameter cannot be found', () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'name',
                    in: 'query',
                    type: 'string',
                  },
                ],
              },
            },
          },
        };

        // When
        const req = buildRequest({
          spec,
          operationId: 'getMe',
          parameters: { 'query.name': 'john' },
        });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?name=john',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test('should set all parameter options when given an ambiguous parameter value', () => {
        // Given
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    name: 'name',
                    in: 'query',
                    type: 'string',
                  },
                  {
                    name: 'name',
                    in: 'formData',
                    type: 'string',
                  },
                ],
              },
            },
          },
        };

        const oriWarn = global.console.warn;
        global.console.warn = jest.fn();

        // When
        const req = buildRequest({ spec, operationId: 'getMe', parameters: { name: 'john' } });

        // Then
        expect(req).toEqual({
          url: 'http://swagger.io/v1/one?name=john',
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'name=john',
        });

        // eslint-disable-next-line no-console
        expect(console.warn.mock.calls.length).toEqual(2);
        global.console.warn = oriWarn;
      });
    });

    describe('body', () => {
      describe('POST', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              post: {
                operationId: 'postMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'body',
                    schema: {
                      type: 'integer',
                    },
                  },
                ],
              },
            },
          },
        };

        test('should serialize the body', () => {
          const spec2 = {
            host: 'swagger.io',
            paths: {
              '/v1/blob/image.png': {
                post: {
                  operationId: 'getBlob',
                  parameters: [
                    {
                      name: 'someQuery',
                      in: 'query',
                      type: 'string',
                    },
                    {
                      name: 'bodyParam',
                      in: 'body',
                      required: true,
                      schema: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          };

          const req = buildRequest({
            spec: spec2,
            operationId: 'getBlob',
            parameters: {
              bodyParam: {
                name: 'johny',
                id: '123',
              },
              someQuery: 'foo',
            },
          });

          expect(req).toEqual({
            url: 'http://swagger.io/v1/blob/image.png?someQuery=foo',
            method: 'POST',
            credentials: 'same-origin',
            body: {
              name: 'johny',
              id: '123',
            },
            headers: {},
          });
        });

        test('should not add values of body parameters to the URL', () => {
          const req = buildRequest({ spec, operationId: 'postMe', parameters: { petId: 123 } });

          expect(req).toEqual({
            url: 'http://swagger.io/v1/one',
            method: 'POST',
            body: 123,
            credentials: 'same-origin',
            headers: {},
          });
        });

        test('should generate a request with an empty body parameter', () => {
          const req = buildRequest({ spec, operationId: 'postMe', parameters: {} });

          expect(req).toEqual({
            url: 'http://swagger.io/v1/one',
            method: 'POST',
            body: undefined,
            credentials: 'same-origin',
            headers: {},
          });
        });
      });

      describe('DELETE', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              delete: {
                operationId: 'deleteMe',
                parameters: [
                  {
                    name: 'petId',
                    in: 'body',
                  },
                ],
              },
            },
          },
        };

        test('should generate a request with an empty body parameter', () => {
          const req = buildRequest({ spec, operationId: 'deleteMe', parameters: {} });

          expect(req).toEqual({
            url: 'http://swagger.io/v1/one',
            method: 'DELETE',
            body: undefined,
            credentials: 'same-origin',
            headers: {},
          });
        });

        test('should generate a request with body parameter', () => {
          const req = buildRequest({ spec, operationId: 'deleteMe', parameters: { petId: 123 } });

          expect(req).toEqual({
            url: 'http://swagger.io/v1/one',
            method: 'DELETE',
            body: 123,
            credentials: 'same-origin',
            headers: {},
          });
        });
      });
    });

    describe('headers', () => {
      test('should process a delete request with headers', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              delete: {
                operationId: 'deleteMe',
                parameters: [
                  {
                    in: 'header',
                    name: 'api_key',
                    type: 'integer',
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({ spec, operationId: 'deleteMe', parameters: { api_key: 123 } });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/one',
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {
            api_key: 123,
          },
        });
      });

      test('should process a delete request without headers of value undefined', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              delete: {
                operationId: 'deleteMe',
                parameters: [
                  {
                    in: 'header',
                    name: 'api_key',
                    type: 'integer',
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({
          spec,
          operationId: 'deleteMe',
          parameters: { api_key: undefined },
        });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/one',
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test('should process a delete request without headers wich are not provided', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              delete: {
                operationId: 'deleteMe',
                parameters: [
                  {
                    in: 'header',
                    name: 'api_key',
                    type: 'integer',
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({ spec, operationId: 'deleteMe', parameters: {} });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/one',
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test('should accept the format', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                consumes: ['application/json'],
                parameters: [
                  {
                    in: 'query',
                    name: 'petId',
                    type: 'string',
                    required: false,
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({
          spec,
          operationId: 'getMe',
          responseContentType: 'application/json',
          parameters: {},
        });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/one',
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            accept: 'application/json',
          },
        });
      });
    });

    describe('path', () => {
      test('should replace path parameters with their values', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/{id}': {
              get: {
                operationId: 'getMe',
                parameters: [
                  {
                    in: 'path',
                    name: 'id',
                    type: 'number',
                    required: true,
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({ spec, operationId: 'getMe', parameters: { id: '123' } });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/123',
          method: 'GET',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test('should merge Path and Operation parameters', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/pet/{id}': {
              get: {
                operationId: 'getPetsById',
                parameters: [
                  {
                    name: 'test',
                    in: 'query',
                    type: 'number',
                  },
                ],
              },
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  type: 'number',
                  required: true,
                },
              ],
            },
          },
        };

        const req = buildRequest({
          spec,
          operationId: 'getPetsById',
          parameters: { id: 123, test: 567 },
        });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/pet/123?test=567',
          headers: {},
          credentials: 'same-origin',
          method: 'GET',
        });
      });

      test('should merge Path and Operation parameters when parameter is the first item in paths', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/pet/{id}': {
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  type: 'number',
                  required: true,
                },
              ],
              get: {
                operationId: 'getPetsById',
                parameters: [
                  {
                    name: 'test',
                    in: 'query',
                    type: 'number',
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({
          spec,
          operationId: 'getPetsById',
          parameters: { id: 123, test: 567 },
        });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/pet/123?test=567',
          headers: {},
          credentials: 'same-origin',
          method: 'GET',
        });
      });

      test('should handle duplicate parameter inheritance from normalized swagger specifications', () => {
        const spec = {
          spec: {
            host: 'swagger.io',
            basePath: '/v1',
            paths: {
              '/pet/{id}': {
                parameters: [
                  {
                    name: 'id',
                    in: 'path',
                    type: 'number',
                    required: true,
                  },
                ],
                get: {
                  operationId: 'getPetsById',
                  parameters: [
                    {
                      name: 'test',
                      in: 'query',
                      type: 'number',
                    },
                  ],
                },
              },
            },
          },
        };

        const resultSpec = normalizeSwagger(spec);
        const warnSpy = jest.spyOn(console, 'warn');
        const req = buildRequest({
          spec: resultSpec.spec,
          operationId: 'getPetsById',
          parameters: { id: 123, test: 567 },
        });
        expect(req).toEqual({
          url: 'http://swagger.io/v1/pet/123?test=567',
          headers: {},
          credentials: 'same-origin',
          method: 'GET',
        });
        expect(warnSpy.mock.calls.length).toEqual(0);
      });

      test('should warn for ambiguous parameters in normalized swagger specifications', () => {
        const spec = {
          spec: {
            host: 'swagger.io',
            basePath: '/v1',
            paths: {
              '/pet/{id}': {
                parameters: [
                  {
                    name: 'id',
                    in: 'path',
                    type: 'number',
                    required: true,
                  },
                ],
                get: {
                  operationId: 'getPetsById',
                  parameters: [
                    {
                      name: 'test',
                      in: 'query',
                      type: 'number',
                    },
                    {
                      name: 'id',
                      in: 'query',
                      type: 'number',
                    },
                  ],
                },
              },
            },
          },
        };

        const oriWarn = global.console.warn;
        global.console.warn = jest.fn();

        const resultSpec = normalizeSwagger(spec);
        const req = buildRequest({
          spec: resultSpec.spec,
          operationId: 'getPetsById',
          parameters: { id: 123, test: 567 },
        });
        expect(req).toEqual({
          url: 'http://swagger.io/v1/pet/123?test=567&id=123',
          headers: {},
          credentials: 'same-origin',
          method: 'GET',
        });
        // eslint-disable-next-line no-console
        expect(console.warn.mock.calls.length).toEqual(2);
        global.console.warn = oriWarn;
      });

      test('should encode path parameter', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/{id}': {
              delete: {
                operationId: 'deleteMe',
                parameters: [
                  {
                    in: 'path',
                    name: 'id',
                    type: 'string',
                    required: true,
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({ spec, operationId: 'deleteMe', parameters: { id: 'foo/bar' } });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/foo%2Fbar',
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {},
        });
      });

      test('should encode path parameter when it is included twice', () => {
        const spec = {
          host: 'swagger.io',
          basePath: '/v1',
          paths: {
            '/{id}/{id}': {
              delete: {
                operationId: 'deleteMe',
                parameters: [
                  {
                    in: 'path',
                    name: 'id',
                    type: 'string',
                    required: true,
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({ spec, operationId: 'deleteMe', parameters: { id: 'foo/bar' } });

        expect(req).toEqual({
          url: 'http://swagger.io/v1/foo%2Fbar/foo%2Fbar',
          method: 'DELETE',
          credentials: 'same-origin',
          headers: {},
        });
      });
    });
  });

  describe('formData', () => {
    const spec = {
      host: 'swagger.io',
      basePath: '/v1',
      paths: {
        '/one': {
          post: {
            operationId: 'postMe',
            parameters: [
              {
                name: 'petId',
                in: 'formData',
                type: 'string',
              },
            ],
          },
        },
      },
    };

    test('should generate a request with application/x-www-form-urlencoded', () => {
      const req = buildRequest({
        spec,
        requestContentType: 'application/x-www-form-urlencoded',
        operationId: 'postMe',
        parameters: { petId: 'id' },
      });

      expect(req).toEqual({
        url: 'http://swagger.io/v1/one',
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'petId=id',
      });
    });
  });
});
