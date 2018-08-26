import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import qs from 'querystring'
import jsYaml from '@kyleshockey/js-yaml'

import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../../src/execute'

const petstoreSpec = jsYaml.safeLoad(fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8'))

describe('OAS 3.0 - buildRequest w/ `style` & `explode` - cookie parameters', () => {
  describe('primitive values', () => {
    const VALUE = 5

    test(
      'default: should build a cookie parameter in form/no-explode format',
      () => {
        // Given
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/users': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'id',
                    in: 'cookie'
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
            id: VALUE
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/users',
          credentials: 'same-origin',
          headers: {
            Cookie: 'id=5'
          },
        })
      }
    )

    test('should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
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
          id: VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=5'
        },
      })
    })

    test('should build a cookie parameter in form/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
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
          id: VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=5'
        },
      })
    })
  })
  describe('array values', () => {
    const VALUE = [3, 4, 5]

    test(
      'default: should build a cookie parameter in form/no-explode format',
      () => {
        // Given
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/users': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'id',
                    in: 'cookie'
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
            id: VALUE
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/users',
          credentials: 'same-origin',
          headers: {
            Cookie: 'id=3,4,5'
          },
        })
      }
    )

    test('should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
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
          id: VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=3,4,5'
        },
      })
    })

    test('should build a cookie parameter in form/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
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
          id: VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=3&id=4&id=5'
        },
      })
    })
  })
  describe('object values', () => {
    const VALUE = {
      role: 'admin',
      firstName: 'Alex'
    }

    test(
      'default: should build a cookie parameter in form/no-explode format',
      () => {
        // Given
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/users': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'id',
                    in: 'cookie'
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
            id: VALUE
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/users',
          credentials: 'same-origin',
          headers: {
            Cookie: 'id=role,admin,firstName,Alex'
          },
        })
      }
    )

    test('should build a cookie parameter in form/no-explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
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
          id: VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'id=role,admin,firstName,Alex'
        },
      })
    })

    test('should build a cookie parameter in form/explode format', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/users': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'cookie',
                  style: 'form',
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
          id: VALUE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/users',
        credentials: 'same-origin',
        headers: {
          Cookie: 'role=admin&firstName=Alex'
        },
      })
    })
  })
})
