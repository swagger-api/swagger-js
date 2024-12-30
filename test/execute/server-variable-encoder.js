import { execute, buildRequest } from '../../src/execute/index.js';

describe('execute/serverVariableEncoder', () => {
  test('should encode when encoder provided', () => {
    const spec = {
      openapi: '3.0.4',
      servers: [
        {
          url: '{server}/v1',
          variables: {
            server: {
              default: 'https://swagger.io',
            },
          },
        },
      ],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [{ name: 'petId', in: 'query' }],
          },
        },
      },
    };

    const spy = jest.fn().mockImplementation(() => Promise.resolve());

    execute({
      fetch: spy,
      spec,
      operationId: 'getMe',
      serverVariableEncoder: encodeURIComponent,
    });

    expect(spy.mock.calls.length).toEqual(1);
    expect(spy.mock.calls[0][0]).toEqual({
      method: 'GET',
      url: 'https%3A%2F%2Fswagger.io/v1/one',
      credentials: 'same-origin',
      headers: {},
    });
  });

  test('should not encode when encoder not provided', () => {
    const spec = {
      openapi: '3.0.4',
      servers: [
        {
          url: '{server}/v1',
          variables: {
            server: {
              default: 'https://swagger.io',
            },
          },
        },
      ],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [{ name: 'petId', in: 'query' }],
          },
        },
      },
    };

    const spy = jest.fn().mockImplementation(() => Promise.resolve());

    execute({
      fetch: spy,
      spec,
      operationId: 'getMe',
    });

    expect(spy.mock.calls.length).toEqual(1);
    expect(spy.mock.calls[0][0]).toEqual({
      method: 'GET',
      url: 'https://swagger.io/v1/one',
      credentials: 'same-origin',
      headers: {},
    });
  });
});

describe('buildRequest/serverVariableEncoder', () => {
  test('should encode when encoder provided', () => {
    const spec = {
      openapi: '3.0.4',
      servers: [
        {
          url: '{server}/v1',
          variables: {
            server: {
              default: 'https://swagger.io',
            },
          },
        },
      ],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [{ name: 'petId', in: 'query' }],
          },
        },
      },
    };

    const req = buildRequest({
      spec,
      operationId: 'getMe',
      parameters: { petId: 123 },
      serverVariableEncoder: encodeURIComponent,
    });

    expect(req).toEqual({
      url: 'https%3A%2F%2Fswagger.io/v1/one?petId=123',
      method: 'GET',
      credentials: 'same-origin',
      headers: {},
    });
  });

  test('should not encode when encoder not provided', () => {
    const spec = {
      openapi: '3.0.4',
      servers: [
        {
          url: '{server}/v1',
          variables: {
            server: {
              default: 'https://swagger.io',
            },
          },
        },
      ],
      paths: {
        '/one': {
          get: {
            operationId: 'getMe',
            parameters: [{ name: 'petId', in: 'query' }],
          },
        },
      },
    };

    const req = buildRequest({ spec, operationId: 'getMe', parameters: { petId: 123 } });

    expect(req).toEqual({
      url: 'https://swagger.io/v1/one?petId=123',
      method: 'GET',
      credentials: 'same-origin',
      headers: {},
    });
  });
});
