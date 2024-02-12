import http from 'node:http';

import SwaggerClient from '../../src/index.js';

const createOAS31Server = () => {
  const getUserList = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end('[{"id":"value"}]');
  };

  const requestListener = (req, res) => {
    if (req.url.startsWith('/users')) {
      getUserList(req, res);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.writeHead(404);
      res.end('Not found');
    }
  };

  const server = http.createServer(requestListener);
  server.keepAliveTimeout = 50;
  server.listen(8080);

  server.terminate = () =>
    new Promise((resolve) => {
      server.close(() => resolve(server));
    });

  return server;
};

describe('given OpenAPI 3.1.0 definition', () => {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Testing API',
      version: '1.0.0',
    },
    components: {
      schemas: {
        user: {
          properties: {
            id: {
              type: 'integer',
            },
          },
        },
      },
      securitySchemes: {
        BasicAuth: {
          type: 'http',
          scheme: 'basic',
        },
        ApiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-KEY',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
        oAuth2: {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'https://api.example.com/oauth2/authorize',
              scopes: {
                read: 'authorize to read',
              },
            },
          },
        },
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
      },
    ],
    paths: {
      '/users': {
        get: {
          operationId: 'getUserList',
          description: 'Get list of users',
          security: [
            {
              BasicAuth: [],
              BearerAuth: [],
              ApiKey: [],
              oAuth2: [],
            },
          ],
          parameters: [
            {
              name: 'q',
              in: 'query',
              description: 'search query parameter',
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              style: 'pipeDelimited',
              explode: false,
            },
          ],
          responses: {
            200: {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/user',
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  let server;

  beforeAll(() => {
    server = createOAS31Server();
  });

  afterAll(async () => {
    await server.terminate();
  });

  test('should execute OAS operation using operationId', async () => {
    const response = await SwaggerClient.execute({
      spec,
      operationId: 'getUserList',
      parameters: { q: 'search string' },
      securities: { authorized: { BearerAuth: '3492342948239482398' } },
    });

    expect(response.body).toEqual([{ id: 'value' }]);
  });

  test('should execute OAS operation using unique pathName + method combination', async () => {
    const response = await SwaggerClient.execute({
      spec,
      pathName: '/users',
      method: 'get',
      parameters: { q: 'search string' },
      securities: { authorized: { BearerAuth: '3492342948239482398' } },
    });

    expect(response.body).toEqual([{ id: 'value' }]);
  });

  test('should execute OAS operation in alternate API', async () => {
    const client = await SwaggerClient({
      spec,
      authorization: { BearerAuth: '3492342948239482398' },
    });
    const response = await client.execute({
      operationId: 'getUserList',
      parameters: { q: 'search string' },
    });

    expect(response.body).toEqual([{ id: 'value' }]);
  });

  test('should build a request', () => {
    const request = SwaggerClient.buildRequest({
      spec,
      operationId: 'getUserList',
      parameters: { q: 'search string' },
      securities: { authorized: { BearerAuth: '3492342948239482398' } },
      responseContentType: 'application/json',
    });

    expect(request).toEqual({
      url: 'http://localhost:8080/users?q=search%20string',
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer 3492342948239482398',
      },
      method: 'GET',
    });
  });
});

describe('given OpenAPI 3.1.0 definition with multi-value parameters', () => {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Testing API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:8080',
      },
    ],
    paths: {
      '/findWithQuery': {
        get: {
          operationId: 'findWithQuery',
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['admin', 'customer'],
                },
              },
            },
          ],
        },
      },
      '/findWithHeader': {
        get: {
          operationId: 'findWithHeader',
          parameters: [
            {
              name: 'status',
              in: 'header',
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['admin', 'customer'],
                },
              },
            },
          ],
        },
      },
      '/findWithCookie': {
        get: {
          operationId: 'findWithCookie',
          parameters: [
            {
              name: 'status',
              in: 'cookie',
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['admin', 'customer'],
                },
              },
            },
          ],
        },
      },
    },
  };

  test('should build a request without parameters in query', () => {
    const request = SwaggerClient.buildRequest({
      spec,
      operationId: 'findWithQuery',
      parameters: { status: [] },
    });

    expect(request).toEqual({
      url: 'http://localhost:8080/findWithQuery',
      credentials: 'same-origin',
      headers: {},
      method: 'GET',
    });
  });

  test('should build a request with an empty string parameter in query', () => {
    const request = SwaggerClient.buildRequest({
      spec,
      operationId: 'findWithQuery',
      parameters: { status: [''] },
    });

    expect(request).toEqual({
      url: 'http://localhost:8080/findWithQuery?status=',
      credentials: 'same-origin',
      headers: {},
      method: 'GET',
    });
  });

  test('should build a request without parameters in header', () => {
    const request = SwaggerClient.buildRequest({
      spec,
      operationId: 'findWithHeader',
      parameters: { status: [] },
    });

    expect(request).toEqual({
      url: 'http://localhost:8080/findWithHeader',
      credentials: 'same-origin',
      headers: {},
      method: 'GET',
    });
  });

  test('should build a request with an empty string parameter in header', () => {
    const request = SwaggerClient.buildRequest({
      spec,
      operationId: 'findWithHeader',
      parameters: { status: [''] },
    });

    expect(request).toEqual({
      url: 'http://localhost:8080/findWithHeader',
      credentials: 'same-origin',
      headers: {
        status: '',
      },
      method: 'GET',
    });
  });

  test('should build a request without parameters in cookie', () => {
    const request = SwaggerClient.buildRequest({
      spec,
      operationId: 'findWithCookie',
      parameters: { status: [] },
    });

    expect(request).toEqual({
      url: 'http://localhost:8080/findWithCookie',
      credentials: 'same-origin',
      headers: {},
      method: 'GET',
    });
  });

  test('should build a request with an empty string parameter in cookie', () => {
    const request = SwaggerClient.buildRequest({
      spec,
      operationId: 'findWithCookie',
      parameters: { status: [''] },
    });

    expect(request).toEqual({
      url: 'http://localhost:8080/findWithCookie',
      credentials: 'same-origin',
      headers: {
        Cookie: 'status=',
      },
      method: 'GET',
    });
  });
});
