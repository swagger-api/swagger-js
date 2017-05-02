import expect, {createSpy} from 'expect'
import xmock from 'xmock'
import Swagger from '../src/index'

describe('constructor', () => {
  afterEach(function () {
    expect.restoreSpies()
    xmock().restore()
  })

  it('should export a function', () => {
    expect(Swagger).toBeA('function')
  })

  it('should return an instance, without "new"', function (cb) {
    Swagger({spec: {}}).then((instance) => {
      expect(instance).toBeA(Swagger)
      cb()
    })
  })

  describe('instance', function () {
    it('should ignore an empty spec', function () {
      // Given
      const spec = {}

      return Swagger({spec}).then((swag) => {
        expect(swag.spec).toEqual({})
      })
    })

    it('should resolve the spec', function () {
      // Given
      const spec = {
        one: {
          $ref: '#/two'
        },
        two: {
          hi: 'hello'
        }
      }

      return Swagger({spec, allowMetaPatches: false}).then((swag) => {
        expect(swag.spec).toEqual({
          one: {
            hi: 'hello'
          },
          two: {
            hi: 'hello'
          }
        })
      })
    })

    it('should resolve a cyclic spec when baseDoc is specified', function (cb) {
      const spec = {
        paths: {
          post: {
            parameters: [
              {
                $ref: '#/definitions/list',
              }
            ]
          }
        },
        definitions: {
          item: {
            items: {
              $ref: '#/definitions/item'
            }
          },
          list: {
            items: {
              $ref: '#/definitions/item'
            }
          }
        }
      }

      Swagger.resolve({spec, baseDoc: 'http://whatever/'}).then((swag) => {
        expect(swag.errors).toEqual([])
        cb()
      })
    })


    it('should keep resolve errors in #errors', function () {
      // Given
      const spec = {
        $ref: 1
      }

      return Swagger({spec}).then((swag) => {
        expect(swag.errors[0].message).toEqual('$ref: must be a string (JSON-Ref)')
      })
    })

    it('should NOT add `apis` if disableInterfaces', function () {
      return Swagger({spec: {}, disableInterfaces: true}).then((swag) => {
        expect(swag.apis).toEqual()
      })
    })

    it('should add `apis` from the makeApisTagOperation', function () {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: {
              tags: ['me'],
              operationId: 'getMe'
            }
          }
        }
      }

      // When
      return Swagger({spec}).then((swag) => {
        const {apis} = swag

        // Then
        expect(apis).toBeAn('object')
        expect(apis.me.getMe).toBeA(Function)
      })
    })

    it('should handle circular $refs when a baseDoc is provided', () => {
      // Given
      const spec = {
        swagger: '2.0',
        definitions: {
          node: {
            required: ['id', 'nodes'],
            type: 'object',
            properties: {
              id: {
                type: 'string'
              },
              nodes: {
                type: 'array',
                items: {
                  $ref: '#/definitions/node'
                }
              }
            }
          }
        }
      }

      // When
      return Swagger.resolve({
        spec,
        allowMetaPatches: false,
        baseDoc: 'http://example.com/swagger.json'
      }).then(handleResponse)

      // Then
      function handleResponse(obj) {
        expect(obj.errors).toEqual([])
        expect(obj.spec).toEqual(spec)
      }
    })
  })

  describe('#http', function () {
    it('should throw if fetch error', function (cb) {
      const xapp = xmock()
      xapp.get('http://petstore.swagger.io/404', (req, res) => {
        res.status(404)
        res.send('not found')
      })

      new Swagger({url: 'http://petstore.swagger.io/404'})
        .catch((err) => {
          expect(err.status).toBe(404)
          expect(err.message).toBe('Not Found')
          cb()
        })
    })

    it('should serialize the response', function () {
      // Given
      require('isomorphic-fetch') // To ensure global.Headers
      const xapp = xmock().get('https://swagger.io/one', function (req, res, next) {
        res.set('hi', 'ho')
        return res.send({me: true})
      })

      const req = {
        url: 'https://swagger.io/one',
      }

      return Swagger.http(req)
        .then((res) => {
          expect(res).toInclude({
            url: req.url,
            ok: true,
            status: 200,
            headers: {
              connection: 'close',
              'content-type': 'application/json',

              hi: 'ho'
            },
            statusText: 'OK',
            data: '{"me":true}',
            text: '{"me":true}',
            body: {
              me: true
            },
            obj: {
              me: true
            },
          })
        })
    })

    it('should handle invalid JSON bodies', function () {
      // Given
      const xapp = xmock().get('https://swagger.io/one', function (req, res, next) {
        return res.send('[')
      })

      const req = {
        url: 'https://swagger.io/one'
      }

      return Swagger.http(req)
        .then((res) => {
          const {body, text, status} = res
          expect(status).toEqual(200)
          expect(text).toEqual('[')
          expect(body).toEqual()
        })
    })
  })

  describe('#execute', function () {
    it('should be able to execute a simple operation', function () {
      const spec = {
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets'
            }
          }
        }
      }
      return Swagger({spec}).then((client) => {
        const http = createSpy()
        client.execute({http, operationId: 'getPets'})
        expect(http.calls.length).toEqual(1)
        expect(http.calls[0].arguments[0]).toEqual({
          headers: {},
          method: 'GET',
          credentials: 'same-origin',
          url: '/pet'
        })
      })
    })

    it('should add basic auth to a request', function () {
      const spec = {
        securityDefinitions: {
          myBasic: {
            type: 'basic'
          }
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{myBasic: []}]
            }
          }
        }
      }

      const authorizations = {
        myBasic: {
          username: 'foo',
          password: 'bar'
        }
      }

      return Swagger({spec, authorizations}).then((client) => {
        const http = createSpy()
        client.execute({http, operationId: 'getPets'})
        expect(http.calls.length).toEqual(1)
        expect(http.calls[0].arguments[0]).toEqual({
          headers: {
            authorization: 'Basic Zm9vOmJhcg=='
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet'
        })
      })
    })

    it('should add apiKey (header) auth to a request', function () {
      const spec = {
        securityDefinitions: {
          petKey: {
            type: 'apiKey',
            name: 'petKey',
            in: 'header'
          }
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{petKey: []}]
            }
          }
        }
      }

      const authorizations = {
        petKey: 'fooBar'
      }

      return Swagger({spec, authorizations}).then((client) => {
        const http = createSpy()
        client.execute({http, operationId: 'getPets'})
        expect(http.calls.length).toEqual(1)
        expect(http.calls[0].arguments[0]).toEqual({
          headers: {
            petKey: 'fooBar'
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet'
        })
      })
    })

    it('should add apiKey (query) auth to a request', function () {
      const spec = {
        securityDefinitions: {
          petKey: {
            type: 'apiKey',
            name: 'petKey',
            in: 'query'
          }
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{petKey: []}]
            }
          }
        }
      }

      const authorizations = {
        petKey: 'barFoo'
      }

      return Swagger({spec, authorizations}).then((client) => {
        const http = createSpy()
        client.execute({http, operationId: 'getPets'})
        expect(http.calls.length).toEqual(1)
        expect(http.calls[0].arguments[0]).toEqual({
          headers: { },
          method: 'GET',
          credentials: 'same-origin',
          url: '/pet?petKey=barFoo'
        })
      })
    })

    it('should add oAuth to a request', function () {
      const spec = {
        securityDefinitions: {
          ohYou: {
            type: 'oauth2',
          }
        },
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
              security: [{ohYou: []}]
            }
          }
        }
      }

      const authorizations = {
        ohYou: {
          token: {
            access_token: 'one two'
          }
        }
      }

      return Swagger({spec, authorizations}).then((client) => {
        const http = createSpy()
        client.execute({http, operationId: 'getPets'})
        expect(http.calls.length).toEqual(1)
        expect(http.calls[0].arguments[0]).toEqual({
          headers: {
            authorization: 'Bearer one two'
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet'
        })
      })
    })

    it('should add global securites', function () {
      const spec = {
        securityDefinitions: {
          petKey: {
            type: 'apiKey',
            in: 'header',
            name: 'Auth'
          }
        },
        security: [{petKey: []}],
        paths: {
          '/pet': {
            get: {
              operationId: 'getPets',
            }
          }
        }
      }

      const authorizations = {
        petKey: 'yup'
      }

      return Swagger({spec, authorizations}).then((client) => {
        const http = createSpy()
        client.execute({http, operationId: 'getPets'})
        expect(http.calls.length).toEqual(1)
        expect(http.calls[0].arguments[0]).toEqual({
          headers: {
            Auth: 'yup'
          },
          credentials: 'same-origin',
          method: 'GET',
          url: '/pet'
        })
      })
    })
  })

  describe('interceptor', function () {
    beforeEach(() => {
      const xapp = xmock()
      xapp
        .get('http://petstore.swagger.io/v2/swagger.json', () => require('./data/petstore.json'))
        .get('http://petstore.swagger.io/v2/pet/3', () => ({id: 3}))
        .get('http://petstore.swagger.io/v2/pet/4', () => ({id: 4}))
    })

    it('should support request interceptor', function (cb) {
      new Swagger({
        url: 'http://petstore.swagger.io/v2/swagger.json',
        requestInterceptor: (req) => {
          req.url = 'http://petstore.swagger.io/v2/pet/4'
        }
      }).then((client) => {
        client.apis.pet.getPetById({petId: 3}).then((data) => {
          expect(data.body.id).toEqual(4)
          cb()
        })
      }, cb)
    })

    it('should support response interceptor', function (cb) {
      new Swagger({
        url: 'http://petstore.swagger.io/v2/swagger.json',
        responseInterceptor: (res) => {
          res.body.id = 4
        }
      }).then((client) => {
        client.apis.pet.getPetById({petId: 3}).then((data) => {
          expect(data.body.id).toEqual(4)
          cb()
        })
      }, cb)
    })
  })
})
