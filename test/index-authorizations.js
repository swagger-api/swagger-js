import expect, {createSpy} from 'expect'
import Swagger from '../src/index'

describe('(instance) #execute', function () {
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
        credentials: 'same-origin',
        headers: {},
        method: 'GET',
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
      myBasic: {username: 'foo', password: 'bar'}
    }

    return Swagger({spec, authorizations}).then((client) => {
      const http = createSpy()
      client.execute({http, operationId: 'getPets'})
      expect(http.calls.length).toEqual(1)
      expect(http.calls[0].arguments[0]).toEqual({
        credentials: 'same-origin',
        headers: {
          authorization: 'Basic Zm9vOmJhcg=='
        },
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
        credentials: 'same-origin',
        headers: {
          petKey: 'fooBar'
        },
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
        credentials: 'same-origin',
        headers: { },
        method: 'GET',
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
        credentials: 'same-origin',
        headers: {
          authorization: 'Bearer one two'
        },
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
        credentials: 'same-origin',
        headers: {
          Auth: 'yup'
        },
        method: 'GET',
        url: '/pet'
      })
    })
  })
})
