import fs from 'node:fs';
import path from 'node:path';
import * as undici from 'undici';

import { buildRequest } from '../../src/execute/index.js';
import sampleMultipartOpenApi2 from '../data/sample-multipart-oas2.js';
import sampleMultipartOpenApi3 from '../data/sample-multipart-oas3.js';

let mockAgent;
let originalGlobalDispatcher;

beforeEach(() => {
  mockAgent = new undici.MockAgent();
  originalGlobalDispatcher = undici.getGlobalDispatcher();
  undici.setGlobalDispatcher(mockAgent);
});

afterEach(() => {
  undici.setGlobalDispatcher(originalGlobalDispatcher);
  mockAgent = null;
  originalGlobalDispatcher = null;
});

describe('buildRequest - openapi 2.0', () => {
  describe('formData', () => {
    const req = buildRequest({
      spec: sampleMultipartOpenApi2,
      operationId: 'post_land_content_ViewOfAuthOwner',
      parameters: {
        'formData.hhlContent:sort': 'id',
        'formData.hhlContent:order': 'desc',
        'formData.email[]': ['person1', 'person2'], // eslint-disable-line quotes
        'formData.none[]': ['foo', 'bar'],
        'formData.csv[]': ['foo', 'bar'],
        'formData.tsv[]': ['foo', 'bar'],
        'formData.ssv[]': ['foo', 'bar'],
        'formData.pipes[]': ['foo', 'bar'],
      },
    });

    test('should return appropriate response media type', () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/ViewOfAuthOwner',
        credentials: 'same-origin',
        headers: {
          'Content-Type': expect.stringMatching(/^multipart\/form-data/),
        },
      });
    });

    test('should build request body as FormData', () => {
      expect(req.body).toBeInstanceOf(FormData);
    });

    test('should return "collectionFormat: multi" as FormData entry list and entry item entries (in order)', () => {
      const itemEntries = req.formdata.getAll('email[]');
      expect(itemEntries.length).toEqual(2);
      expect(itemEntries[0]).toEqual('person1');
      expect(itemEntries[1]).toEqual('person2');
    });

    test('should return "collectionFormat: none" as single FormData entry in csv format', () => {
      const itemEntriesNone = req.formdata.getAll('none[]');
      expect(itemEntriesNone.length).toEqual(1);
      expect(itemEntriesNone[0]).toEqual('foo,bar');
    });

    test('should return "collectionFormat: csv" as single FormData entry in csv format', () => {
      const itemEntriesCsv = req.formdata.getAll('csv[]');
      expect(itemEntriesCsv.length).toEqual(1);
      expect(itemEntriesCsv[0]).toEqual('foo,bar');
    });

    test('should return "collectionFormat: tsv" as single FormData entry in tsv format', () => {
      const itemEntriesTsv = req.formdata.getAll('tsv[]');
      expect(itemEntriesTsv.length).toEqual(1);
      expect(itemEntriesTsv[0]).toEqual('foo%09bar');
    });

    test('should return "collectionFormat: ssv" as single FormData entry in ssv format', () => {
      const itemEntriesSsv = req.formdata.getAll('ssv[]');
      expect(itemEntriesSsv.length).toEqual(1);
      expect(itemEntriesSsv[0]).toEqual('foo%20bar');
    });

    test('should return "collectionFormat: pipes" as single FormData entry in pipes format', () => {
      const itemEntriesPipes = req.formdata.getAll('pipes[]');
      expect(itemEntriesPipes.length).toEqual(1);
      expect(itemEntriesPipes[0]).toEqual('foo|bar');
    });

    /**
     * Dev test only: assumes local server exists for POST
     * Expect server response format: { message: 'ok', data: returnData }
     * where returnData = req.body/req.files/req.file
     */
    test.skip('should (Live) POST multipart-formdata with entry item entries', () =>
      fetch('http://localhost:3300/api/v1/formdata', {
        method: 'POST',
        body: req.body,
      })
        .then((res) => res.json())
        .then((json) => {
          expect(json.data.email.length).toEqual(2);
          expect(json.data.email[0]).toEqual('person1');
          expect(json.data.email[1]).toEqual('person2');
        }));

    test('should Mock POST multipart-formdata with entry item entries', () => {
      const mockPool = mockAgent.get('http://localhost:3300');
      mockPool.intercept({ method: 'POST', path: '/api/v1/formdata' }).reply(({ body }) => {
        // fetch received a FormData instance instead of plain object
        expect(body).toBeInstanceOf(FormData);

        return {
          statusCode: 200,
          data: JSON.stringify({
            message: 'post received',
            data: {
              'hhlContent:sort': 'id',
              'hhlContent:order': 'desc',
              email: ['person1', 'person2'],
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      });

      return fetch('http://localhost:3300/api/v1/formdata', {
        method: 'POST',
        body: req.body,
      })
        .then((res) => res.json())
        .then((json) => {
          expect(json.data.email.length).toEqual(2);
          expect(json.data.email[0]).toEqual('person1');
          expect(json.data.email[1]).toEqual('person2');
        });
    });
  });
});

describe('buildRequest - openapi 3.0', () => {
  describe('formData', () => {
    const req = buildRequest({
      spec: sampleMultipartOpenApi3,
      operationId: 'post_land_content_ViewOfAuthOwner',
      requestBody: {
        'hhlContent:sort': 'id',
        'hhlContent:order': 'desc',
        'email[]': ['person1', 'person2'], // eslint-disable-line quotes
      },
    });

    test('should return appropriate response media type', () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/ViewOfAuthOwner',
        credentials: 'same-origin',
        headers: {
          'Content-Type': expect.stringMatching(/^multipart\/form-data/),
        },
      });
    });

    test('should build request body as FormData', () => {
      expect(req.body).toBeInstanceOf(FormData);
    });

    test('should return FormData entry list and item entries (in order)', () => {
      const itemEntries = req.formdata.getAll('email[]');
      expect(itemEntries.length).toEqual(2);
      expect(itemEntries[0]).toEqual('person1');
      expect(itemEntries[1]).toEqual('person2');
    });

    /**
     * Dev test only: assumes local server exists for POST
     * Expect server response format: { message: 'ok', data: returnData }
     * where returnData = req.body/req.files/req.file
     */
    test.skip('should (Live) POST multipart-formdata with entry item entries', () =>
      fetch('http://localhost:3300/api/v1/formdata', {
        method: 'POST',
        body: req.body,
      })
        .then((res) => res.json())
        .then((json) => {
          expect(json.data.email.length).toEqual(2);
          expect(json.data.email[0]).toEqual('person1');
          expect(json.data.email[1]).toEqual('person2');
        }));

    test('should Mock POST multipart-formdata with entry item entries', () => {
      const mockPool = mockAgent.get('http://localhost:3300');
      mockPool.intercept({ method: 'POST', path: '/api/v1/formdata' }).reply(({ body }) => {
        // fetch received a FormData instance instead of plain object
        expect(body).toBeInstanceOf(FormData);

        return {
          statusCode: 200,
          data: JSON.stringify({
            message: 'post received',
            data: {
              'hhlContent:sort': 'id',
              'hhlContent:order': 'desc',
              email: ['person1', 'person2'],
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        };
      });

      return fetch('http://localhost:3300/api/v1/formdata', {
        method: 'POST',
        body: req.body,
      })
        .then((res) => res.json())
        .then((json) => {
          expect(json.data.email.length).toEqual(2);
          expect(json.data.email[0]).toEqual('person1');
          expect(json.data.email[1]).toEqual('person2');
        });
    });
  });

  describe('formData with Buffer', () => {
    const file1 = Buffer.from('test file data1');
    const file2 = Buffer.from('test file data2');

    const req = buildRequest({
      spec: sampleMultipartOpenApi3,
      operationId: 'post_land_content_uploadImage',
      requestBody: {
        imageId: 'id',
        'images[]': [file1, file2],
      },
    });

    test('should return FormData entry list and item entries (in order)', async () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/uploadImage',
        credentials: 'same-origin',
        headers: {
          'Content-Type': expect.stringMatching(/^multipart\/form-data/),
        },
      });
      expect(req.body).toBeInstanceOf(FormData);
      const itemEntries = req.formdata.getAll('images[]');

      expect(itemEntries.length).toEqual(2);
      expect(await itemEntries[0].text()).toEqual(file1.toString());
      expect(await itemEntries[1].text()).toEqual(file2.toString());
    });
  });

  describe('formData with fs.createReadStream', () => {
    /**
     * fs.ReadStream is not supported as a value in FormData according to the spec.
     * `fileFromPathSync` helper should be used to load files from Node.js env
     * that are further used as values for FormData.
     */
    const file1 = new File(
      fs.readFileSync(path.join(__dirname, 'data', 'file1.txt')),
      'file1.txt',
      { type: 'text/plain' }
    );
    const file2 = new File(
      fs.readFileSync(path.join(__dirname, 'data', 'file1.txt')),
      'file1.txt',
      { type: 'text/plain' }
    );

    const req = buildRequest({
      spec: sampleMultipartOpenApi3,
      operationId: 'post_land_content_uploadImage',
      requestBody: {
        imageId: 'id',
        'images[]': [file1, file2],
      },
    });

    test('should return FormData entry list and item entries (in order)', async () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/uploadImage',
        credentials: 'same-origin',
        headers: {
          'Content-Type': expect.stringMatching(/^multipart\/form-data/),
        },
      });
      expect(req.body).toBeInstanceOf(FormData);
      const itemEntries = req.formdata.getAll('images[]');

      expect(itemEntries.length).toEqual(2);
      expect(await itemEntries[0].text()).toEqual(await file1.text());
      expect(await itemEntries[1].text()).toEqual(await file2.text());
    });
  });

  describe('formData with File/Blob', () => {
    const file1 = new File(['test file data1'], 'file1.txt', {
      type: 'text/plain',
    });
    const file2 = new Blob(['test file data2'], {
      type: 'text/plain',
    });

    const req = buildRequest({
      spec: sampleMultipartOpenApi3,
      operationId: 'post_land_content_uploadImage',
      requestBody: {
        imageId: 'id',
        'images[]': [file1, file2],
      },
    });

    test('should return FormData entry list and item entries (in order)', async () => {
      expect(req).toMatchObject({
        method: 'POST',
        url: '/api/v1/land/content/uploadImage',
        credentials: 'same-origin',
        headers: {
          'Content-Type': expect.stringMatching(/^multipart\/form-data/),
        },
      });
      expect(req.body).toBeInstanceOf(FormData);
      const itemEntries = req.formdata.getAll('images[]');

      expect(itemEntries.length).toEqual(2);
      expect(await itemEntries[0].text()).toEqual(await file1.text());
      expect(await itemEntries[1].text()).toEqual(await file2.text());
    });
  });

  describe('respect Encoding Object', () => {
    test('Should be set to object in the style of deepObject', () => {
      const spec = {
        openapi: '3.0.0',
        servers: [
          {
            url: 'http://petstore.swagger.io/v2',
            name: 'Petstore',
          },
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
                      },
                    },
                    encoding: {
                      color: {
                        style: 'deepObject',
                        explode: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      // when
      const req = buildRequest({
        spec,
        operationId: 'getOne',
        requestBody: {
          color: { R: 100, G: 200, B: 150 },
        },
      });

      expect(req).toMatchObject({
        method: 'POST',
        url: 'http://petstore.swagger.io/v2/one',
        credentials: 'same-origin',
        headers: {
          'Content-Type': expect.stringMatching(/^multipart\/form-data/),
        },
      });

      expect(Array.from(req.formdata)).toEqual([
        ['color[R]', '100'],
        ['color[G]', '200'],
        ['color[B]', '150'],
      ]);
    });
  });
});
