import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import qs from 'querystring'
import jsYaml from 'js-yaml'
import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../../src/execute'

const petstoreSpec = jsYaml.safeLoad(fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8'))

// Expecting the space to become `%20`, not `+`, because it's just better that way
// See: https://stackoverflow.com/a/40292688
const ALWAYS_ENCODE = ' <>"%{}|\\^'
const ALWAYS_ENCODE_RESULT = '%20%3C%3E%22%25%7B%7D%7C%5C%5E'

const ENCODE_IF_NOT_ALLOWRESERVED = ':/?#[]@!$&\'()*+,;='
// !allowReserved
const ENCODE_IF_NOT_ALLOWRESERVED_ENCODED_RESULT = '%27%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D%27'
// !!allowReserved
const ENCODE_IF_NOT_ALLOWRESERVED_UNENCODED_RESULT = ENCODE_IF_NOT_ALLOWRESERVED

const NEVER_ENCODE = 'This.Shouldnt_Be~Encoded-1234'
const NEVER_ENCODE_RESULT = NEVER_ENCODE // should be the same

describe.only('OAS 3.0 - buildRequest w/ `style` & `explode` - query parameters', function () {
  describe('primitive values', function () {
    const VALUE = NEVER_ENCODE

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
        url: `/users?id=${VALUE}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter with escaped non-RFC3986 characters', function () {
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
          id: ALWAYS_ENCODE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${ALWAYS_ENCODE_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter with escaped non-RFC3986 characters with allowReserved', function () {
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
          // these characters taken from RFC1738 Section 2.2
          // https://tools.ietf.org/html/rfc1738#section-2.2, "Unsafe"
          id: ALWAYS_ENCODE
        }
      })

      expect(req).toEqual({
        method: 'GET',
        // FIXME: ~ should be encoded as well
        url: `/users?id=${ALWAYS_ENCODE_RESULT}`,
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
        url: `/users?id=${VALUE}`,
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
        url: `/users?id=${VALUE}`,
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
          id: ENCODE_IF_NOT_ALLOWRESERVED
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${ENCODE_IF_NOT_ALLOWRESERVED_UNENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter in form/no-explode format with percent-encoding if allowReserved is not set', function () {
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
          id: ENCODE_IF_NOT_ALLOWRESERVED
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${ENCODE_IF_NOT_ALLOWRESERVED_ENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })
  })
  describe('array values', function () {
    const VALUE = [3, 4, 5, NEVER_ENCODE]

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
        url: `/users?id=3&id=4&id=5&id=${NEVER_ENCODE_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter with escaped non-RFC3986 characters', function () {
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
          id: VALUE.concat([ALWAYS_ENCODE])
        }
      })

      expect(req).toEqual({
        method: 'GET',
        // FIXME: ~ should be encoded as well
        url: `/users?id=3&id=4&id=5&id=${NEVER_ENCODE_RESULT}&id=${ALWAYS_ENCODE_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter with escaped non-RFC3986 characters with allowReserved', function () {
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
          id: VALUE.concat([ALWAYS_ENCODE])
        }
      })

      expect(req).toEqual({
        method: 'GET',
        // FIXME: ~ should be encoded as well
        url: `/users?id=3&id=4&id=5&id=${NEVER_ENCODE_RESULT}&id=${ALWAYS_ENCODE_RESULT}`,
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
        url: `/users?id=3&id=4&id=5&id=${NEVER_ENCODE_RESULT}`,
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
        url: `/users?id=3&id=4&id=5&id=${NEVER_ENCODE_RESULT}`,
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
          id: ENCODE_IF_NOT_ALLOWRESERVED.split('')
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=${ENCODE_IF_NOT_ALLOWRESERVED_UNENCODED_RESULT.split('').join(',')}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter in form/no-explode format without allowReserved', function () {
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
          id: ENCODE_IF_NOT_ALLOWRESERVED.split('')
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=%27,%3A,%2F,%3F,%23,%5B,%5D,%40,%21,%24,%26,%27,%28,%29,%2A,%2B,%2C,%3B,%3D,%27`,
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
        url: `/users?id=3 id=4 id=5 id=${NEVER_ENCODE_RESULT}`,
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

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=3 id=4 id=5 id=${NEVER_ENCODE_RESULT}`,
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
        url: `/users?id=3 4 5 ${NEVER_ENCODE_RESULT}`,
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
        url: `/users?id=3|id=4|id=5|id=${NEVER_ENCODE_RESULT}`,
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
          id: VALUE.concat([ENCODE_IF_NOT_ALLOWRESERVED])
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=3|id=4|id=5|id=${NEVER_ENCODE_RESULT}|id=${ENCODE_IF_NOT_ALLOWRESERVED_UNENCODED_RESULT}`,
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
        url: `/users?id=3|4|5|${NEVER_ENCODE_RESULT}`,
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
          id: VALUE.concat([ENCODE_IF_NOT_ALLOWRESERVED])
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=3|4|5|${NEVER_ENCODE_RESULT}|${ENCODE_IF_NOT_ALLOWRESERVED_UNENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })
  })
  describe('object values', function () {
    const VALUE = {
      role: 'admin',
      firstName: 'Alex',
      greeting: NEVER_ENCODE
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
        url: `/users?role=admin&firstName=Alex&greeting=${NEVER_ENCODE_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter with escaped non-RFC3986 characters', function () {
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
          id: {
            role: 'admin',
            firstName: ALWAYS_ENCODE
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?role=admin&firstName=${ALWAYS_ENCODE_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter with escaped non-RFC3986 characters with allowReserved', function () {
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
          id: {
            role: 'admin',
            firstName: ALWAYS_ENCODE
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?role=admin&firstName=${ALWAYS_ENCODE_RESULT}`,
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
        url: `/users?role=admin&firstName=Alex&greeting=${NEVER_ENCODE_RESULT}`,
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
        url: `/users?id=role,admin,firstName,Alex,greeting,${NEVER_ENCODE_RESULT}`,
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
          id: {
            role: 'admin',
            firstName: ENCODE_IF_NOT_ALLOWRESERVED
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=role,admin,firstName,${ENCODE_IF_NOT_ALLOWRESERVED_UNENCODED_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })

    it('should build a query parameter in form/no-explode format without allowReserved', function () {
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
          id: {
            role: 'admin',
            firstName: ENCODE_IF_NOT_ALLOWRESERVED
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: `/users?id=role,admin,firstName,${ENCODE_IF_NOT_ALLOWRESERVED_ENCODED_RESULT}`,
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
        url: `/users?id[role]=admin&id[firstName]=Alex&id[greeting]=${NEVER_ENCODE_RESULT}`,
        credentials: 'same-origin',
        headers: {},
      })
    })
  })
})
