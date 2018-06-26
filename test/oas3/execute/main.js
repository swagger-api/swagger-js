import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import jsYaml from 'js-yaml'

import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../src/execute'

const petstoreSpec = jsYaml.safeLoad(fs.readFileSync(path.join('test', 'oas3', 'data', 'petstore-oas3.yaml'), 'utf8'))

// Supported shape...  { spec, operationId, parameters, securities, fetch }
// One can use operationId or pathItem + method

describe('buildRequest - OpenAPI Specification 3.0', () => {
  describe('fundamentals', () => {
    test('should build a request for the given operationId', () => {
      // Given
      const spec = {
        openapi: '3.0.0',
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

    test(
      'should build a request for the given operationId, using the first server by default',
      () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore'
          },
          {
            url: 'http://not-real-petstore.swagger.io/v2',
            name: 'Fake Petstore (should not be selected)'
          },
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
      }
    )

    test(
      'should build a request for the given operationId, using a specfied server',
      () => {
      // Given
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://not-real-petstore.swagger.io/v2',
            name: 'Fake Petstore (should not be selected)'
          },
          {
            url: 'http://petstore.swagger.io/{version}',
            name: 'Petstore',
            variables: {
              version: {
                default: 'v1'
              }
            }
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
      const req = buildRequest({
        spec,
        operationId: 'getMe',
        server: 'http://petstore.swagger.io/{version}',
        serverVariables: {
          version: 'v2'
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {},
      })
      }
    )

    test(
      'should build a request for the given operationId with a requestBody',
      () => {
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
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {a: 1, b: 2}
      })
      }
    )

    test('should stringify object values of form data bodies', () => {
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
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/x-www-form-urlencoded': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: {
            c: 3,
            d: 4
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'a=1&b=%7B%22c%22%3A3%2C%22d%22%3A4%7D'
      })
    })

    test(
      'should build a request for the given operationId with a requestBody, and not be overriden by an invalid Swagger2 body parameter value',
      () => {
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
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2
        },
        parameters: {
          body: {
            c: 3,
            d: 4
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {a: 1, b: 2}
      })
      }
    )

    test(
      'should build a request for the given operationId with a requestBody and a defined requestContentType',
      () => {
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
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2
        },
        requestContentType: 'application/json'
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {a: 1, b: 2}
      })
      }
    )

    test(
      'should build an operation without a body or Content-Type if the requestBody definition lacks the requestContentType',
      () => {
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
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          a: 1,
          b: 2
        },
        requestContentType: 'application/not-json'
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {}
      })
      }
    )

    test(
      'should build a request body-bearing operation with a provided requestContentType that appears in the requestBody definition even if no payload is present',
      () => {
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
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestContentType: 'application/json'
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      }
    )

    test(
      'should build a request body-bearing operation without a provided requestContentType that does not appear in the requestBody definition even if no payload is present',
      () => {
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
              operationId: 'getOne',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object'
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestContentType: 'application/not-json'
      })

      expect(req).toEqual({
        method: 'GET',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {}
      })
      }
    )

    test(
      'should not add a Content-Type when the operation has no OAS3 request body definition',
      () => {
          // Given
      const spec = {
        openapi: '3.0.0',
        servers: [{url: 'http://swagger.io/'}],
        paths: {'/one': {get: {operationId: 'getMe'}}}
      }

          // When
      const req = buildRequest({spec, operationId: 'getMe', requestContentType: 'application/josh'})

          // Then
      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {},
        credentials: 'same-origin',
        method: 'GET'
      })
      }
    )
    })
  describe('with petstore v3', () => {
    test('should build updatePetWithForm correctly', () => {
      const req = buildRequest({
        spec: petstoreSpec,
        requestContentType: 'application/x-www-form-urlencoded',
        operationId: 'updatePetWithForm',
        parameters: {
          petId: 1234
        },
        requestBody: {
          thePetId: 1234,
          name: 'OAS3 pet'
        }
      })

      expect(req).toEqual({
        method: 'POST',
        url: 'http://petstore.swagger.io/v2/pet/1234',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'thePetId=1234&name=OAS3%20pet'
      })
    })

    test('should build addPet correctly', () => {
      const req = buildRequest({
        spec: petstoreSpec,
        operationId: 'addPet',
        requestBody: {
          one: 1,
        }
      })

      expect(req).toEqual({
        method: 'POST',
        url: 'http://petstore.swagger.io/v2/pet',
        credentials: 'same-origin',
        headers: {},
        body: {
          one: 1
        }
      })
    })
  })
  describe('baseUrl', () => {
    test(
      'should consider contextUrls correctly with relative server paths',
      () => {
      const spec = {
        openapi: '3.0.0'
      }

      const res = baseUrl({
        spec,
        contextUrl: 'https://gist.githubusercontent.com/hkosova/d223eb45c5198db09d08f2603cc0e10a/raw/ae22e290b4f21e19bbfc02b97498289792579fec/relative-server.yaml'
      })

      expect(res).toEqual('https://gist.githubusercontent.com')
      }
    )
    test(
      'should default to using the first server if none is explicitly chosen',
      () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com'
          },
          {
            url: 'https://petstore.net'
          }
        ]
      }

      const res = baseUrl({
        spec
      })

      expect(res).toEqual('https://petstore.com')
      }
    )
    test('should use an explicitly chosen server', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com'
          },
          {
            url: 'https://petstore.net'
          }
        ]
      }

      const res = baseUrl({
        spec,
        server: 'https://petstore.net'
      })

      expect(res).toEqual('https://petstore.net')
    })
    test(
      'should use an explicitly chosen server at the operation level',
      () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com'
          },
          {
            url: 'https://petstore.net'
          }
        ],
        paths: {
          '/': {
            get: {
              servers: [
                {
                  url: 'https://petstore-operation.net/{path}',
                  variables: {
                    path: {
                      default: 'foobar'
                    }
                  }
                }
              ]
            }
          }
        }
      }

      const res = baseUrl({
        spec,
        server: 'https://petstore-operation.net/{path}',
        pathName: '/',
        method: 'GET'
      })

      const resWithVariables = baseUrl({
        spec,
        server: 'https://petstore-operation.net/{path}',
        serverVariables: {
          path: 'fizzbuzz'
        },
        pathName: '/',
        method: 'GET'
      })

      expect(res).toEqual('https://petstore-operation.net/foobar')
      expect(resWithVariables).toEqual('https://petstore-operation.net/fizzbuzz')
      }
    )

    test('should use an explicitly chosen server at the path level', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com'
          },
          {
            url: 'https://petstore.net'
          }
        ],
        paths: {
          '/': {
            servers: [
              {
                url: 'https://petstore-path.net/{path}',
                variables: {
                  path: {
                    default: 'foobar'
                  }
                }
              }
            ],
            get: {}
          }
        }
      }

      const res = baseUrl({
        spec,
        server: 'https://petstore-path.net/{path}',
        pathName: '/',
        method: 'GET'
      })

      const resWithVariables = baseUrl({
        spec,
        server: 'https://petstore-path.net/{path}',
        serverVariables: {
          path: 'fizzbuzz'
        },
        pathName: '/',
        method: 'GET'
      })

      expect(res).toEqual('https://petstore-path.net/foobar')
      expect(resWithVariables).toEqual('https://petstore-path.net/fizzbuzz')
    })
    test(
      'should not use an explicitly chosen server that is not present in the spec',
      () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.com'
          },
          {
            url: 'https://petstore.net'
          }
        ]
      }

      const res = baseUrl({
        spec,
        server: 'https://petstore.org'
      })

      expect(res).toEqual('https://petstore.com')
      }
    )
    test('should handle server variable substitution', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.{tld}',
            variables: {
              tld: {
                default: 'com'
              }
            }
          }
        ]
      }

      const res = baseUrl({
        spec,
        serverVariables: {
          tld: 'org'
        }
      })

      expect(res).toEqual('https://petstore.org')
    })
    test('should handle server variable substitution defaults', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'https://petstore.{tld}',
            variables: {
              tld: {
                default: 'com'
              }
            }
          }
        ]
      }

      const res = baseUrl({
        spec
      })

      expect(res).toEqual('https://petstore.com')
    })
    test(
      'should fall back to contextUrls if no servers are provided',
      () => {
      const spec = {
        openapi: '3.0.0'
      }

      const res = baseUrl({
        spec,
        server: 'http://some-invalid-server.com/',
        contextUrl: 'http://google.com/'
      })

      expect(res).toEqual('http://google.com')
      }
    )
    test('should fall back to contextUrls if servers list is empty', () => {
      const spec = {
        openapi: '3.0.0',
        servers: []
      }

      const res = baseUrl({
        spec,
        server: 'http://some-invalid-server.com/',
        contextUrl: 'http://google.com/'
      })

      expect(res).toEqual('http://google.com')
    })
    test(
      'should create a relative url based on a relative server if no contextUrl is available',
      () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: '/mypath'
          }
        ]
      }

      const res = baseUrl({
        spec,
        server: '/mypath'
      })

      expect(res).toEqual('/mypath')
      }
    )
    test(
      'should return an empty string if no servers or contextUrl are provided',
      () => {
      const spec = {
        openapi: '3.0.0'
      }

      const res = baseUrl({
        spec,
        server: 'http://some-invalid-server.com/'
      })

      expect(res).toEqual('')
      }
    )
  })
  describe('attachContentTypeForEmptyPayload', () => {
    test(
      'should attach the first media type as Content-Type to an OAS3 operation with a request body defined but no body provided',
      () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://swagger.io/'
          }
        ],
        paths: {
          '/one': {
            post: {
              operationId: 'myOp',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }

      const req = buildRequest({
        spec,
        operationId: 'myOp',
        attachContentTypeForEmptyPayload: true
      })

      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        method: 'POST'
      })
      }
    )
    test(
      'should not attach a Content-Type to an OAS3 operation with no request body definition present',
      () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://swagger.io/'
          }
        ],
        paths: {
          '/one': {
            post: {
              operationId: 'myOp'
            }
          }
        }
      }

      const req = buildRequest({
        spec,
        operationId: 'myOp',
        attachContentTypeForEmptyPayload: true
      })

      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {},
        credentials: 'same-origin',
        method: 'POST'
      })
      }
    )
    test(
      'should not attach the first media type as Content-Type without the option enabled',
      () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://swagger.io/'
          }
        ],
        paths: {
          '/one': {
            post: {
              operationId: 'myOp',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }

      const req = buildRequest({
        spec,
        operationId: 'myOp',
        // attachContentTypeForEmptyPayload is omitted
      })

      expect(req).toEqual({
        url: 'http://swagger.io/one',
        headers: {},
        credentials: 'same-origin',
        method: 'POST'
      })
      }
    )
  })
  describe('special media types', () => {
    describe('file-as-body types', () => {
      test('should preserve blobs for application/octet-stream', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/one': {
              get: {
                operationId: 'getMe',
                requestBody: {
                  content: {
                    'application/octet-stream': {
                      schema: {
                        type: 'string',
                        format: 'binary'
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'getMe',
          requestBody: Buffer.from('this is a test')
        })

        expect(req).toInclude({
          method: 'GET',
          url: '/one',
          credentials: 'same-origin',
          headers: {},
        })

        expect(req.body.toString('base64')).toEqual('dGhpcyBpcyBhIHRlc3Q=')
      })
    })
  })
})
