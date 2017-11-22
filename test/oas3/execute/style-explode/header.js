import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import qs from 'querystring'
import jsYaml from 'js-yaml'

import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../../src/execute'

const petstoreSpec = jsYaml.safeLoad(fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8'))

describe('OAS 3.0 - buildRequest w/ `style` & `explode` - header parameters', function () {
  describe('primitive values', function () {
    const VALUE = 5

    it('default: should build a header parameter in simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header'
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': 5
        },
      })
    })

    it('should build a header parameter in simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header',
                  style: 'simple',
                  explode: false
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': 5
        },
      })
    })

    it('should build a header parameter in simple/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header',
                  style: 'simple',
                  explode: true
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': 5
        },
      })
    })
  })
  describe('array values', function () {
    const VALUE = [3, 4, 5]

    it('default: should build a header parameter in simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header'
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': '3,4,5'
        },
      })
    })

    it('should build a header parameter in simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header',
                  style: 'simple',
                  explode: false
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': '3,4,5'
        },
      })
    })

    it('should build a header parameter in simple/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header',
                  style: 'simple',
                  explode: true
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': '3,4,5'
        },
      })
    })
  })
  describe('object values', function () {
    const VALUE = {
      role: 'admin',
      firstName: 'Alex'
    }

    it('default: should build a header parameter in simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header'
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': 'role,admin,firstName,Alex'
        },
      })
    })

    it('should build a header parameter in simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header',
                  style: 'simple',
                  explode: false
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': 'role,admin,firstName,Alex'
        },
      })
    })

    it('should build a header parameter in simple/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'X-MyHeader',
                  in: 'header',
                  style: 'simple',
                  explode: true
                }
              ]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        parameters: {
          'X-MyHeader': VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          'X-MyHeader': 'role=admin,firstName=Alex'
        },
      })
    })
  })
})
