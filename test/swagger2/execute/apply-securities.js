import { applySecurities } from '../../../src/execute/swagger2/build-request.js';

describe('swagger2 - execute - applySecurities', () => {
  test('should NOT add any securities, if the operation does not require it', () => {
    const spec = {
      host: 'swagger.io',
      basePath: '/v1',
      security: [{ apiKey: [] }],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
          },
        },
      },
      securityDefinitions: {
        apiKey: {
          in: 'header',
          name: 'api_key',
          type: 'apiKey',
        },
      },
    };

    const securities = {};
    const request = {
      url: 'http://swagger.io/v1/one',
      method: 'GET',
    };

    const applySecurity = applySecurities({
      request,
      securities,
      operation: spec.paths['/one'].get,
      spec,
    });

    expect(applySecurity).toEqual({
      url: 'http://swagger.io/v1/one',
      method: 'GET',
    });
  });

  test('should add a basic auth if operation requires it and has header passed', () => {
    const spec = {
      host: 'swagger.io',
      basePath: '/v1',
      security: [{ authMe: [] }],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            security: [{ authMe: [] }],
          },
        },
      },
      securityDefinitions: {
        authMe: {
          type: 'basic',
        },
      },
    };

    const request = {
      url: 'http://swagger.io/v1/one',
      method: 'GET',
      query: {},
    };
    const securities = {
      authorized: {
        authMe: {
          header: 'Basic Zm9vOmJhcg==',
        },
      },
    };

    const applySecurity = applySecurities({
      request,
      securities,
      operation: spec.paths['/one'].get,
      spec,
    });

    expect(applySecurity.headers).toEqual({
      authorization: 'Basic Zm9vOmJhcg==',
    });
  });

  test('should add a basic auth if operation requires it', () => {
    const spec = {
      host: 'swagger.io',
      basePath: '/v1',
      security: [{ authMe: [] }],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            security: [{ authMe: [] }],
          },
        },
      },
      securityDefinitions: {
        authMe: {
          type: 'basic',
        },
      },
    };

    const request = {
      url: 'http://swagger.io/v1/one',
      method: 'GET',
      query: {},
    };
    const securities = {
      authorized: {
        authMe: {
          username: 'foo',
          password: 'bar',
        },
      },
    };

    const applySecurity = applySecurities({
      request,
      securities,
      operation: spec.paths['/one'].get,
      spec,
    });

    expect(applySecurity.headers).toEqual({
      authorization: 'Basic Zm9vOmJhcg==',
    });
  });

  test('should allow empty password without casting undefined to string', () => {
    const spec = {
      host: 'swagger.io',
      basePath: '/v1',
      security: [{ authMe: [] }],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            security: [{ authMe: [] }],
          },
        },
      },
      securityDefinitions: {
        authMe: {
          type: 'basic',
        },
      },
    };

    const request = {
      url: 'http://swagger.io/v1/one',
      method: 'GET',
      query: {},
    };
    const securities = {
      authorized: {
        authMe: {
          username: 'foo',
          password: undefined,
        },
      },
    };

    const applySecurity = applySecurities({
      request,
      securities,
      operation: spec.paths['/one'].get,
      spec,
    });

    expect(applySecurity.headers).toEqual({
      authorization: 'Basic Zm9vOg==',
    });
  });

  test('should be able to apply multiple auths', () => {
    const spec = {
      host: 'swagger.io',
      basePath: '/v1',
      security: [{ authMe: [] }, { apiKey: [] }],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            security: [{ authMe: [] }, { apiKey: [] }],
          },
        },
      },
      securityDefinitions: {
        authMe: {
          type: 'basic',
        },
        apiKey: {
          in: 'header',
          name: 'api_key',
          type: 'apiKey',
        },
      },
    };

    const request = {
      url: 'http://swagger.io/v1/one',
      method: 'GET',
      query: {},
    };
    const securities = {
      authorized: {
        authMe: {
          username: 'foo',
          password: 'bar',
        },
        apiKey: 'hello',
      },
    };

    const applySecurity = applySecurities({
      request,
      securities,
      operation: spec.paths['/one'].get,
      spec,
    });

    expect(applySecurity.headers).toEqual({
      authorization: 'Basic Zm9vOmJhcg==',
      api_key: 'hello',
    });
  });
});
