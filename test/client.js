import expect from 'expect'
import http from 'http'
import url from 'url'
import path from 'path'
import fs from 'fs'

import Swagger from '../src/index'

describe('http', () => {
  let server
  before(function () {
    server = http.createServer(function (req, res) {
      const accept = req.headers.accept
      let contentType
      const uri = url.parse(req.url).pathname
      const filename = path.join('test', 'data', uri)

      if (filename.indexOf('.yaml') > 0) {
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
          contentType = accept
          res.setHeader('Content-Type', contentType)
        }
        if (filename.indexOf('.yaml') > 0) {
          res.setHeader('Content-Type', 'application/yaml')
        }
      }
      if(filename === 'test/data/postTest' && req.method === 'POST') {
        var body = [];
        req.on('data', function (data) {
          body.push(data);
        });

        req.on('end', function () {
          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          body = Buffer.concat(body).toString()
          res.write(body)
          res.end()
          return
        });
        return
      }

      if (req.headers['x-setcontenttype']) {
        // Allow the test to explicitly set (or unset) a content type
        if (req.headers['x-setcontenttype'] === 'none') {
          res.removeHeader('Content-Type')
        }
        else {
          res.setHeader('Content-Type', req.headers['x-setcontenttype'])
        }
      }

      fs.exists(filename, function (exists) {
        if (exists) {
          res.setHeader('Content-Type', contentType)
          res.writeHead(200)
          fs.createReadStream(filename).pipe(res)
        }
        else {
          res.writeHead(404, {'Content-Type': 'text/plain'})
          res.write('404 Not Found\n')
          res.end()
        }
      })
    }).listen(8000)
  })

  after(function () {
    server.close()
  })

  afterEach(function () {
  })

  it('should get the JSON petstore api and build it', (done) => {
    Swagger('http://localhost:8000/petstore.json')
      .then((client) => {
        expect(client).toExist()

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(3)

        // the pet tag exists
        expect(client.apis.pet).toExist()

        // the get pet operation
        expect(client.apis.pet.getPetById).toExist()

        done()
      })
  })

  it('should get the YAML petstore api and build it', (done) => {
    Swagger('http://localhost:8000/petstore.json')
      .then((client) => {
        expect(client).toExist()

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(3)

        // the pet tag exists
        expect(client.apis.pet).toExist()

        // the get pet operation
        expect(client.apis.pet.getPetById).toExist()

        done()
      })
  })

  it('should get the JSON petstore api and build it when response lacks a `Content-Type`', (done) => {
    Swagger('http://localhost:8000/petstore.json', {
      requestInterceptor: (req) => {
        req.headers['X-SetContentType'] = 'none'
        return req
      }
    })
      .then((client) => {
        expect(client).toExist()

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(3)

        // the pet tag exists
        expect(client.apis.pet).toExist()

        // the get pet operation
        expect(client.apis.pet.getPetById).toExist()

        done()
      })
      .catch(err => done(err))
  })

  it('should get the YAML petstore api and build it when response lacks a `Content-Type`', (done) => {
    Swagger('http://localhost:8000/petstore.yaml', {
      requestInterceptor: (req) => {
        req.headers['X-SetContentType'] = 'none'
        return req
      }
    })
      .then((client) => {
        expect(client).toExist()

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(3)

        // the pet tag exists
        expect(client.apis.pet).toExist()

        // the get pet operation
        expect(client.apis.pet.getPetById).toExist()

        done()
      })
      .catch(err => done(err))
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1005
   */
  it.skip('should get a pet from the petstore', (done) => {
    Swagger('http://localhost:8000/petstore.json')
      .then((client) => {
        client.apis.pet.getPetById({petId: -1})
          .then((data) => {
            done('shoulda thrown an error!')
          })
          .catch((err) => {
            done()
          })
      })
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1002
   */
  it.skip('should return an error when a spec doesnt exist', (done) => {
    Swagger('http://localhost:8000/absent.yaml')
      .then((client) => {
        done('expected an error')
      })
      .catch((error) => {
        done()
      })
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1004
   */
  it.skip('fail with invalid verbs', (done) => {
    Swagger('http://localhost:8000/invalid-operation.yaml')
      .then((client) => {
        expect(client.apis.default).toExist()
        expect(client.apis.default['not-a-valid-verb']).toBeAn('undefined')
        done()
      })
  })

  /**
   * Loads a spec where the `host` and `schema` are not defined
   * See https://github.com/swagger-api/swagger-js/issues/1000
   */
  it('use the host from whence the spec was fetched', (done) => {
    Swagger('http://localhost:8000/pathless.yaml')
      .then((client) => {
        client.apis.default.tryMe().catch((err) => {
          expect(err.status).toBe(404)
          done()
        })
      })
      .catch((err) => {
        done(err)
      })
  })

  it('gets data from an endpoint using the alias', (done) => {
    Swagger('http://localhost:8000/alias-tests.yaml')
      .then((client) => {
        client.apis.Testing.getMe().then((response) => {
          expect(response.obj).toBeAn('object');
          expect(response.obj.foo).toBe('bar')
          done()
        }).catch((err) => {
          done(err)
        })
      })
      .catch((err) => {
        done(err)
      })
  })

  /**
   Post a value to an endpoint which should be returned directly
   by this mock server
   */
  it('posts data to an endpoint using the alias', (done) => {
    Swagger('http://localhost:8000/alias-tests.yaml')
      .then((client) => {
        client.apis.Testing.tryMe({
          name: 'tony'
        }).then((response) => {
          expect(response.obj).toBeAn('object');
          expect(response.obj.name).toBe('tony')
          done()
        }).catch((err) => {
          done(err)
        })
      })
      .catch((err) => {
        done(err)
      })
  })
})
