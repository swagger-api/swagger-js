import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../src/execute'

import path from 'path'
import fs from 'fs'
import jsYaml from 'js-yaml'

const petstoreSpec = jsYaml.safeLoad(fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8'))

// Supported shape...  { spec, operationId, parameters, securities, fetch }
// One can use operationId or pathItem + method

describe("buildRequest - OpenAPI Specification 3.0", function () {

  describe('fundamentals', function () {
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
      const req = buildRequest({
        spec, 
        operationId: 'getMe'
      })

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

  describe('with petstore v3', function () {
    it('should build getPets correctly', function () {

      const req = buildRequest({
        spec: petstoreSpec, 
        operationId: 'getPets'
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/pets',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build addPet correctly', function () {
      const req = buildRequest({
        spec: petstoreSpec,
        operationId: 'addPet',
        parameters: {
          body: {
            one: 1,
          }
        }})

      expect(req).toEqual({
        method: 'POST',
        url: 'http://petstore.swagger.io/v2/pets',
        credentials: 'same-origin',
        headers: {},
        body: {
          one: 1
        }
      })
    })
  })

})
