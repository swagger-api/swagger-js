import expect from 'expect'
import xmock from 'xmock'
import fetchMock from 'fetch-mock'
import http, {
  serializeHeaders, mergeInQueryOrForm, encodeFormOrQuery, serializeRes,
  shouldDownloadAsText
} from '../src/http'

describe('http', () => {
  let xapp

  afterEach(function () {
    if (xapp) {
      xapp.restore()
    }
  })

  it('should be able to GET a url', () => {
    xapp = xmock()
    xapp.get('http://swagger.io', (req, res) => res.send('hi'))

    return http({
      url: 'http://swagger.io'
    })
    .then((res) => {
      expect(res.status).toEqual(200)
      expect(res.text).toEqual('hi')
    })
  })

  it('should always load a spec as text', () => {
    xapp = xmock()
    xapp.get('http://swagger.io/somespec', (req, res) => {
      res.set('Content-Type', 'application/octet-stream')
      res.send('key: val')
    })

    return http({url: 'http://swagger.io/somespec', loadSpec: true}).then((res) => {
      expect(res.status).toEqual(200)
      expect(res.text).toEqual('key: val')
    })
  })

  it('should include status code and response with HTTP Error', () => {
    xapp = xmock()
    xapp.get('http://swagger.io', (req, res) => res.status(400).send('hi'))

    return http({
      url: 'http://swagger.io'
    })
    .then(
      (res) => {
        throw new Error('Expected rejection for HTTP status 400')
      },
      (err) => {
        expect(err.status).toEqual(400)
        expect(err.statusCode).toEqual(400)
        expect(err.response.text).toEqual('hi')
      }
    )
  })

  it('should apply responseInterceptor to error responses', () => {
    xapp = xmock()
    xapp.get('http://swagger.io', (req, res) => res.status(400).send('hi'))

    return http({
      url: 'http://swagger.io',
      responseInterceptor: (res) => {
        res.testValue = 5
      }
    })
    .then(
      (res) => {
        throw new Error('Expected rejection for HTTP status 400')
      },
      (err) => {
        expect(err.response.testValue).toEqual(5)
      }
    )
  })

  it('should set responseError on responseInterceptor Error', () => {
    xapp = xmock()
    xapp.get('http://swagger.io', (req, res) => res.status(400).send('hi'))

    const testError = new Error()
    return http({
      url: 'http://swagger.io',
      responseInterceptor: (res) => {
        throw testError
      }
    })
    .then(
      (res) => {
        throw new Error('Expected rejection for HTTP status 400')
      },
      (err) => {
        expect(err.response).toEqual(null)
        expect(err.responseError).toBe(testError)
      }
    )
  })

  describe('serializeHeaders', function () {
    it('should handle FetchAPI Headers object, which is iterable', function () {
      // Given
      // isomorphic-fetch exposes FetchAPI methods onto global
      require('isomorphic-fetch')
      expect(global.Headers).toBeA(Function)
      const headers = new Headers() // eslint-disable-line no-undef
      headers.append('Authorization', 'Basic hoop-la')
      headers.append('Content-Type', 'application/oai.json')

      // When
      const serializedHeaders = serializeHeaders(headers)

      // Then
      expect(serializedHeaders).toEqual({
        authorization: 'Basic hoop-la',
        'content-type': 'application/oai.json'
      })
    })

    it('should handle two of the same headers', function () {
      // Given
      // isomorphic-fetch exposes FetchAPI methods onto global
      require('isomorphic-fetch')
      expect(global.Headers).toBeA(Function)
      const headers = new Headers() // eslint-disable-line no-undef
      headers.append('Authorization', 'Basic hoop-la')
      headers.append('Authorization', 'Advanced hoop-la')

      // When
      const serializedHeaders = serializeHeaders(headers)

      // Then
      expect(serializedHeaders).toEqual({
        authorization: ['Basic hoop-la', 'Advanced hoop-la'],
      })
    })

    it('should handle multiple headers', function () {
      // Given
      // isomorphic-fetch exposes FetchAPI methods onto global
      require('isomorphic-fetch')
      expect(global.Headers).toBeA(Function)
      const headers = new Headers() // eslint-disable-line no-undef
      headers.append('Authorization', 'Basic hoop-la')
      headers.append('Authorization', 'Advanced hoop-la')
      headers.append('Authorization', 'Super-Advanced hoop-la')

      // When
      const serializedHeaders = serializeHeaders(headers)

      // Then
      expect(serializedHeaders).toEqual({
        authorization: ['Basic hoop-la', 'Advanced hoop-la', 'Super-Advanced hoop-la'],
      })
    })
  })

  describe('mergeInQueryOrForm', function () {
    it('should add query into URL ( with exising url )', function () {
      const req = {
        url: 'https://swagger.io?one=1&two=1',
        query: {
          two: {
            value: 2
          },
          three: {
            value: 3
          }
        }
      }
      expect(mergeInQueryOrForm(req)).toEqual({
        url: 'https://swagger.io?one=1&two=2&three=3'
      })
    })

    it('should not encode form-data', function () {
      const FormData = require('isomorphic-form-data')
      const _append = FormData.prototype.append
      FormData.prototype.append = function (k, v) {
        this._entries = this._entries || {}
        this._entries[k] = v
      }

      const req = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        form: {
          testJson: {
            value: '{"name": "John"}'
          }
        }
      }
      mergeInQueryOrForm(req)
      expect(req.body._entries.testJson).toEqual('{"name": "John"}')
      FormData.prototype.append = _append
    })
  })

  describe('encodeFormOrQuery', function () {
    it('should parse a query object into a query string', function () {
      const req = {
        query: {
          one: {
            value: 1
          },
          two: {
            value: 2
          },
          three: {
            value: false
          }
        }
      }

      expect(encodeFormOrQuery(req.query)).toEqual('one=1&two=2&three=false')
    })

    it('should handle arrays', function () {
      const req = {
        query: {
          id: {
            value: [1, 2]
          }
        }
      }

      expect(encodeFormOrQuery(req.query)).toEqual('id=1,2')
    })

    it('should handle custom array serilization', function () {
      // Given
      fetchMock.get('*', {hello: 'world'})
      const req = {
        url: 'http://example.com',
        method: 'GET',
        query: {
          anotherOne: ['one', 'two'], // No collection format
          evenMore: 'hi', // string, not an array
          bar: { // has a collectionFormat, so we need a way of indicating it
            collectionFormat: 'ssv',
            value: [1, 2, 3]
          }
        }
      }

      return http('http://example.com', req).then((response) => {
        expect(response.url).toEqual('http://example.com?anotherOne=one,two&evenMore=hi&bar=1%202%203')
        expect(response.status).toEqual(200)
      }).then(fetchMock.restore)
    })
  })

  describe('serializeRes', function () {
    it('should serialize fetch-like response and call serializeHeaders', function () {
      const headers = {
        Authorization: ['Basic hoop-la', 'Advanced hoop-la']
      }

      const res = fetchMock.mock('http://swagger.io', {headers})

      return fetch('http://swagger.io').then((_res) => { // eslint-disable-line no-undef
        return serializeRes(_res, 'https://swagger.io')
      }).then((resSerialize) => {
        expect(resSerialize.headers).toEqual({authorization: ['Basic hoop-la', 'Advanced hoop-la']})
      }).then(fetchMock.restore)
    })

    it('should set .text and .data to body Blob or Buffer for binary response', function () {
      const headers = {
        'Content-Type': 'application/octet-stream'
      }

      const body = 'body data'
      const res = fetchMock.mock('http://swagger.io', {body, headers})

      return fetch('http://swagger.io').then((_res) => { // eslint-disable-line no-undef
        return serializeRes(_res, 'https://swagger.io')
      }).then((resSerialize) => {
        expect(resSerialize.data).toBe(resSerialize.text)
        if (typeof Blob !== 'undefined') {
          expect(resSerialize.data).toBeA(Blob) // eslint-disable-line no-undef
        }
        else {
          expect(resSerialize.data).toBeA(Buffer)
          expect(resSerialize.data).toEqual(new Buffer(body))
        }
      }).then(fetchMock.restore)
    })

    it('should set .text and .data to body string for text response', function () {
      const headers = {
        'Content-Type': 'application/json'
      }

      const body = 'body data'
      const res = fetchMock.mock('http://swagger.io', {body, headers})

      return fetch('http://swagger.io').then((_res) => { // eslint-disable-line no-undef
        return serializeRes(_res, 'https://swagger.io')
      }).then((resSerialize) => {
        expect(resSerialize.data).toBe(resSerialize.text)
        expect(resSerialize.data).toBe(body)
      }).then(fetchMock.restore)
    })
  })

  describe('shouldDownloadAsText', () => {
    it('should return true for json, xml, yaml, and text types', function () {
      const types = [
        'text/x-yaml', 'application/xml', 'text/xml', 'application/json',
        'text/plain'
      ]

      types.forEach((v) => {
        expect(`${v} ${shouldDownloadAsText(v)}`).toEqual(`${v} true`)
      })
    })

    it('should return false for other common types', function () {
      const types = [
        'application/octet-stream', 'application/x-binary'
      ]

      types.forEach((v) => {
        expect(`${v} ${shouldDownloadAsText(v)}`).toEqual(`${v} false`)
      })
    })

    it('should fail gracefully when called with no parameters', function () {
      expect(shouldDownloadAsText()).toEqual(false)
    })
  })
})
