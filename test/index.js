import * as undici from 'undici';
import cloneDeep from 'lodash/cloneDeep';

import SwaggerClient from '../src/index.js';

describe('constructor', () => {
  let mockAgent;
  let originalGlobalDispatcher;

  beforeEach(() => {
    mockAgent = new undici.MockAgent();
    originalGlobalDispatcher = undici.getGlobalDispatcher();
    undici.setGlobalDispatcher(mockAgent);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    undici.setGlobalDispatcher(originalGlobalDispatcher);
    mockAgent = null;
    originalGlobalDispatcher = null;
  });

  test('should export a function', () => {
    expect(typeof SwaggerClient).toBe('function');
  });

  test('should return an instance, without "new"', (done) => {
    SwaggerClient({ spec: {} }).then((instance) => {
      expect(instance).toBeInstanceOf(SwaggerClient);
      done();
    });
  });

  describe('instance', () => {
    test('should ignore an empty spec', async () => {
      const spec = {};
      const client = await SwaggerClient({ spec });

      expect(client.spec).toEqual({});
    });

    test('should resolve the spec', async () => {
      const spec = {
        one: {
          $ref: '#/two',
        },
        two: {
          hi: 'hello',
        },
      };
      const client = await SwaggerClient({ spec, allowMetaPatches: false });

      expect(client.spec).toEqual({
        one: {
          hi: 'hello',
        },
        two: {
          hi: 'hello',
        },
      });
    });

    test('should resolve a cyclic spec when baseDoc is specified', async () => {
      const spec = {
        paths: {
          post: {
            parameters: [
              {
                $ref: '#/definitions/list',
              },
            ],
          },
        },
        definitions: {
          item: {
            items: {
              $ref: '#/definitions/item',
            },
          },
          list: {
            items: {
              $ref: '#/definitions/item',
            },
          },
        },
      };
      const client = await SwaggerClient.resolve({ spec, baseDoc: 'http://whatever/' });

      expect(client.errors).toEqual([]);
    });

    test('should keep resolve errors in #errors', async () => {
      const spec = { $ref: 1 };
      const client = await SwaggerClient({ spec });

      expect(client.errors[0].message).toEqual('$ref: must be a string (JSON-Ref)');
    });

    test('should NOT add `apis` if disableInterfaces', async () => {
      const client = await SwaggerClient({ spec: {}, disableInterfaces: true });

      expect(client.apis).toEqual();
    });

    test('should add `apis` from the makeApisTagOperation', async () => {
      const spec = {
        paths: {
          '/one': {
            get: {
              tags: ['me'],
              operationId: 'getMe',
            },
          },
        },
      };
      const { apis } = await SwaggerClient({ spec });

      expect(typeof apis).toBe('object');
      expect(apis.me.getMe).toBeInstanceOf(Function);
    });

    test('should honor `v2OperationIdCompatibilityMode` when building `apis`', () => {
      // Given
      const spec = {
        swagger: '2.0',
        paths: {
          '/foo/{bar}/baz': {
            get: {
              description: '',
              tags: ['myTag'],
            },
          },
        },
      };

      // When
      return SwaggerClient({
        spec,
        v2OperationIdCompatibilityMode: true,
      }).then((swag) => {
        const { apis } = swag;

        // Then
        expect(typeof apis).toBe('object');
        expect(typeof apis.myTag).toBe('object');
        expect(apis.myTag.get_foo_bar_baz).toBeInstanceOf(Function);
      });
    });

    test('should handle circular $refs when a baseDoc is provided', () => {
      // Given
      const spec = {
        swagger: '2.0',
        definitions: {
          node: {
            required: ['id', 'nodes'],
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              nodes: {
                type: 'array',
                items: {
                  $ref: '#/definitions/node',
                },
              },
            },
          },
        },
      };

      // When
      return SwaggerClient.resolve({
        spec,
        allowMetaPatches: false,
        baseDoc: 'http://example.com/swagger.json',
      }).then(handleResponse);

      // Then
      function handleResponse(obj) {
        expect(obj.errors).toEqual([]);
        expect(obj.spec).toEqual(spec);
      }
    });
  });

  describe('#http', () => {
    test('should throw if fetch error', (done) => {
      const mockPool = mockAgent.get('http://petstore.swagger.io');
      mockPool.intercept({ path: '/404' }).reply(404, 'not found');

      new SwaggerClient({ url: 'http://petstore.swagger.io/404' }).catch((err) => {
        expect(err.status).toBe(404);
        expect(err.message).toBe('Not Found');
        done();
      });
    });

    test('should serialize the response', async () => {
      const mockPool = mockAgent.get('https://swagger.io');
      mockPool.intercept({ path: '/one' }).reply(
        200,
        { me: true },
        {
          headers: {
            'Content-Type': 'application/json',
            hi: 'ho',
          },
        }
      );
      const req = { url: 'https://swagger.io/one' };
      const res = await SwaggerClient.http(req);

      expect(res).toMatchObject({
        url: req.url,
        ok: true,
        status: 200,
        headers: {
          hi: 'ho',
        },
        statusText: 'OK',
        data: '{"me":true}',
        text: '{"me":true}',
        body: {
          me: true,
        },
        obj: {
          me: true,
        },
      });
    });

    test('should handle invalid JSON bodies', async () => {
      const mockPool = mockAgent.get('https://swagger.io');
      mockPool
        .intercept({ path: '/one' })
        .reply(200, '[', { headers: { 'Content-Type': 'text/plain' } });
      const req = { url: 'https://swagger.io/one' };
      const res = await SwaggerClient.http(req);
      const { body, text, status } = res;

      expect(status).toEqual(200);
      expect(text).toEqual('[');
      expect(body).toEqual();
    });
  });

  describe('#execute', () => {
    test('should be able to execute a simple operation', () => {
      const spec = {
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };
      return SwaggerClient({ spec }).then((client) => {
        const http = jest.fn();
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {},
          method: 'GET',
          credentials: 'same-origin',
          url: '/pet',
        });
      });
    });

    test('should respect the `withCredentials` flag on the http agent', () => {
      const spec = {
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };
      return SwaggerClient({ spec }).then((client) => {
        const http = jest.fn();
        http.withCredentials = true;
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {},
          method: 'GET',
          credentials: 'include',
          url: '/pet',
        });
      });
    });

    test('should add basic auth to a request', () => {
      const spec = {
        securityDefinitions: {
          myBasic: {
            type: 'basic',
          },
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{ myBasic: [] }],
            },
          },
        },
      };

      const authorizations = {
        myBasic: {
          username: 'foo',
          password: 'bar',
        },
      };

      return SwaggerClient({ spec, authorizations }).then((client) => {
        const http = jest.fn();
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {
            authorization: 'Basic Zm9vOmJhcg==',
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet',
        });
      });
    });

    test('should add apiKey (header) auth to a request', () => {
      const spec = {
        securityDefinitions: {
          petKey: {
            type: 'apiKey',
            name: 'petKey',
            in: 'header',
          },
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{ petKey: [] }],
            },
          },
        },
      };

      const authorizations = {
        petKey: 'fooBar',
      };

      return SwaggerClient({ spec, authorizations }).then((client) => {
        const http = jest.fn();
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {
            petKey: 'fooBar',
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet',
        });
      });
    });

    test('should add apiKey (query) auth to a request', () => {
      const spec = {
        securityDefinitions: {
          petKey: {
            type: 'apiKey',
            name: 'petKey',
            in: 'query',
          },
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{ petKey: [] }],
            },
          },
        },
      };

      const authorizations = {
        petKey: 'barFoo',
      };

      return SwaggerClient({ spec, authorizations }).then((client) => {
        const http = jest.fn();
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {},
          method: 'GET',
          credentials: 'same-origin',
          url: '/pet?petKey=barFoo',
        });
      });
    });

    test('should add oAuth to a request', () => {
      const spec = {
        securityDefinitions: {
          ohYou: {
            type: 'oauth2',
          },
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{ ohYou: [] }],
            },
          },
        },
      };

      const authorizations = {
        ohYou: {
          token: {
            access_token: 'one two',
          },
        },
      };

      return SwaggerClient({ spec, authorizations }).then((client) => {
        const http = jest.fn();
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {
            authorization: 'Bearer one two',
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet',
        });
      });
    });

    test('should not add an empty oAuth2 Bearer token header to a request', () => {
      const spec = {
        securityDefinitions: {
          bearer: {
            description: 'Bearer authorization token',
            type: 'oauth2',
            name: 'Authorization',
            in: 'header',
          },
        },
        security: [{ bearer: [] }],
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };

      const authorizations = {
        bearer: {
          token: {
            access_token: '',
          },
        },
      };

      return SwaggerClient({ spec, authorizations }).then((client) => {
        const http = jest.fn();
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {},
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet',
        });
      });
    });

    test('should add global securites', () => {
      const spec = {
        securityDefinitions: {
          petKey: {
            type: 'apiKey',
            in: 'header',
            name: 'Auth',
          },
        },
        security: [{ petKey: [] }],
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };

      const authorizations = {
        petKey: 'yup',
      };

      return SwaggerClient({ spec, authorizations }).then((client) => {
        const http = jest.fn();
        client.execute({ http, operationId: 'getPets' });
        expect(http.mock.calls.length).toEqual(1);
        expect(http.mock.calls[0][0]).toEqual({
          headers: {
            Auth: 'yup',
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet',
        });
      });
    });

    test('should add global request interceptor', async () => {
      const spec = {
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };
      const http = jest.fn();
      const requestInterceptor = jest.fn((request) => request);
      const client = await SwaggerClient({ spec, requestInterceptor });
      await client.execute({ http, operationId: 'getPets' });

      expect(http.mock.calls[0][0].requestInterceptor).toStrictEqual(requestInterceptor);
    });

    test('should add global response interceptor', async () => {
      const spec = {
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };
      const http = jest.fn();
      const responseInterceptor = jest.fn((request) => request);
      const client = await SwaggerClient({ spec, responseInterceptor });
      await client.execute({ http, operationId: 'getPets' });

      expect(http.mock.calls[0][0].responseInterceptor).toStrictEqual(responseInterceptor);
    });
  });

  describe('#resolve', () => {
    let originalResolveFn;

    beforeEach(() => {
      originalResolveFn = SwaggerClient.resolve;
      SwaggerClient.resolve = jest.fn(async (obj) => obj);
    });

    afterEach(() => {
      SwaggerClient.resolve = originalResolveFn;
    });

    test('should use global http option', async () => {
      const spec = {
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };
      const http = jest.fn();
      const client = await SwaggerClient({ spec, http });
      await client.resolve();

      expect(SwaggerClient.resolve.mock.calls[0][0].http).toStrictEqual(http);
    });

    test('should support passing additional options', async () => {
      const spec = {
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            },
          },
        },
      };
      const http = jest.fn();
      const requestInterceptor = jest.fn();
      const client = await SwaggerClient({ spec, http });
      await client.resolve({ requestInterceptor });

      expect(SwaggerClient.resolve.mock.calls[1][0].requestInterceptor).toStrictEqual(
        requestInterceptor
      );
    });
  });

  describe('interceptor', () => {
    beforeEach(() => {
      SwaggerClient.clearCache();
      const mockPool = mockAgent.get('http://petstore.swagger.io');
      mockPool.intercept({ path: '/v2/swagger.json' }).reply(200, require('./data/petstore.json'), {
        headers: { 'Content-Type': 'application/json' },
      });
      mockPool
        .intercept({ path: '/v2/pet/3' })
        .reply(200, { id: 3 }, { headers: { 'Content-Type': 'application/json' } });
      mockPool
        .intercept({ path: '/v2/pet/4' })
        .reply(200, { id: 4 }, { headers: { 'Content-Type': 'application/json' } });
      mockPool
        .intercept({ path: '/v2/ref.json' })
        .reply(200, { b: 2 }, { headers: { 'Content-Type': 'application/json' } });
      mockPool
        .intercept({ path: '/v2/base.json' })
        .reply(
          200,
          { $ref: 'http://petstore.swagger.io/v2/ref.json#b' },
          { headers: { 'Content-Type': 'application/json' } }
        );
      mockPool
        .intercept({ path: "/v2/user/'" })
        .reply(200, { u: 'quote' }, { headers: { 'Content-Type': 'application/json' } });
      mockPool
        .intercept({ path: '/v2/user/%27' })
        .reply(
          200,
          { u: 'percent-twentyseven' },
          { headers: { 'Content-Type': 'application/json' } }
        );
    });

    test('should support request interceptor', (cb) => {
      new SwaggerClient({
        url: 'http://petstore.swagger.io/v2/swagger.json',
        requestInterceptor: (req) => {
          if (req.loadSpec) {
            return req;
          }
          req.url = 'http://petstore.swagger.io/v2/pet/4';
          return req;
        },
      }).then((client) => {
        client.apis.pet.getPetById({ petId: 3 }).then((data) => {
          expect(data.body.id).toEqual(4);
          cb();
        });
      }, cb);
    });

    test('should support response interceptor', (cb) => {
      new SwaggerClient({
        url: 'http://petstore.swagger.io/v2/swagger.json',
        responseInterceptor: (res) => {
          res.body.id = 4;
        },
      }).then((client) => {
        client.apis.pet.getPetById({ petId: 3 }).then((data) => {
          expect(data.body.id).toEqual(4);
          cb();
        });
      }, cb);
    });

    test('should support request interceptor when fetching a spec and remote ref', (cb) => {
      const spy = jest.fn().mockImplementation((a) => a);
      new SwaggerClient({
        url: 'http://petstore.swagger.io/v2/base.json',
        requestInterceptor: spy,
      })
        .then(() => {
          expect(spy.mock.calls.length).toEqual(2);
          cb();
        })
        .catch(cb);
    });

    test('should support response interceptor when fetching a spec and remote ref', (cb) => {
      const spy = jest.fn().mockImplementation((a) => a);

      new SwaggerClient({
        url: 'http://petstore.swagger.io/v2/base.json',
        responseInterceptor: spy,
      })
        .then(() => {
          expect(spy.mock.calls.length).toEqual(2);
          cb();
        })
        .catch(cb);
    });

    test('should support request and response interceptor when fetching a spec and remote ref', (cb) => {
      const reqSpy = jest.fn().mockImplementation((a) => a);
      const resSpy = jest.fn().mockImplementation((a) => a);
      new SwaggerClient({
        url: 'http://petstore.swagger.io/v2/base.json',
        responseInterceptor: reqSpy,
        requestInterceptor: resSpy,
      })
        .then(() => {
          expect(reqSpy.mock.calls.length).toEqual(2);
          expect(resSpy.mock.calls.length).toEqual(2);
          cb();
        })
        .catch(cb);
    });

    test('should give the interceptor the URL which actually hits the network', (done) => {
      expect.assertions(2);

      new SwaggerClient({
        url: 'http://petstore.swagger.io/v2/swagger.json',
        requestInterceptor: (req) => {
          if (req.url === 'http://petstore.swagger.io/v2/swagger.json') {
            return req; // skip this
          }
          expect(req.url).toEqual("http://petstore.swagger.io/v2/user/'"); // Not percent-escaped
          return req;
        },
      })
        .then((client) =>
          client.apis.user.getUserByName({ username: "'" }).then((data) => {
            expect(data.body.u).toEqual('quote'); // not percent escaped
            done();
          })
        )
        .catch(done);
    });
  });

  describe('skipNormalization', () => {
    const spec = {
      openapi: '3.0.0',
      info: {
        title: 'Cloudpotato - Medwork',
        description: 'The Cloudpotato API',
        version: '1.0.3',
        contact: {},
      },
      tags: [],
      servers: [],
      paths: {
        '/v1/clients/{id}/groups': {
          get: {
            operationId: 'getGroups',
            summary: '',
            parameters: [
              {
                name: 'options',
                required: false,
                in: 'query',
                schema: {
                  type: 'string',
                },
              },
              {
                name: 'id',
                required: true,
                in: 'path',
                schema: {
                  type: 'number',
                },
              },
            ],
            responses: {
              200: {
                description: '',
              },
            },
            tags: ['clients'],
            security: [
              {
                bearer: [],
              },
            ],
          },
        },
        '/v1/groups': {
          get: {
            operationId: 'getGroups',
            summary: '',
            parameters: [],
            responses: {
              200: {
                description: '',
              },
            },
            tags: ['groups'],
            security: [
              {
                bearer: [],
              },
            ],
          },
        },
      },
    };

    /**
     * We're deep-cloning the spec before using it as resolution mutates
     * the original object.
     */

    describe('skipNormalization', () => {
      describe('given skipNormalization option not provided', () => {
        test('should resolve with normalized interfaces', async () => {
          const client = await new SwaggerClient({ spec: cloneDeep(spec) });

          expect(client.apis.clients.getGroups1).toBeInstanceOf(Function);
          expect(client.apis.groups.getGroups2).toBeInstanceOf(Function);
        });
      });

      describe('given skipNormalization option provided as `false`', () => {
        test('should resolve with normalized interfaces', async () => {
          const client = await new SwaggerClient({
            spec: cloneDeep(spec),
            skipNormalization: false,
          });

          expect(client.apis.clients.getGroups1).toBeInstanceOf(Function);
          expect(client.apis.groups.getGroups2).toBeInstanceOf(Function);
        });
      });

      describe('given skipNormalization option provided as `true`', () => {
        test('should resolve with normalized interfaces', async () => {
          const client = await new SwaggerClient({
            spec: cloneDeep(spec),
            skipNormalization: true,
          });

          expect(client.apis.clients.getGroups).toBeInstanceOf(Function);
          expect(client.apis.groups.getGroups).toBeInstanceOf(Function);
        });
      });
    });
  });
});
