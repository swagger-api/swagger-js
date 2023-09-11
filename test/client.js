import http from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs';

import Swagger from '../src/index.js';

describe('http', () => {
  let server;
  beforeAll(() => {
    server = http
      .createServer((req, res) => {
        const { accept } = req.headers;
        let contentType;
        const uri = url.parse(req.url).pathname;
        const filename = path.join('test', 'data', uri);

        if (filename.indexOf('.yaml') > 0) {
          contentType = 'application/yaml';
        } else {
          contentType = 'application/json';
        }

        if (typeof accept !== 'undefined') {
          if (accept === 'invalid') {
            res.writeHead(500);
            res.end();
            return;
          }

          if (accept.indexOf('application/json') >= 0) {
            contentType = accept;
            res.setHeader('Content-Type', contentType);
          }
          if (filename.indexOf('.yaml') > 0) {
            res.setHeader('Content-Type', 'application/yaml');
          }
        }

        if (req.headers['x-setcontenttype']) {
          // Allow the test to explicitly set (or unset) a content type
          if (req.headers['x-setcontenttype'] === 'none') {
            res.removeHeader('Content-Type');
          } else {
            res.setHeader('Content-Type', req.headers['x-setcontenttype']);
          }
        }

        fs.exists(filename, (exists) => {
          if (exists) {
            const fileStream = fs.createReadStream(filename);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.writeHead(200, contentType);
            fileStream.pipe(res);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.write('404 Not Found\n');
            res.end();
          }
        });
      })
      .listen(8000);
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {});

  test('should get the JSON petstore api and build it', (done) => {
    Swagger('http://localhost:8000/petstore.json').then((client) => {
      expect(client).toBeTruthy();

      // we have 3 tags
      expect(Object.keys(client.apis).length).toBe(3);

      // the pet tag exists
      expect(client.apis.pet).toBeTruthy();

      // the get pet operation
      expect(client.apis.pet.getPetById).toBeTruthy();

      done();
    });
  });

  test('should get the YAML petstore api and build it', (done) => {
    Swagger('http://localhost:8000/petstore.json').then((client) => {
      expect(client).toBeTruthy();

      // we have 3 tags
      expect(Object.keys(client.apis).length).toBe(3);

      // the pet tag exists
      expect(client.apis.pet).toBeTruthy();

      // the get pet operation
      expect(client.apis.pet.getPetById).toBeTruthy();

      done();
    });
  });

  test('should get the JSON petstore api and build it when response lacks a `Content-Type`', (done) => {
    Swagger('http://localhost:8000/petstore.json', {
      requestInterceptor: (req) => {
        req.headers['X-SetContentType'] = 'none';
        return req;
      },
    })
      .then((client) => {
        expect(client).toBeTruthy();

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(3);

        // the pet tag exists
        expect(client.apis.pet).toBeTruthy();

        // the get pet operation
        expect(client.apis.pet.getPetById).toBeTruthy();

        done();
      })
      .catch((err) => done(err));
  });

  test('should get the YAML petstore api and build it when response lacks a `Content-Type`', (done) => {
    Swagger('http://localhost:8000/petstore.yaml', {
      requestInterceptor: (req) => {
        req.headers['X-SetContentType'] = 'none';
        return req;
      },
    })
      .then((client) => {
        expect(client).toBeTruthy();

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(3);

        // the pet tag exists
        expect(client.apis.pet).toBeTruthy();

        // the get pet operation
        expect(client.apis.pet.getPetById).toBeTruthy();

        done();
      })
      .catch((err) => done(err));
  });

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1005
   */
  test.skip('should get a pet from the petstore', (done) => {
    Swagger('http://localhost:8000/petstore.json').then((client) => {
      client.apis.pet
        .getPetById({ petId: -1 })
        .then(() => {
          done('shoulda thrown an error!');
        })
        .catch((error) => {
          done(error);
        });
    });
  });

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1277
   */
  test('should return a helpful error when the connection is refused', () =>
    Swagger('http://localhost:1/untouchable.yaml')
      .then(() => {
        throw new Error('Expected an error.');
      })
      .catch((error) => {
        expect(error.message).toMatch('fetch failed');
        expect(error.name).toEqual('TypeError');
      }));

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1002
   */
  test.skip('should return an error when a spec doesnt exist', (done) => {
    Swagger('http://localhost:8000/absent.yaml')
      .then(() => {
        done('expected an error');
      })
      .catch((error) => {
        done(error);
      });
  });

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1004
   */
  test.skip('fail with invalid verbs', (done) => {
    Swagger('http://localhost:8000/invalid-operation.yaml').then((client) => {
      expect(client.apis.default).toBeTruthy();
      expect(typeof client.apis.default['not-a-valid-verb']).toBe('undefined');
      done();
    });
  });

  /**
   * Loads a spec where the `host` and `schema` are not defined
   * See https://github.com/swagger-api/swagger-js/issues/1000
   */
  test('use the host from whence the spec was fetched', (done) => {
    Swagger('http://localhost:8000/pathless.yaml')
      .then((client) => {
        client.apis.default.tryMe().catch((err) => {
          expect(err.status).toBe(404);
          done();
        });
      })
      .catch((err) => {
        done(err);
      });
  });

  test('use the host from whence the spec was fetched when constructing swagger2 URLs from a basePath', async () => {
    const client = await Swagger('http://localhost:8000/relative-host.swagger.yaml');
    try {
      const res = await client.apis.default.myOp();
      expect(res.status).toBe(404);
    } catch (e) {
      expect(e).toMatchObject({
        status: 404,
        response: {
          url: 'http://localhost:8000/v1/endpoint',
        },
      });
    }
  });

  test('use the host from whence the spec was fetched when constructing OAS3 URLs from relative servers entries', async () => {
    const client = await Swagger('http://localhost:8000/relative-server.openapi.yaml');
    try {
      const res = await client.apis.default.myOp();
      expect(res.status).toBe(404);
    } catch (e) {
      expect(e).toMatchObject({
        status: 404,
        response: {
          url: 'http://localhost:8000/v1/endpoint',
        },
      });
    }
  });

  test('should err gracefully when requesting https from an http server', () =>
    Swagger({
      url: 'http://localhost:8000/petstore.json',
      requestInterceptor: (req) => {
        const u = url.parse(req.url);
        u.protocol = 'https';
        req.url = u.format();
        return req;
      },
    }).catch((err) => {
      expect(err.message).toMatch('fetch failed');
    }));

  test('should use requestInterceptor for resolving nested $refs', () => {
    const requestInterceptor = jest.fn();
    return Swagger({
      url: 'http://localhost:8000/nested/one.yaml',
      requestInterceptor,
    }).then((client) => {
      expect(requestInterceptor.mock.calls.length).toEqual(3);
      expect(requestInterceptor.mock.calls[0][0].url).toEqual(
        'http://localhost:8000/nested/one.yaml'
      );
      expect(requestInterceptor.mock.calls[1][0].url).toEqual(
        'http://localhost:8000/nested/two.yaml'
      );
      expect(requestInterceptor.mock.calls[2][0].url).toEqual(
        'http://localhost:8000/nested/three.yaml'
      );

      expect(client.spec).toEqual({
        data: {
          value: 'one!',
          nested: {
            $$ref: 'http://localhost:8000/nested/two.yaml',
            data: {
              value: 'two!',
              nested: {
                $$ref: 'http://localhost:8000/nested/three.yaml',
                value: 'three!',
              },
            },
          },
        },
      });
    });
  });

  test('should omit undefined JSON query parameter', (done) => {
    Swagger('http://localhost:8000/sample-query-parameter-json.yaml')
      .then((client) => {
        expect(client).toBeTruthy();
        expect(Object.keys(client.apis).length).toBe(1);
        expect(client.apis.default).toBeTruthy();
        expect(client.apis.default.test).toBeTruthy();

        return client.apis.default.test({}).catch((err) => {
          expect(err.status).toBe(404);
          done();
        });
      })
      .catch((err) => done(err));
  });
});
