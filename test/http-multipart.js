import fetchMock from 'fetch-mock'
import FormData from '../src/internal/form-data-monkey-patch'
import {buildRequest} from '../src/execute'
import sampleMultipartOpenApi2 from './data/sample-multipart-oas2'
import sampleMultipartOpenApi3 from './data/sample-multipart-oas3'

/**
 * fetch-mock uses node-fetch under the hood
 * cross-fetch, which SwaggerClient uses in src, also uses node-fetch under the hood
 * therefore, fetch-mock matches the behavior used in src for both mock and live-server test
 */

afterEach(() => {
  fetchMock.restore()
  fetchMock.reset()
})

describe('buildRequest - openapi 2.0', () => {
  describe('formData', () => {
    const req = buildRequest({
      spec: sampleMultipartOpenApi2,
      operationId: 'post_land_content_ViewOfAuthOwner',
      parameters: {
        'formData.hhlContent:sort': 'id',
        'formData.hhlContent:order': 'desc',
        'formData.email[]': ["person1", "person2"], // eslint-disable-line quotes
        'formData.none[]': ['foo', 'bar'],
        'formData.csv[]': ['foo', 'bar'],
        'formData.tsv[]': ['foo', 'bar'],
        'formData.ssv[]': ['foo', 'bar'],
        'formData.pipes[]': ['foo', 'bar'],
      }
    })

    test('should return appropriate response media type', () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/ViewOfAuthOwner',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      })
    })

    test('should build request body as FormData', () => {
      const validateFormDataInstance = req.body instanceof FormData
      expect(validateFormDataInstance).toEqual(true)
    })

    test('should return "collectionFormat: multi" as FormData entry list and entry item entries (in order)', () => {
      const itemEntries = req.body.getAll('email[]')
      expect(itemEntries.length).toEqual(2)
      expect(itemEntries[0]).toEqual('person1')
      expect(itemEntries[1]).toEqual('person2')
    })

    test('should return "collectionFormat: none" as single FormData entry in csv format', () => {
      const itemEntriesNone = req.body.getAll('none[]')
      expect(itemEntriesNone.length).toEqual(1)
      expect(itemEntriesNone[0]).toEqual('foo,bar')
    })

    test('should return "collectionFormat: csv" as single FormData entry in csv format', () => {
      const itemEntriesCsv = req.body.getAll('csv[]')
      expect(itemEntriesCsv.length).toEqual(1)
      expect(itemEntriesCsv[0]).toEqual('foo,bar')
    })

    test('should return "collectionFormat: tsv" as single FormData entry in tsv format', () => {
      const itemEntriesTsv = req.body.getAll('tsv[]')
      expect(itemEntriesTsv.length).toEqual(1)
      expect(itemEntriesTsv[0]).toEqual('foo%09bar')
    })

    test('should return "collectionFormat: ssv" as single FormData entry in ssv format', () => {
      const itemEntriesSsv = req.body.getAll('ssv[]')
      expect(itemEntriesSsv.length).toEqual(1)
      expect(itemEntriesSsv[0]).toEqual('foo%20bar')
    })

    test('should return "collectionFormat: pipes" as single FormData entry in pipes format', () => {
      const itemEntriesPipes = req.body.getAll('pipes[]')
      expect(itemEntriesPipes.length).toEqual(1)
      expect(itemEntriesPipes[0]).toEqual('foo|bar')
    })

    /**
     * Dev test only: assumes local server exists for POST
     * Expect server response format: { message: 'ok', data: returnData }
     * where returnData = req.body/req.files/req.file
     */
    test.skip('should (Live) POST multipart-formdata with entry item entries', () => {
      return fetch('http://localhost:3300/api/v1/formdata', { // eslint-disable-line no-undef
        method: 'POST',
        body: req.body
      })
        .then((res) => {
          return res.json()
        })
        .then((json) => {
          expect(json.data.email.length).toEqual(2)
          expect(json.data.email[0]).toEqual('person1')
          expect(json.data.email[1]).toEqual('person2')
        })
    })

    test('should Mock POST multipart-formdata with entry item entries', () => {
      // Given
      fetchMock.post('http://localhost:3300/api/v1/formdata', {
        status: 200,
        body: {
          message: 'post received',
          data: {
            'hhlContent:sort': 'id',
            'hhlContent:order': 'desc',
            email: ['person1', 'person2']
          }
        }
      },
        {
          sendAsJson: false
        })

      return fetch('http://localhost:3300/api/v1/formdata', { // eslint-disable-line no-undef
        method: 'POST',
        body: req.body,
      })
        .then((res) => {
          return res.json()
        })
        .then((json) => {
          expect(json.data.email.length).toEqual(2)
          expect(json.data.email[0]).toEqual('person1')
          expect(json.data.email[1]).toEqual('person2')
          // duck typing that fetch received a FormData instance instead of plain object
          const lastOptions = fetchMock.lastOptions()
          expect(lastOptions.body.readable).toEqual(true)
          // expect(lastOptions.body._streams).toBeDefined()
        })
    })
  })
})

describe('buildRequest - openapi 3.0', () => {
  describe('formData', () => {
    const req = buildRequest({
      spec: sampleMultipartOpenApi3,
      operationId: 'post_land_content_ViewOfAuthOwner',
      requestBody: {
        'hhlContent:sort': 'id',
        'hhlContent:order': 'desc',
        'email[]': ["person1", "person2"] // eslint-disable-line quotes
      }
    })

    test('should return appropriate response media type', () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/ViewOfAuthOwner',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      })
    })

    test('should build request body as FormData', () => {
      const validateFormDataInstance = req.body instanceof FormData
      expect(validateFormDataInstance).toEqual(true)
    })

    test('should return FormData entry list and item entries (in order)', () => {
      const itemEntries = req.body.getAll('email[]')
      expect(itemEntries.length).toEqual(2)
      expect(itemEntries[0]).toEqual('person1')
      expect(itemEntries[1]).toEqual('person2')
    })

    /**
     * Dev test only: assumes local server exists for POST
     * Expect server response format: { message: 'ok', data: returnData }
     * where returnData = req.body/req.files/req.file
     */
    test.skip('should (Live) POST multipart-formdata with entry item entries', () => {
      return fetch('http://localhost:3300/api/v1/formdata', { // eslint-disable-line no-undef
        method: 'POST',
        body: req.body
      })
      .then((res) => {
        return res.json()
      })
      .then((json) => {
        expect(json.data.email.length).toEqual(2)
        expect(json.data.email[0]).toEqual('person1')
        expect(json.data.email[1]).toEqual('person2')
      })
    })

    test('should Mock POST multipart-formdata with entry item entries', () => {
      // Given
      fetchMock.post('http://localhost:3300/api/v1/formdata', {
        status: 200,
        body: {
          message: 'post received',
          data: {
            'hhlContent:sort': 'id',
            'hhlContent:order': 'desc',
            email: ['person1', 'person2']
          }
        }
      },
        {
          sendAsJson: false
        })

      return fetch('http://localhost:3300/api/v1/formdata', { // eslint-disable-line no-undef
        method: 'POST',
        body: req.body,
      })
        .then((res) => {
          return res.json()
        })
        .then((json) => {
          expect(json.data.email.length).toEqual(2)
          expect(json.data.email[0]).toEqual('person1')
          expect(json.data.email[1]).toEqual('person2')
          // duck typing that fetch received a FormData instance instead of plain object
          const lastOptions = fetchMock.lastOptions()
          expect(lastOptions.body.readable).toEqual(true)
          // expect(lastOptions.body._streams).toBeDefined()
        })
    })
  })

  describe('formData with file', () => {
    const file1 = Buffer.from('test file data1')
    const file2 = Buffer.from('test file data2')

    const req = buildRequest({
      spec: sampleMultipartOpenApi3,
      operationId: 'post_land_content_uploadImage',
      requestBody: {
        imageId: 'id',
        'images[]': [file1, file2]
      }
    })

    test('should return FormData entry list and item entries (in order)', () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/uploadImage',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      })
      const validateFormDataInstance = req.body instanceof FormData
      expect(validateFormDataInstance).toEqual(true)
      const itemEntries = req.body.getAll('images[]')
      expect(itemEntries.length).toEqual(2)
      expect(itemEntries[0]).toEqual(file1)
      expect(itemEntries[1]).toEqual(file2)
    })
  })

  describe('respect Encoding Object', () => {
    test('Should be set to object in the style of deepObject', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore'
          }
        ],
        paths: {
          '/one': {
            post: {
              operationId: 'getOne',
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      properties: {
                        color: {
                          type: 'object',
                        },
                      }
                    },
                    encoding: {
                      color: {
                        style: 'deepObject',
                        explode: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          color: {R: 100, G: 200, B: 150}
        }
      })

      expect(req).toMatchObject({
        method: 'POST',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      })

      expect(Array.from(req.body._entryList)).toEqual([{name: 'color[R]', value: '100'}, {name: 'color[G]', value: '200'}, {name: 'color[B]', value: '150'}])
    })
  })
})
