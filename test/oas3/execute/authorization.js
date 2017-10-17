import expect, {createSpy, spyOn} from 'expect'
import xmock from 'xmock'
import path from 'path'
import fs from 'fs'
import btoa from 'btoa'
import jsYaml from 'js-yaml'

import {execute, buildRequest, baseUrl, applySecurities, self as stubs} from '../../../src/execute'


// OAS 3.0 Authorization
//
// Testing TODO:
// - [ ] Ignore `Authorization` header parameters
// - [ ] OAuth2 with credentials in constructor
// - [ ] OAuth2 with credentials through buildRequest/execute
// - [ ] HTTP Basic with credentials in constructor
// - [ ] HTTP Basic with credentials through buildRequest/execute
// - [ ] HTTP Bearer with credentials in constructor
// - [ ] HTTP Bearer with credentials through buildRequest/execute

describe('Authorization - OpenAPI Specification 3.0', function () {
  it('should ignore a header parameter named `Authorization`', () => {
    const spec = {
      openapi: '3.0.0',
      paths: {
        '/': {
          get: {
            operationId: 'myOperation',
            parameters: [
              {
                name: 'Authorization',
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
        Authorization: 'myAuthValue'
      }
    })

    // then
    expect(req).toEqual({
      method: 'GET',
      url: '/',
      credentials: 'same-origin',
      headers: {},
    })
  })

  describe('HTTP', () => {
    describe('Basic', () => {
      it('should encode credentials into the Authorization header', () => {
        const spec = {
          openapi: '3.0.0',
          components: {
            securitySchemes: {
              myBasicAuth: {
                type: 'http',
                in: 'header',
                scheme: 'basic'
              }
            }
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                security: [{
                  myBasicAuth: []
                }],
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBasicAuth: {
                username: 'somebody',
                password: 'goodpass'
              }
            }
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {
            Authorization: `Basic ${btoa('somebody:goodpass')}`
          },
        })
      })
      it('should not add credentials to operations without the security requirement', () => {
        const spec = {
          openapi: '3.0.0',
          components: {
            securitySchemes: {
              myBasicAuth: {
                type: 'http',
                in: 'header',
                scheme: 'basic'
              }
            }
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation'
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBasicAuth: {
                username: 'somebody',
                password: 'goodpass'
              }
            }
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
    })
    describe('Bearer', () => {
      it('should add token to the Authorization header', () => {
        const spec = {
          openapi: '3.0.0',
          components: {
            securitySchemes: {
              myBearerAuth: {
                type: 'http',
                in: 'header',
                scheme: 'bearer'
              }
            }
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                security: [{
                  myBearerAuth: []
                }]
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBearerAuth: {
                value: 'Asdf1234'
              }
            }
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {
            Authorization: 'Bearer Asdf1234'
          },
        })
      })
      it('should not add credentials to operations without the security requirement', () => {
        const spec = {
          openapi: '3.0.0',
          components: {
            securitySchemes: {
              myBearerAuth: {
                type: 'http',
                in: 'header',
                scheme: 'bearer'
              }
            }
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
              }
            }
          }
        }

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBearerAuth: {
                value: 'Asdf1234'
              }
            }
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
    })
  })

  describe('apiKey', () => {
    it('should add apiKey credentials as a header', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKey: {
              type: 'apiKey',
              name: 'MyApiKeyHeader',
              in: 'header'
            }
          }
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
              security: [{
                myApiKey: []
              }]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKey: {
              value: '===MyToken==='
            }
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {
          MyApiKeyHeader: '===MyToken==='
        },
      })
    })
    it('should add apiKey credentials as a query param', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKey: {
              type: 'apiKey',
              name: 'myQueryParam',
              in: 'query'
            }
          }
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
              security: [{
                myApiKey: []
              }]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKey: {
              value: 'myQueryValue'
            }
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/?myQueryParam=myQueryValue',
        credentials: 'same-origin',
        headers: {}
      })
    })
    it('should add apiKey credentials as a cookie', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKey: {
              type: 'apiKey',
              name: 'MyApiKeyCookie',
              in: 'cookie'
            }
          }
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
              security: [{
                myApiKey: []
              }]
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKey: {
              value: 'MyToken'
            }
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {
          Cookie: 'MyApiKeyCookie=MyToken'
        },
      })
    })
    it('should not add credentials if operation does not call for security', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKeyCookie: {
              type: 'apiKey',
              name: 'MyApiKeyCookie',
              in: 'cookie'
            },
            MyApiKeyHeader: {
              type: 'apiKey',
              name: 'MyApiKeyHeader',
              in: 'header'
            },
            myApiKeyQuery: {
              type: 'apiKey',
              name: 'myApiKeyQuery',
              in: 'query'
            }
          }
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation'
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKeyQuery: {
              value: 'test'
            },
            MyApiKeyHeader: {
              value: 'test'
            },
            myApiKeyCookie: {
              value: 'test'
            },
          }
        }
      })

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {},
      })
    })
  })

  describe.skip('OAuth2', () => {
    describe('implicit', () => {
      it('should build a request with constructor credentials', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'Authorization',
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
            Authorization: 'myAuthValue'
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
      it('should build a request with buildRequest credentials', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'Authorization',
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
            Authorization: 'myAuthValue'
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
      it('should set buildRequest credentials over constructor', () => {
        const spec = {
          openapi: '3.0.0',
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                parameters: [
                  {
                    name: 'Authorization',
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
            Authorization: 'myAuthValue'
          }
        })

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        })
      })
    })
    describe('password', () => {

    })
    describe('application', () => {

    })
    describe('access code', () => {

    })
  })
})
