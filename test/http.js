import expect from 'expect'
import xmock from 'xmock'
import fetchMock from 'fetch-mock'
import http, {serializeHeaders, mergeInQueryOrForm, encodeFormOrQuery, serializeRes} from '../src/http'

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

  describe('serializeHeaders', function () {
    it('should handle FetchAPI Headers object, which is iterable', function () {
      // Given
      // isomorphic-fetch exposes FetchAPI methods onto global
      require('isomorphic-fetch')
      expect(global.Headers).toBeA(Function)
      const headers = new Headers()
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
      const headers = new Headers()
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
      const headers = new Headers()
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
          }
        }
      }

      expect(encodeFormOrQuery(req.query)).toEqual('one=1&two=2')
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
      const headers = new Headers()
      headers.append('Authorization', 'Basic hoop-la')
      headers.append('Authorization', 'Advanced hoop-la')

      const mockRes = new Request('http://swagger.io', {headers})

      const res = fetchMock.mock('http://swagger.io', mockRes)

      fetch('http://swagger.io').then((_res) => {
        return serializeRes(_res, 'https://swagger.io')
      }).then((resSerialize) => {
        expect(resSerialize.headers).toEqual({authorization: ['Basic hoop-la', 'Advanced hoop-la']})
      }).then(fetchMock.restore)
    })
  })
})
