import http from 'node:http';

import SwaggerClient from '../../src/index.js';

const createOAS32Server = () => {
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
  server.listen(8081);

  server.terminate = () =>
    new Promise((resolve) => {
      server.close(() => resolve(server));
    });

  return server;
};

describe('given OpenAPI 3.2.0 definition', () => {
  const spec = {
    openapi: '3.2.0',
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
        url: 'http://localhost:8081',
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
    server = createOAS32Server();
  });

  afterAll(async () => {
    await server.terminate();
  });

  test('should execute OAS 3.2 operation using operationId', async () => {
    const response = await SwaggerClient.execute({
      spec,
      operationId: 'getUserList',
      parameters: { q: ['search string'] },
      securities: { authorized: { BearerAuth: '3492342948239482398' } },
    });

    expect(response.body).toEqual([{ id: 'value' }]);
  });

  test('should execute OAS 3.2 operation using unique pathName + method combination', async () => {
    const response = await SwaggerClient.execute({
      spec,
      pathName: '/users',
      method: 'get',
      parameters: { q: ['search string'] },
      securities: { authorized: { BearerAuth: '3492342948239482398' } },
    });

    expect(response.body).toEqual([{ id: 'value' }]);
  });

  test('should build request for OAS 3.2 operation', async () => {
    const request = await SwaggerClient.buildRequest({
      spec,
      operationId: 'getUserList',
      parameters: { q: ['search string'] },
    });

    expect(request.url).toBe('http://localhost:8081/users?q=search%20string');
    expect(request.method).toBe('GET');
  });

  test('should work with client instance', async () => {
    const client = await SwaggerClient({ spec });

    expect(client.apis.default.getUserList).toBeDefined();
    expect(typeof client.apis.default.getUserList).toBe('function');
  });

  test('should handle query parameters correctly', async () => {
    const request = await SwaggerClient.buildRequest({
      spec,
      operationId: 'getUserList',
      parameters: { q: ['value1', 'value2'] },
    });

    expect(request.url).toContain('q=value1|value2');
  });

  test('should handle security schemes', async () => {
    const request = await SwaggerClient.buildRequest({
      spec,
      operationId: 'getUserList',
      securities: {
        authorized: {
          BearerAuth: 'my-token',
        },
      },
    });

    expect(request.headers.Authorization).toBe('Bearer my-token');
  });
});
