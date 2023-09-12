import http from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs';

import Swagger from '../../src/index.js';

describe('http - OpenAPI Specification 3.0', () => {
  let server;
  beforeAll(() => {
    server = http
      .createServer((req, res) => {
        const { accept } = req.headers;
        let contentType;
        const uri = url.parse(req.url).pathname;
        const filename = path.join('test', 'oas3', 'data', uri);

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
    server.keepAliveTimeout = 50;
  });

  afterAll(() => {
    server.close();
  });

  afterEach(() => {});

  test('should get the petstore api and build it', (done) => {
    Swagger('http://localhost:8000/petstore-oas3.yaml')
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
      .catch((e) => done(e));
  });
});
