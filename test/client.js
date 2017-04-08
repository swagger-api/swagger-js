import expect from 'expect'
import http from 'http'
import url from 'url'
import path from 'path'
import fs from 'fs'

import Swagger from '../src/index'

describe('http', () => {
  var server
  before(function() {
    server = http.createServer(function (req, res) {
      var accept = req.headers.accept
      var contentType
      var uri = url.parse(req.url).pathname;
      var filename = path.join('test', 'data', uri);

      if(filename.indexOf('.yaml') > 0) {
        contentType = 'application/yaml'
      }
      else {
        contentType = 'application/json'
      }

      if (typeof accept !== 'undefined') {
        if (accept === 'invalid') {
          res.writeHead(500)
          res.end()
          return
        }

        if (accept.indexOf('application/json') >= 0) {
          contentType = accept;
          res.setHeader('Content-Type', contentType);
        }
        if (filename.indexOf('.yaml') > 0) {
          res.setHeader('Content-Type', 'application/yaml');
        }
      }

      fs.exists(filename, function (exists) {
        if(exists) {
          let fileStream = fs.createReadStream(filename);
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.writeHead(200, contentType)
          fileStream.pipe(res);
        }
        else {
          res.writeHead(404, {'Content-Type': 'text/plain'});
          res.write('404 Not Found\n');
          res.end();
        }
      })
    }).listen(8000)
  })

  after(function() {
    server.close()
  })

  afterEach(function () {
  })

  it.skip('should get the petstore api and build it', done => {
    Swagger('http://localhost:8000/petstore.json')
      .then(client => {
        expect(client).toExist()

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(3)

        // the pet tag exists
        expect(client.apis['pet']).toExist()

        // the get pet operation
        expect(client.apis['pet'].getPetById).toExist()

        done()
    })
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1005
   */
  it.skip('should get a pet from the petstore', done => {
    Swagger('http://localhost:8000/petstore.json')
      .then(client => {
        client.apis['pet'].getPetById({petId: -1})
          .then(data => {
            done('shoulda thrown an error!')
          })
          .catch(err => {
            done()
          })
      })
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1002
   */
  it.skip('should return an error when a spec doesnt exist', done => {
    Swagger('http://localhost:8000/absent.yaml')
      .then(client => {
        done('expected an error')
      })
      .catch(error => {
        done()
      })
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1004
   */
  it.skip('fail with invalid verbs', done => {
    Swagger('http://localhost:8000/invalid-operation.yaml')
      .then(client => {
        expect(client.apis['default']).toExist()
        expect(client.apis['default']['not-a-valid-verb']).toBeAn('undefined')
        done()
      })
  })

  /**
   * Loads a spec where the `host` and `schema` are not defined
   * See https://github.com/swagger-api/swagger-js/issues/1000
   */
  it('use the host from whence the spec was fetched', done => {
    Swagger('http://localhost:8000/pathless.yaml')
      .then(client => {
        client.apis['default'].tryMe().then(data => {
          expect(data.status).toBe(404)
          done()
        })
      })
      .catch(err => {
        done(err)
      })
  })
})