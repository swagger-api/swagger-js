import { baseUrl } from '../../src/execute/index.js';

// Supported shape...  { spec, operationId, parameters, securities, fetch }
// One can use operationId or pathItem + method

describe('baseUrl', () => {
  test('should calculate a valid baseUrl given host, basePath, context, schemes', () => {
    const res = baseUrl({
      spec: {
        schemes: ['https'],
        host: 'foo.com:8080',
        basePath: '/bar',
      },
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('https://foo.com:8080/bar');
  });

  test('should calculate a valid baseUrl given host, basePath, context', () => {
    const res = baseUrl({
      spec: {
        host: 'foo.com:8080',
        basePath: '/bar',
      },
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('http://foo.com:8080/bar');
  });

  test('should trim the trailing slash when basePath is "/"', () => {
    const res = baseUrl({
      spec: {
        host: 'foo.com:8080',
        basePath: '/',
      },
    });

    expect(res).toEqual('http://foo.com:8080');
  });

  test('should infer the host and port based on the contextUrl', () => {
    const res = baseUrl({
      spec: {
        basePath: '/bar',
      },
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('http://example.com:9090/bar');
  });

  test('should infer the entire url based on the contextUrl', () => {
    const res = baseUrl({
      spec: {},
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('http://example.com:9090');
  });

  test('should infer the host based on the contextUrl', () => {
    const res = baseUrl({
      spec: {
        schemes: ['https'],
        basePath: '/bar',
      },
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('https://example.com:9090/bar');
  });

  test('should default to an empty basePath', () => {
    const res = baseUrl({
      spec: {
        schemes: ['https'],
        host: 'foo.com:8080',
      },
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('https://foo.com:8080');
  });

  test('should default to the correct scheme based on the spec', () => {
    const res = baseUrl({
      spec: {
        schemes: ['https'],
      },
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('https://example.com:9090');
  });

  test('should default to HTTP scheme based on the contextUrl', () => {
    const res = baseUrl({
      spec: {
        host: 'foo.com:8080',
      },
      contextUrl: 'http://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('http://foo.com:8080');
  });

  test('should default to HTTPS scheme based on the contextUrl', () => {
    const res = baseUrl({
      spec: {
        host: 'foo.com:8080',
      },
      contextUrl: 'https://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('https://foo.com:8080');
  });

  test('should default to HTTPS scheme and host based on the contextUrl', () => {
    const res = baseUrl({
      spec: {
        title: 'a spec',
      },
      contextUrl: 'https://example.com:9090/hello/swagger.json',
    });

    expect(res).toEqual('https://example.com:9090');
  });

  test('should include a basePath when no contextUrl is available', () => {
    const res = baseUrl({
      spec: {
        title: 'a spec',
        basePath: '/mybase',
      },
    });

    expect(res).toEqual('/mybase');
  });
});
