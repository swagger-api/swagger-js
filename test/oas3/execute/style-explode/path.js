import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import qs from 'querystring'
import jsYaml from 'js-yaml'
import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../../src/execute'

const petstoreSpec = jsYaml.safeLoad(fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8'))

describe('OAS 3.0 - buildRequest w/ `style` & `explode` - path parameters', function () {
  describe('primitive values', function () {
    it('default: should build a path parameter in a simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path'
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
          id: 5
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: 5
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a simple/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: 5
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a label/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: 5
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a label/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: 5
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a matrix/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: 5
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a matrix/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: 5
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=5',
        credentials: 'same-origin',
        headers: {},
      })
    })
  })
  describe('array values', function () {
    it('default: should build a path parameter in a simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path'
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
          id: [3, 4, 5]
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/3,4,5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: [3, 4, 5]
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/3,4,5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a simple/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: [3, 4, 5]
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/3,4,5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a label/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: [3, 4, 5]
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.3.4.5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a label/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: [3, 4, 5]
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.3.4.5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a matrix/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: [3, 4, 5]
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=3,4,5',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a matrix/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: [3, 4, 5]
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=3;id=4;id=5',
        credentials: 'same-origin',
        headers: {},
      })
    })
  })
  describe('object values', function () {
    it('default: should build a path parameter in a simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path'
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
          id: {
            role: 'admin',
            firstName: 'Alex'
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/role,admin,firstName,Alex',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a simple/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: {
            role: 'admin',
            firstName: 'Alex'
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/role,admin,firstName,Alex',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a simple/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
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
          id: {
            role: 'admin',
            firstName: 'Alex'
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/role=admin,firstName=Alex',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a label/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: {
            role: 'admin',
            firstName: 'Alex'
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.role.admin.firstName.Alex',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a label/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'label',
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
          id: {
            role: 'admin',
            firstName: 'Alex'
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/.role=admin.firstName=Alex',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a matrix/no-explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: {
            role: 'admin',
            firstName: 'Alex'
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;id=role,admin,firstName,Alex',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a matrix/explode format', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/{id}': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'id',
                  in: 'path',
                  style: 'matrix',
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
          id: {
            role: 'admin',
            firstName: 'Alex'
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;role=admin;firstName=Alex',
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a path parameter in a matrix/no-explode format when not present in the path definition', function () {
      // Given
      const spec = {
        openapi: '3.0.0',
        paths: {
          '/path/': {
            get: {
              operationId: 'myOperation',
              parameters: [
                {
                  name: 'type',
                  in: 'path',
                  style: 'matrix',
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
          type: 'PullTask'
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/path/;type=PullTask',
        credentials: 'same-origin',
        headers: {},
      })
    })
  })
})
