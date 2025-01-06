import btoa from '../../../src/helpers/btoa.node.js';
import { buildRequest } from '../../../src/execute/index.js';

// OAS 3.0 Authorization

describe('Authorization - OpenAPI Specification 3.0', () => {
  test('should ignore a header parameter named `Authorization`', () => {
    const spec = {
      openapi: '3.0.4',
      paths: {
        '/': {
          get: {
            operationId: 'myOperation',
            parameters: [
              {
                name: 'Authorization',
                in: 'header',
              },
            ],
          },
        },
      },
    };

    // when
    const req = buildRequest({
      spec,
      operationId: 'myOperation',
      parameters: {
        Authorization: 'myAuthValue',
      },
    });

    // then
    expect(req).toEqual({
      method: 'GET',
      url: '/',
      credentials: 'same-origin',
      headers: {},
    });
  });

  describe('HTTP', () => {
    describe('Basic', () => {
      test('should encode credentials into the Authorization header', () => {
        const spec = {
          openapi: '3.0.4',
          components: {
            securitySchemes: {
              myBasicAuth: {
                type: 'http',
                scheme: 'basic',
              },
            },
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                security: [
                  {
                    myBasicAuth: [],
                  },
                ],
              },
            },
          },
        };

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBasicAuth: {
                username: 'somebody',
                password: 'goodpass',
              },
            },
          },
        });

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {
            Authorization: `Basic ${btoa('somebody:goodpass')}`,
          },
        });
      });

      test('should consider scheme to be case insensitive', () => {
        const spec = {
          openapi: '3.0.4',
          components: {
            securitySchemes: {
              myBasicAuth: {
                type: 'http',
                scheme: 'Basic',
              },
            },
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                security: [
                  {
                    myBasicAuth: [],
                  },
                ],
              },
            },
          },
        };

        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBasicAuth: {
                username: 'somebody',
                password: 'goodpass',
              },
            },
          },
        });

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {
            Authorization: `Basic ${btoa('somebody:goodpass')}`,
          },
        });
      });

      test('should not add credentials to operations without the security requirement', () => {
        const spec = {
          openapi: '3.0.4',
          components: {
            securitySchemes: {
              myBasicAuth: {
                type: 'http',
                scheme: 'basic',
              },
            },
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
              },
            },
          },
        };

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBasicAuth: {
                username: 'somebody',
                password: 'goodpass',
              },
            },
          },
        });

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        });
      });
      test('should allow empty password without casting undefined to string', () => {
        const spec = {
          openapi: '3.0.4',
          components: {
            securitySchemes: {
              myBasicAuth: {
                type: 'http',
                scheme: 'basic',
              },
            },
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                security: [
                  {
                    myBasicAuth: [],
                  },
                ],
              },
            },
          },
        };

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBasicAuth: {
                username: 'somebody',
                password: undefined,
              },
            },
          },
        });

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {
            Authorization: `Basic ${btoa('somebody:')}`,
          },
        });
      });
    });
    describe('Bearer', () => {
      test('should add token to the Authorization header', () => {
        const spec = {
          openapi: '3.0.4',
          components: {
            securitySchemes: {
              myBearerAuth: {
                type: 'http',
                scheme: 'bearer',
              },
            },
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                security: [
                  {
                    myBearerAuth: [],
                  },
                ],
              },
            },
          },
        };

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBearerAuth: {
                value: 'Asdf1234',
              },
            },
          },
        });

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {
            Authorization: 'Bearer Asdf1234',
          },
        });
      });

      test('should consider scheme to be case insensitive', () => {
        const spec = {
          openapi: '3.0.4',
          components: {
            securitySchemes: {
              myBearerAuth: {
                type: 'http',
                scheme: 'Bearer',
              },
            },
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
                security: [
                  {
                    myBearerAuth: [],
                  },
                ],
              },
            },
          },
        };

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBearerAuth: {
                value: 'Asdf1234',
              },
            },
          },
        });

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {
            Authorization: 'Bearer Asdf1234',
          },
        });
      });

      test('should not add credentials to operations without the security requirement', () => {
        const spec = {
          openapi: '3.0.0',
          components: {
            securitySchemes: {
              myBearerAuth: {
                type: 'http',
                scheme: 'bearer',
              },
            },
          },
          paths: {
            '/': {
              get: {
                operationId: 'myOperation',
              },
            },
          },
        };

        // when
        const req = buildRequest({
          spec,
          operationId: 'myOperation',
          securities: {
            authorized: {
              myBearerAuth: {
                value: 'Asdf1234',
              },
            },
          },
        });

        expect(req).toEqual({
          method: 'GET',
          url: '/',
          credentials: 'same-origin',
          headers: {},
        });
      });
    });
  });

  describe('apiKey', () => {
    test('should add apiKey credentials as a header', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKey: {
              type: 'apiKey',
              name: 'MyApiKeyHeader',
              in: 'header',
            },
          },
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
              security: [
                {
                  myApiKey: [],
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKey: {
              value: '===MyToken===',
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {
          MyApiKeyHeader: '===MyToken===',
        },
      });
    });
    test('should add apiKey credentials as a query param', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKey: {
              type: 'apiKey',
              name: 'myQueryParam',
              in: 'query',
            },
          },
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
              security: [
                {
                  myApiKey: [],
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKey: {
              value: 'myQueryValue',
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/?myQueryParam=myQueryValue',
        credentials: 'same-origin',
        headers: {},
      });
    });
    test('should add apiKey credentials as a cookie', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKey: {
              type: 'apiKey',
              name: 'MyApiKeyCookie',
              in: 'cookie',
            },
            myApiKey1: {
              type: 'apiKey',
              name: 'MyApiKeyCookie1',
              in: 'cookie',
            },
          },
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
              security: [
                {
                  myApiKey: [],
                  myApiKey1: [],
                },
              ],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKey: {
              value: 'MyToken',
            },
            myApiKey1: {
              value: 'MyToken1',
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {
          Cookie: 'MyApiKeyCookie=MyToken; MyApiKeyCookie1=MyToken1',
        },
      });
    });
    test('should not add credentials if operation does not call for security', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myApiKeyCookie: {
              type: 'apiKey',
              name: 'MyApiKeyCookie',
              in: 'cookie',
            },
            MyApiKeyHeader: {
              type: 'apiKey',
              name: 'MyApiKeyHeader',
              in: 'header',
            },
            myApiKeyQuery: {
              type: 'apiKey',
              name: 'myApiKeyQuery',
              in: 'query',
            },
          },
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myApiKeyQuery: {
              value: 'test',
            },
            MyApiKeyHeader: {
              value: 'test',
            },
            myApiKeyCookie: {
              value: 'test',
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {},
      });
    });
  });

  describe('OAuth2', () => {
    test('should build a request with an operation security', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myOAuth2Implicit: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'http://google.com/',
                  scopes: {
                    myScope: 'blah blah blah',
                  },
                },
              },
            },
          },
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
              security: [{ myOAuth2Implicit: [] }],
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myOAuth2Implicit: {
              token: {
                access_token: 'myTokenValue',
              },
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {
          Authorization: 'Bearer myTokenValue',
        },
      });
    });
    test('should build a request with a global security', () => {
      const spec = {
        openapi: '3.0.0',
        security: [{ myOAuth2Implicit: [] }],
        components: {
          securitySchemes: {
            myOAuth2Implicit: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'http://google.com/',
                  scopes: {
                    myScope: 'blah blah blah',
                  },
                },
              },
            },
          },
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myOAuth2Implicit: {
              token: {
                access_token: 'myTokenValue',
              },
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {
          Authorization: 'Bearer myTokenValue',
        },
      });
    });
    test('should build a request without authorization when spec does not require it', () => {
      const spec = {
        openapi: '3.0.0',
        components: {
          securitySchemes: {
            myOAuth2Implicit: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: 'http://google.com/',
                  scopes: {
                    myScope: 'blah blah blah',
                  },
                },
              },
            },
          },
        },
        paths: {
          '/': {
            get: {
              operationId: 'myOperation',
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'myOperation',
        securities: {
          authorized: {
            myOAuth2Implicit: {
              token: {
                access_token: 'myTokenValue',
              },
            },
          },
        },
      });

      expect(req).toEqual({
        method: 'GET',
        url: '/',
        credentials: 'same-origin',
        headers: {},
      });
    });
  });
  test('should use a custom oAuth token name if defined', () => {
    const spec = {
      openapi: '3.0.0',
      components: {
        securitySchemes: {
          myOAuth2Implicit: {
            type: 'oauth2',
            'x-tokenName': 'id_token',
          },
        },
      },
      paths: {
        '/': {
          get: {
            operationId: 'myOperation',
            security: [{ myOAuth2Implicit: [] }],
          },
        },
      },
    };

    const req = buildRequest({
      spec,
      operationId: 'myOperation',
      securities: {
        authorized: {
          myOAuth2Implicit: {
            token: {
              access_token: 'otherTokenValue',
              id_token: 'myTokenValue',
            },
          },
        },
      },
    });
    expect(req).toEqual({
      method: 'GET',
      url: '/',
      credentials: 'same-origin',
      headers: {
        Authorization: 'Bearer myTokenValue',
      },
    });
  });
  test('should support openIdConnect security scheme', () => {
    const spec = {
      openapi: '3.0.0',
      components: {
        securitySchemes: {
          myOIDC: {
            type: 'openIdConnect',
            openIdConnectUrl: 'https://accounts.google.com/.well-known/openid-configuration',
          },
        },
      },
      paths: {
        '/': {
          get: {
            operationId: 'myOperation',
            security: [{ myOIDC: [] }],
          },
        },
      },
    };

    const req = buildRequest({
      spec,
      operationId: 'myOperation',
      securities: {
        authorized: {
          myOIDC: {
            token: {
              access_token: 'myTokenValue',
            },
          },
        },
      },
    });
    expect(req).toEqual({
      method: 'GET',
      url: '/',
      credentials: 'same-origin',
      headers: {
        Authorization: 'Bearer myTokenValue',
      },
    });
  });
});
