import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import qs from 'querystring'
import jsYaml from 'js-yaml'

import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../src/execute'

const petstoreSpec = jsYaml.safeLoad(fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8'))

// Supported shape...  { spec, operationId, parameters, securities, fetch }
// One can use operationId or pathItem + method

describe('buildRequest w/ `style` & `explode` - OpenAPI Specification 3.0', function () {
  describe('path parameters', function () {
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
    })
  })
  describe('query parameters', function () {
    describe('primitive values', function () {
      const VALUE = 5

      it('default: should build a query parameter in form/explode format', function () {
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
                    in: 'query'
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
          url: '/users?id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in form/explode format', function () {
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
                    in: 'query',
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
          url: '/users?id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in form/no-explode format', function () {
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
                    in: 'query',
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
          url: '/users?id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })
    })
    describe('array values', function () {
      const VALUE = [3, 4, 5]

      it('default: should build a query parameter in form/explode format', function () {
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
                    in: 'query'
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
          url: '/users?id=3&id=4&id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in form/explode format', function () {
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
                    in: 'query',
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
          url: '/users?id=3&id=4&id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in form/no-explode format', function () {
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
                    in: 'query',
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
          url: '/users?id=3%2C4%2C5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in form/no-explode format with allowReserved', function () {
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
                    in: 'query',
                    style: 'form',
                    explode: false,
                    allowReserved: true
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
          url: '/users?id=3,4,5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in space-delimited/explode format', function () {
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
                    in: 'query',
                    style: 'spaceDelimited',
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
          url: '/users?id=3%20id=4%20id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in space-delimited/explode format with allowReserved', function () {
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
                    in: 'query',
                    style: 'spaceDelimited',
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
        // whitespace is _not_ an RFC3986 reserved character,
        // so it should still be escaped!
        expect(req).toEqual({
          method: 'GET',
          url: '/users?id=3%20id=4%20id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in space-delimited/no-explode format', function () {
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
                    in: 'query',
                    style: 'spaceDelimited',
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
          url: '/users?id=3%204%205',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in pipe-delimited/explode format', function () {
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
                    in: 'query',
                    style: 'pipeDelimited',
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
          url: '/users?id=3%7Cid=4%7Cid=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in pipe-delimited/explode format with allowReserved', function () {
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
                    in: 'query',
                    style: 'pipeDelimited',
                    explode: true,
                    allowReserved: true
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
          url: '/users?id=3|id=4|id=5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in pipe-delimited/no-explode format', function () {
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
                    in: 'query',
                    style: 'pipeDelimited',
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
          url: '/users?id=3%7C4%7C5',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in pipe-delimited/no-explode format with allowReserved', function () {
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
                    in: 'query',
                    style: 'pipeDelimited',
                    explode: false,
                    allowReserved: true
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
          url: '/users?id=3|4|5',
          credentials: 'same-origin',
          headers: {},
        })
      })
    })
    describe('object values', function () {
      const VALUE = {
        role: 'admin',
        firstName: 'Alex'
      }

      it('default: should build a query parameter in form/explode format', function () {
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
                    in: 'query'
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
          url: '/users?role=admin&firstName=Alex',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in form/explode format', function () {
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
                    in: 'query',
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
          url: '/users?role=admin&firstName=Alex',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in form/no-explode format', function () {
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
                    in: 'query',
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
          url: '/users?id=role,admin,firstName,Alex',
          credentials: 'same-origin',
          headers: {},
        })
      })

      it('should build a query parameter in deepObject/explode format', function () {
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
                    in: 'query',
                    style: 'deepObject',
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
          url: '/users?id[role]=admin&id[firstName]=Alex',
          credentials: 'same-origin',
          headers: {},
        })
      })
    })
  })
  describe('header parameters', function () {
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
  describe('cookie parameters', function () {
    describe('primitive values', function () {
      const VALUE = 5

      it('default: should build a cookie parameter in form/no-explode format', function () {
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
      })

      it('should build a cookie parameter in form/no-explode format', function () {
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

      it('should build a cookie parameter in form/explode format', function () {
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
    describe('array values', function () {
      const VALUE = [3, 4, 5]

      it('default: should build a cookie parameter in form/no-explode format', function () {
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
      })

      it('should build a cookie parameter in form/no-explode format', function () {
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

      it('should build a cookie parameter in form/explode format', function () {
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
    describe('object values', function () {
      const VALUE = {
        role: 'admin',
        firstName: 'Alex'
      }

      it('default: should build a cookie parameter in form/no-explode format', function () {
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
      })

      it('should build a cookie parameter in form/no-explode format', function () {
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

      it('should build a cookie parameter in form/explode format', function () {
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
})
