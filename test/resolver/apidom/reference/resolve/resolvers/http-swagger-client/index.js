import path from 'node:path';
import http from 'node:http';
import { Buffer } from 'node:buffer';
import {
  File as ApiDOMFile,
  ResolverError,
} from '@swagger-api/apidom-reference/configuration/empty';
import * as undici from 'undici';

import Http from '../../../../../../../src/http/index.js';
import HttpResolverSwaggerClient from '../../../../../../../src/resolver/apidom/reference/resolve/resolvers/http-swagger-client/index.js';

describe('HttpResolverSwaggerClient', () => {
  let resolver;
  let mockAgent;
  let originalGlobalDispatcher;

  beforeEach(() => {
    resolver = HttpResolverSwaggerClient();
    mockAgent = new undici.MockAgent();
    originalGlobalDispatcher = undici.getGlobalDispatcher();
    undici.setGlobalDispatcher(mockAgent);
  });

  afterEach(() => {
    undici.setGlobalDispatcher(originalGlobalDispatcher);
    mockAgent = null;
    originalGlobalDispatcher = null;
  });

  describe('canRead', () => {
    describe('given valid http URL', () => {
      test('should consider it a HTTP URL', () => {
        expect(resolver.canRead(ApiDOMFile({ uri: 'http://swagger.io/file.txt' }))).toBe(true);
      });
    });

    describe('given valid https URL', () => {
      test('should consider it a https URL', () => {
        expect(resolver.canRead(ApiDOMFile({ uri: 'https://swagger.io/file.txt' }))).toBe(true);
      });
    });

    describe('given URIs with no protocol', () => {
      test('should not consider it a http/https URL', () => {
        expect(resolver.canRead(ApiDOMFile({ uri: '/home/user/file.txt' }))).toBe(false);
        expect(resolver.canRead(ApiDOMFile({ uri: 'C:\\home\\user\\file.txt' }))).toBe(false);
      });
    });

    describe('given URLs with other known protocols', () => {
      test('should not consider it a http/https URL', () => {
        expect(resolver.canRead(ApiDOMFile({ uri: 'ftp://swagger.io/' }))).toBe(false);
      });
    });
  });

  describe('read', () => {
    describe('given HTTP URL', () => {
      test('should fetch the URL', async () => {
        const url = 'https://httpbin.org/anything';
        const mockPool = mockAgent.get('https://httpbin.org');
        mockPool.intercept({ path: '/anything' }).reply(200, Buffer.from('data'));
        const content = await resolver.read(ApiDOMFile({ uri: url }));

        expect(content).toBeInstanceOf(ArrayBuffer);
        expect(Buffer.from(content).toString()).toStrictEqual('data');
      });

      test('should throw on unexpected status codes', async () => {
        const url = 'https://httpbin.org/anything';
        const mockPool = mockAgent.get('https://httpbin.org');
        mockPool
          .intercept({ path: '/anything' })
          .replyWithError(new Error(`Error downloading "${url}"`))
          .times(2);

        const readThunk = async () => resolver.read(ApiDOMFile({ uri: url }));

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
        const httpServer = globalThis.createHTTPServer({ port: 8123, cwd });
        const readThunk = async () => resolver.read(ApiDOMFile({ uri: url }));

        await expect(readThunk()).rejects.toThrow(ResolverError);
        await expect(readThunk()).rejects.toHaveProperty(
          'message',
          'Error downloading "http://localhost:8123/local-file.txt"'
        );
        await expect(readThunk).rejects.toHaveProperty(
          'cause.message',
          expect.stringMatching(/operation was aborted/)
        );
        await httpServer.terminate();
      });

      describe('given withCredentials option', () => {
        let originalFetch;

        beforeEach(() => {
          originalFetch = globalThis.fetch;
          globalThis.fetch = jest.fn(() => new Response('data'));
        });

        afterEach(() => {
          globalThis.fetch = originalFetch;
        });

        test('should allow cross-site Access-Control requests', async () => {
          resolver = HttpResolverSwaggerClient({
            withCredentials: true,
          });
          const url = 'https://httpbin.org/anything';
          const readThunk = async () => {
            await resolver.read(ApiDOMFile({ uri: url }));
            return globalThis.fetch.mock.calls[0][1];
          };

          await expect(readThunk()).resolves.toHaveProperty('credentials', 'include');
        });
      });

      describe('given global withCredentials override', () => {
        let originalFetch;

        beforeEach(() => {
          originalFetch = globalThis.fetch;
          globalThis.fetch = jest.fn(() => new Response('data'));
        });

        afterEach(() => {
          globalThis.fetch = originalFetch;
        });

        test('should allow cross-site Access-Control requests', async () => {
          const url = 'https://httpbin.org/anything';

          const { withCredentials: originalWithCredentials } = Http;
          const readThunk = async () => {
            Http.withCredentials = true;

            try {
              await resolver.read(ApiDOMFile({ uri: url }));
              return globalThis.fetch.mock.calls[0][1];
            } finally {
              Http.withCredentials = originalWithCredentials;
            }
          };

          await expect(readThunk()).resolves.toHaveProperty('credentials', 'include');
        });
      });

      describe('given redirects options', () => {
        test('should throw on exceeding redirects', (done) => {
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
          server.keepAliveTimeout = 50;
          server.listen(4444, async () => {
            try {
              await resolver.read(ApiDOMFile({ uri: url }));
            } catch (error) {
              expect(error).toBeInstanceOf(ResolverError);
              expect(error.cause).toHaveProperty('message', 'fetch failed');
            } finally {
              server.close(() => {
                done();
              });
            }
          });
        });
      });
    });
  });
});
