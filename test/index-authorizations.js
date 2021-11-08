import Swagger from '../src/index.js';

describe('(instance) #execute', () => {
  test('should be able to execute a simple operation', () => {
    const spec = {
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
          },
        },
      },
    };
    return Swagger({ spec }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {},
        method: 'GET',
        url: '/pet',
      });
    });
  });

  test('should add basic auth to a request', () => {
    const spec = {
      securityDefinitions: {
        myBasic: {
          type: 'basic',
        },
      },
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
            security: [{ myBasic: [] }],
          },
        },
      },
    };

    const authorizations = {
      myBasic: { username: 'foo', password: 'bar' },
    };

    return Swagger({ spec, authorizations }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {
          authorization: 'Basic Zm9vOmJhcg==',
        },
        method: 'GET',
        url: '/pet',
      });
    });
  });

  test('should add apiKey (header) auth to a request', () => {
    const spec = {
      securityDefinitions: {
        petKey: {
          type: 'apiKey',
          name: 'petKey',
          in: 'header',
        },
      },
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
            security: [{ petKey: [] }],
          },
        },
      },
    };

    const authorizations = {
      petKey: 'fooBar',
    };

    return Swagger({ spec, authorizations }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {
          petKey: 'fooBar',
        },
        method: 'GET',
        url: '/pet',
      });
    });
  });

  test('should add apiKey (query) auth to a request', () => {
    const spec = {
      securityDefinitions: {
        petKey: {
          type: 'apiKey',
          name: 'petKey',
          in: 'query',
        },
      },
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
            security: [{ petKey: [] }],
          },
        },
      },
    };

    const authorizations = {
      petKey: 'barFoo',
    };

    return Swagger({ spec, authorizations }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {},
        method: 'GET',
        url: '/pet?petKey=barFoo',
      });
    });
  });

  test('should add oAuth to a request', () => {
    const spec = {
      securityDefinitions: {
        ohYou: {
          type: 'oauth2',
        },
      },
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
            security: [{ ohYou: [] }],
          },
        },
      },
    };

    const authorizations = {
      ohYou: {
        token: {
          access_token: 'one two',
        },
      },
    };

    return Swagger({ spec, authorizations }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {
          authorization: 'Bearer one two',
        },
        method: 'GET',
        url: '/pet',
      });
    });
  });

  test('should use a custom oAuth token name if defined', () => {
    const spec = {
      securityDefinitions: {
        idTokenAuth: {
          type: 'oauth2',
          'x-tokenName': 'id_token',
        },
      },
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
            security: [{ idTokenAuth: [] }],
          },
        },
      },
    };

    const authorizations = {
      idTokenAuth: {
        token: {
          access_token: 'one two',
          id_token: 'three four',
        },
      },
    };

    return Swagger({ spec, authorizations }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {
          authorization: 'Bearer three four',
        },
        method: 'GET',
        url: '/pet',
      });
    });
  });

  test('should replace any occurrence of `bearer` with `Bearer`', () => {
    const spec = {
      securityDefinitions: {
        testBearer: {
          type: 'oauth2',
        },
      },
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
            security: [{ testBearer: [] }],
          },
        },
      },
    };

    const authorizations = {
      testBearer: {
        token: {
          token_type: 'BeArEr',
          access_token: 'one two',
        },
      },
    };

    return Swagger({ spec, authorizations }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {
          authorization: 'Bearer one two',
        },
        method: 'GET',
        url: '/pet',
      });
    });
  });

  test('should add global securites', () => {
    const spec = {
      securityDefinitions: {
        petKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Auth',
        },
      },
      security: [{ petKey: [] }],
      paths: {
        '/pet': {
          get: {
            operationId: 'getPets',
          },
        },
      },
    };

    const authorizations = {
      petKey: 'yup',
    };

    return Swagger({ spec, authorizations }).then((client) => {
      const http = jest.fn();
      client.execute({ http, operationId: 'getPets' });
      expect(http.mock.calls.length).toEqual(1);
      expect(http.mock.calls[0][0]).toEqual({
        credentials: 'same-origin',
        headers: {
          Auth: 'yup',
        },
        method: 'GET',
        url: '/pet',
      });
    });
  });
});
