import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../src/execute'

// Supported shape...  { spec, operationId, parameters, securities, fetch }
// One can use operationId or pathItem + method

describe.only("buildRequest - OpenAPI Specification 3.0", function () {
  it('should build a request for the given operationId', function () {
    // Given
    const spec = {
      openapi: "3.0.0",
      paths: {
        '/one': {
          get: {
            operationId: 'getMe'
          }
        }
      }
    }

    // when
    const req = buildRequest({spec, operationId: 'getMe'})

    expect(req).toEqual({
      method: 'GET',
      url: '/one',
      credentials: 'same-origin',
      headers: {},
    })
  })

  it('should build a request for the given operationId with a server provided', function () {
    // Given
    const spec = {
      openapi: '3.0.0',
      servers: [
        {
          url: 'http://petstore.swagger.io/v2',
          name: 'Petstore'
        }
      ],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe'
          }
        }
      }
    }

    // when
    const req = buildRequest({spec, operationId: 'getMe'})

    expect(req).toEqual({
      method: 'GET',
      url: 'http://petstore.swagger.io/v2/one',
      credentials: 'same-origin',
      headers: {},
    })
  })


})
