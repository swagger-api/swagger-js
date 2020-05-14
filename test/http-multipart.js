import FormData from '@tim-lai/isomorphic-form-data'
import fetchMock from 'fetch-mock'
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
        'formData.email[]': ["person1", "person2"] // eslint-disable-line quotes
      }
    })

    test('should return FormData entry list and entry item entries (in order)', () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/ViewOfAuthOwner',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      })
      const validateFormDataInstance = req.body instanceof FormData
      expect(validateFormDataInstance).toEqual(true)
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
        body: req.body.stream, // per formdata-node docs
        headers: req.body.headers // per formdata-node docs
      })
        .then((res) => {
          return res.json()
        })
        .then((json) => {
          expect(json.email.length).toEqual(2)
          expect(json.email[0]).toEqual('person1')
          expect(json.email[1]).toEqual('person2')
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
        body: req.body.stream, // per formdata-node docs
        headers: req.body.headers // per formdata-node docs
      })
        .then((res) => {
          return res.json()
        })
        .then((json) => {
          expect(json.data.email.length).toEqual(2)
          expect(json.data.email[0]).toEqual('person1')
          expect(json.data.email[1]).toEqual('person2')
          // duck typing that fetch received a formdata-node Stream instead of plain object
          const lastOptions = fetchMock.lastOptions()
          expect(lastOptions.body.readable).toEqual(true)
          expect(lastOptions.body._readableState).toBeDefined()
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

    test('should return FormData entry list and item entries (in order)', () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/ViewOfAuthOwner',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
      })
      const validateFormDataInstance = req.body instanceof FormData
      expect(validateFormDataInstance).toEqual(true)
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
        body: req.body.stream, // per formdata-node docs
        headers: req.body.headers // per formdata-node docs
      })
      .then((res) => {
        return res.json()
      })
      .then((json) => {
        expect(json.email.length).toEqual(2)
        expect(json.email[0]).toEqual('person1')
        expect(json.email[1]).toEqual('person2')
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
        body: req.body.stream, // per formdata-node docs
        headers: req.body.headers // per formdata-node docs
      })
        .then((res) => {
          return res.json()
        })
        .then((json) => {
          expect(json.data.email.length).toEqual(2)
          expect(json.data.email[0]).toEqual('person1')
          expect(json.data.email[1]).toEqual('person2')
          // duck typing that fetch received a formdata-node Stream instead of plain object
          const lastOptions = fetchMock.lastOptions()
          expect(lastOptions.body.readable).toEqual(true)
          expect(lastOptions.body._readableState).toBeDefined()
        })
    })
  })
})
