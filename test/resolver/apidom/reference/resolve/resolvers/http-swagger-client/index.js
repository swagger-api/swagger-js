import path from 'node:path';
import http from 'node:http';
import { Buffer } from 'node:buffer';
import fetchMock from 'fetch-mock';
import { File, ResolverError } from '@swagger-api/apidom-reference/configuration/empty';

import Http from '../../../../../../../src/http/index.js';
import HttpResolverSwaggerClient from '../../../../../../../src/resolver/apidom/reference/resolve/resolvers/http-swagger-client/index.js';

describe('HttpResolverSwaggerClient', () => {
  let resolver;

  beforeEach(() => {
    resolver = HttpResolverSwaggerClient();
  });

  describe('canRead', () => {
    describe('given valid http URL', () => {
      test('should consider it a HTTP URL', () => {
        expect(resolver.canRead(File({ uri: 'http://swagger.io/file.txt' }))).toBe(true);
      });
    });

    describe('given valid https URL', () => {
      test('should consider it a https URL', () => {
        expect(resolver.canRead(File({ uri: 'https://swagger.io/file.txt' }))).toBe(true);
      });
    });

    describe('given URIs with no protocol', () => {
      test('should not consider it a http/https URL', () => {
        expect(resolver.canRead(File({ uri: '/home/user/file.txt' }))).toBe(false);
        expect(resolver.canRead(File({ uri: 'C:\\home\\user\\file.txt' }))).toBe(false);
      });
    });

    describe('given URLs with other known protocols', () => {
      test('should not consider it a http/https URL', () => {
        expect(resolver.canRead(File({ uri: 'ftp://swagger.io/' }))).toBe(false);
      });
    });
  });

  describe('read', () => {
    describe('given HTTP URL', () => {
      test('should fetch the URL', async () => {
        const url = 'https://httpbin.org/anything';
        const response = new Response(Buffer.from('data'));
        fetchMock.get(url, response, { repeat: 1 });
        const content = await resolver.read(File({ uri: url }));

        expect(content).toBeInstanceOf(ArrayBuffer);
        expect(Buffer.from(content).toString()).toStrictEqual('data');

        fetchMock.restore();
      });

      test('should throw on unexpected status codes', async () => {
        const url = 'https://httpbin.org/anything';
        const response = new Response(Buffer.from('data'), {
          status: 400,
        });
        const readThunk = async () => {
          fetchMock.get(url, response, { repeat: 1 });
          try {
            return await resolver.read(File({ uri: url }));
          } finally {
            fetchMock.restore();
          }
        };

        await expect(readThunk()).rejects.toThrow(ResolverError);
        await expect(readThunk()).rejects.toHaveProperty(
          'message',
          'Error downloading "https://httpbin.org/anything"'
        );
      });

      test('should throw on timeout', async () => {
        resolver = HttpResolverSwaggerClient({ timeout: 1 });
        const url = 'http://localhost:8123/local-file.txt';
        const cwd = path.join(__dirname, '__fixtures__');
        const readThunk = async () => {
          const server = globalThis.createHTTPServer({ port: 8123, cwd });
          try {
            return await resolver.read(File({ uri: url }));
          } finally {
            await server.terminate();
          }
        };

        await expect(readThunk()).rejects.toThrow(ResolverError);
        await expect(readThunk()).rejects.toHaveProperty(
          'message',
          'Error downloading "http://localhost:8123/local-file.txt"'
        );
        await expect(readThunk).rejects.toHaveProperty(
          'cause.message',
          'The user aborted a request.'
        );
      });

      describe('given withCredentials option', () => {
        test('should allow cross-site Access-Control requests', async () => {
          resolver = HttpResolverSwaggerClient({
            withCredentials: true,
          });
          const url = 'https://httpbin.org/anything';
          const response = new Response(Buffer.from('data'));
          const readThunk = async () => {
            fetchMock.get(url, response, { repeat: 1 });
            try {
              await resolver.read(File({ uri: url }));
              const [, requestInit] = fetchMock.lastCall(url);
              return requestInit;
            } finally {
              fetchMock.restore();
            }
          };

          await expect(readThunk()).resolves.toHaveProperty('credentials', 'include');
        });
      });

      describe('given global withCredentials override', () => {
        test('should allow cross-site Access-Control requests', async () => {
          const url = 'https://httpbin.org/anything';
          const response = new Response(Buffer.from('data'));
          const { withCredentials: originalWithCredentials } = Http;
          const readThunk = async () => {
            fetchMock.get(url, response, { repeat: 1 });
            Http.withCredentials = true;

            try {
              await resolver.read(File({ uri: url }));
              const [, requestInit] = fetchMock.lastCall(url);
              return requestInit;
            } finally {
              fetchMock.restore();
              Http.withCredentials = originalWithCredentials;
            }
          };

          await expect(readThunk()).resolves.toHaveProperty('credentials', 'include');
        });
      });

      describe('given redirects options', () => {
        test.only('should throw on exceeding redirects', (done) => {
          resolver = HttpResolverSwaggerClient({
            redirects: 0,
          });
          const url = 'http://localhost:4444/';
          const server = http.createServer((req, res) => {
            res.setHeader('Location', '/foo');
            res.statusCode = 302;
            res.end();
          });

          expect.assertions(2);
          server.listen(4444, () => {
            resolver
              .read(File({ uri: url }))
              .catch((error) => {
                expect(error).toBeInstanceOf(ResolverError);
                expect(error.cause).toHaveProperty('message', 'fetch failed');
              })
              .catch((error) => error)
              .then((error) => {
                server.close();
                done(error);
              });
          });
        });
      });
    });
  });
});
