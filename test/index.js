import xmock from 'xmock';
import cloneDeep from 'lodash/cloneDeep';

import Swagger from '../src/index.js';

describe('constructor', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    xmock().restore();
  });

  test('should export a function', () => {
    expect(typeof Swagger).toBe('function');
  });

  test('should return an instance, without "new"', (cb) => {
    Swagger({ spec: {} }).then((instance) => {
      expect(instance).toBeInstanceOf(Swagger);
      cb();
    });
  });

  describe('instance', () => {
    test('should ignore an empty spec', () => {
      // Given
      const spec = {};

      return Swagger({ spec }).then((swag) => {
        expect(swag.spec).toEqual({});
      });
    });

    test('should resolve the spec', () => {
      // Given
      const spec = {
        one: {
          $ref: '#/two',
        },
        two: {
          hi: 'hello',
        },
      };

      return Swagger({ spec, allowMetaPatches: false }).then((swag) => {
        expect(swag.spec).toEqual({
          one: {
            hi: 'hello',
          },
          two: {
            hi: 'hello',
          },
        });
      });
    });

    test('should resolve a cyclic spec when baseDoc is specified', (cb) => {
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

      Swagger.resolve({ spec, baseDoc: 'http://whatever/' }).then((swag) => {
        expect(swag.errors).toEqual([]);
        cb();
      });
    });

    test('should keep resolve errors in #errors', () => {
      // Given
      const spec = {
        $ref: 1,
      };

      return Swagger({ spec }).then((swag) => {
        expect(swag.errors[0].message).toEqual('$ref: must be a string (JSON-Ref)');
      });
    });

    test('should NOT add `apis` if disableInterfaces', () =>
      Swagger({ spec: {}, disableInterfaces: true }).then((swag) => {
        expect(swag.apis).toEqual();
      }));

    test('should add `apis` from the makeApisTagOperation', () => {
      // Given
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

      // When
      return Swagger({ spec }).then((swag) => {
        const { apis } = swag;

        // Then
        expect(typeof apis).toBe('object');
        expect(apis.me.getMe).toBeInstanceOf(Function);
      });
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
      return Swagger({
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
      return Swagger.resolve({
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
    test('should throw if fetch error', (cb) => {
      const xapp = xmock();
      xapp.get('http://petstore.swagger.io/404', (req, res) => {
        res.status(404);
        res.send('not found');
      });

      new Swagger({ url: 'http://petstore.swagger.io/404' }).catch((err) => {
        expect(err.status).toBe(404);
        expect(err.message).toBe('Not Found');
        cb();
      });
    });

    test('should serialize the response', () => {
      // Given
      xmock().get('https://swagger.io/one', (req, res) => {
        res.set('hi', 'ho');
        return res.send({ me: true });
      });

      const req = {
        url: 'https://swagger.io/one',
      };

      return Swagger.http(req).then((res) => {
        expect(res).toMatchObject({
          url: req.url,
          ok: true,
          status: 200,
          headers: {
            connection: 'close',
            'content-type': 'application/json',

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
    });

    test('should handle invalid JSON bodies', () => {
      // Given
      xmock().get('https://swagger.io/one', (req, res) => res.send('['));

      const req = {
        url: 'https://swagger.io/one',
      };

      return Swagger.http(req).then((res) => {
        const { body, text, status } = res;
        expect(status).toEqual(200);
        expect(text).toEqual('[');
        expect(body).toEqual();
      });
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
      return Swagger({ spec }).then((client) => {
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
      return Swagger({ spec }).then((client) => {
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

      return Swagger({ spec, authorizations }).then((client) => {
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

      return Swagger({ spec, authorizations }).then((client) => {
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

      return Swagger({ spec, authorizations }).then((client) => {
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

      return Swagger({ spec, authorizations }).then((client) => {
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

      return Swagger({ spec, authorizations }).then((client) => {
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

      return Swagger({ spec, authorizations }).then((client) => {
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
      const client = await Swagger({ spec, requestInterceptor });
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
      const client = await Swagger({ spec, responseInterceptor });
      await client.execute({ http, operationId: 'getPets' });

      expect(http.mock.calls[0][0].responseInterceptor).toStrictEqual(responseInterceptor);
    });
  });

  describe('#resolve', () => {
    let originalResolveFn;

    beforeEach(() => {
      originalResolveFn = Swagger.resolve;
      Swagger.resolve = jest.fn(async (obj) => obj);
    });

    afterEach(() => {
      Swagger.resolve = originalResolveFn;
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
      const client = await Swagger({ spec, http });
      await client.resolve();

      expect(Swagger.resolve.mock.calls[0][0].http).toStrictEqual(http);
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
      const client = await Swagger({ spec, http });
      await client.resolve({ requestInterceptor });

      expect(Swagger.resolve.mock.calls[1][0].requestInterceptor).toStrictEqual(requestInterceptor);
    });
  });

  describe('interceptor', () => {
    beforeEach(() => {
      Swagger.clearCache();
      const xapp = xmock();
      xapp
        .get('http://petstore.swagger.io/v2/swagger.json', () => require('./data/petstore.json'))
        .get('http://petstore.swagger.io/v2/pet/3', () => ({ id: 3 }))
        .get('http://petstore.swagger.io/v2/pet/4', () => ({ id: 4 }))
        .get('http://petstore.swagger.io/v2/ref.json', () => ({ b: 2 }))
        .get('http://petstore.swagger.io/v2/base.json', () => ({
          $ref: 'http://petstore.swagger.io/v2/ref.json#b',
        }));
    });

    test('should support request interceptor', (cb) => {
      new Swagger({
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
      new Swagger({
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
      new Swagger({
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

      new Swagger({
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
      new Swagger({
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
          const client = await new Swagger({ spec: cloneDeep(spec) });

          expect(client.apis.clients.getGroups1).toBeInstanceOf(Function);
          expect(client.apis.groups.getGroups2).toBeInstanceOf(Function);
        });
      });

      describe('given skipNormalization option provided as `false`', () => {
        test('should resolve with normalized interfaces', async () => {
          const client = await new Swagger({ spec: cloneDeep(spec), skipNormalization: false });

          expect(client.apis.clients.getGroups1).toBeInstanceOf(Function);
          expect(client.apis.groups.getGroups2).toBeInstanceOf(Function);
        });
      });

      describe('given skipNormalization option provided as `true`', () => {
        test('should resolve with normalized interfaces', async () => {
          const client = await new Swagger({ spec: cloneDeep(spec), skipNormalization: true });

          expect(client.apis.clients.getGroups).toBeInstanceOf(Function);
          expect(client.apis.groups.getGroups).toBeInstanceOf(Function);
        });
      });
    });
  });
});
