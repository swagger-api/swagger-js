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
    Swagger().then((instance) => {
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
  })

  describe('#http', function () {
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
