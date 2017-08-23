import expect from 'expect'
import http from 'http'
import url from 'url'
import path from 'path'
import fs from 'fs'

import Swagger from '../../src/index'

describe('http - OpenAPI Specification 3.0', () => {
  let server
  before(function () {
    server = http.createServer(function (req, res) {
      const accept = req.headers.accept
      let contentType
      const uri = url.parse(req.url).pathname
      const filename = path.join('test', 'oas3', 'data', uri)

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

      fs.exists(filename, function (exists) {
        if (exists) {
          const fileStream = fs.createReadStream(filename)
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.writeHead(200, contentType)
          fileStream.pipe(res)
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

  it('should get the petstore api and build it', (done) => {
    Swagger('http://localhost:8000/petstore-oas3.yaml')
      .then((client) => {
        expect(client).toExist()

        // we have 3 tags
        expect(Object.keys(client.apis).length).toBe(1)

        // the pet tag exists
        expect(client.apis.pets).toExist()

        // the get pet operation
        expect(client.apis.pets.getPetById).toExist()

        done()
      })
      .catch(e => done (e))
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1005
   */
  it('should get a pet from the petstore', (done) => {
    Swagger('http://localhost:8000/petstore-oas3.yaml')
      .then((client) => {
        client.apis.pets.getPetById({petId: -1})
          .then((data) => {
            done()
          })
          .catch((err) => {
            done(err)
          })
      })
      .catch(e => done (e))
  })

  /**
   * See https://github.com/swagger-api/swagger-js/issues/1002
   */
  it('should return an error when a spec doesnt exist', (done) => {
    Swagger('http://localhost:8000/not-real.yaml')
      .then((client) => {
        done('expected an error')
      })
      .catch((error) => {
        done()
      })
  })
})
