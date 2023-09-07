import xmock from 'xmock';
import fetchMock from 'fetch-mock';
import { File, Blob } from 'formdata-node';

import http, {
  serializeHeaders,
  mergeInQueryOrForm,
  encodeFormOrQuery,
  serializeRes,
  shouldDownloadAsText,
  isFile,
} from '../../src/http/index.js';

describe('http', () => {
  let xapp;

  afterEach(() => {
    if (xapp) {
      xapp.restore();
    }
  });

  test('should be able to GET a url', () => {
    xapp = xmock();
    xapp.get('http://swagger.io', (req, res) => res.send('hi'));

    return http({
      url: 'http://swagger.io',
    }).then((res) => {
      expect(res.status).toEqual(200);
      expect(res.text).toEqual('hi');
    });
  });

  test('should always load a spec as text', () => {
    xapp = xmock();
    xapp.get('http://swagger.io/somespec', (req, res) => {
      res.set('Content-Type', 'application/octet-stream');
      res.send('key: val');
    });

    return http({ url: 'http://swagger.io/somespec', loadSpec: true }).then((res) => {
      expect(res.status).toEqual(200);
      expect(res.text).toEqual('key: val');
    });
  });

  test('should include status code and response with HTTP Error', () => {
    xapp = xmock();
    xapp.get('http://swagger.io', (req, res) => res.status(400).send('hi'));

    return http({
      url: 'http://swagger.io',
    }).then(
      () => {
        throw new Error('Expected rejection for HTTP status 400');
      },
      (err) => {
        expect(err.status).toEqual(400);
        expect(err.statusCode).toEqual(400);
        expect(err.response.text).toEqual('hi');
      }
    );
  });

  test('should call request interceptor', () => {
    xapp = xmock();
    xapp.get('http://swagger.io', (req, res) => res.status(req.requestHeaders.mystatus).send('hi'));

    return http({
      url: 'http://swagger.io',
      requestInterceptor: (req) => {
        req.headers.mystatus = 200;
        return req;
      },
    }).then((res) => {
      expect(res.status).toEqual(200);
    });
  });

  test('should allow the requestInterceptor to return a promise', () => {
    xapp = xmock();
    xapp.get('http://swagger.io', (req, res) => res.status(req.requestHeaders.mystatus).send('hi'));

    return http({
      url: 'http://swagger.io',
      requestInterceptor: (req) =>
        new Promise((resolve) => {
          setTimeout(() => {
            req.headers.mystatus = 200;
            resolve(req);
          }, 20);
        }),
    }).then((res) => {
      expect(res.status).toEqual(200);
    });
  });

  test('should apply responseInterceptor to error responses', () => {
    xapp = xmock();
    xapp.get('http://swagger.io', (req, res) => res.status(400).send('hi'));

    return http({
      url: 'http://swagger.io',
      responseInterceptor: (res) => {
        res.testValue = 5;
      },
    }).then(
      () => {
        throw new Error('Expected rejection for HTTP status 400');
      },
      (err) => {
        expect(err.response.testValue).toEqual(5);
      }
    );
  });

  test('should allow the responseInterceptor to return a promise for a final response', () => {
    xapp = xmock();
    xapp.get('http://swagger.io', (req, res) => res.status(400).send('doit'));
    xapp.get('http://example.com', (req, res) => res.send('hi'));

    return http({
      url: 'http://swagger.io',
      responseInterceptor: () =>
        http({
          url: 'http://example.com',
        }),
    }).then((res) => {
      expect(res.status).toEqual(200);
      expect(res.text).toEqual('hi');
    });
  });

  test('should set responseError on responseInterceptor Error', () => {
    xapp = xmock();
    xapp.get('http://swagger.io', (req, res) => res.status(400).send('hi'));

    const testError = new Error();
    return http({
      url: 'http://swagger.io',
      responseInterceptor: () => {
        throw testError;
      },
    }).then(
      () => {
        throw new Error('Expected rejection for HTTP status 400');
      },
      (err) => {
        expect(err.response).toBeFalsy();
        expect(err.responseError).toBe(testError);
      }
    );
  });

  describe('serializeHeaders', () => {
    test('should handle FetchAPI Headers object, which is iterable', () => {
      // Given
      expect(global.Headers).toBeInstanceOf(Function);
      const headers = new Headers(); // eslint-disable-line no-undef
      headers.append('Authorization', 'Basic hoop-la');
      headers.append('Content-Type', 'application/oai.json');

      // When
      const serializedHeaders = serializeHeaders(headers);

      // Then
      expect(serializedHeaders).toEqual({
        authorization: 'Basic hoop-la',
        'content-type': 'application/oai.json',
      });
    });

    test('should handle two of the same headers', () => {
      // Given
      expect(global.Headers).toBeInstanceOf(Function);
      const headers = new Headers(); // eslint-disable-line no-undef
      headers.append('Authorization', 'Basic hoop-la');
      headers.append('Authorization', 'Advanced hoop-la');

      // When
      const serializedHeaders = serializeHeaders(headers);

      // Then
      expect(serializedHeaders).toEqual({
        authorization: ['Basic hoop-la', 'Advanced hoop-la'],
      });
    });

    test('should handle multiple headers', () => {
      // Given
      expect(global.Headers).toBeInstanceOf(Function);
      const headers = new Headers(); // eslint-disable-line no-undef
      headers.append('Authorization', 'Basic hoop-la');
      headers.append('Authorization', 'Advanced hoop-la');
      headers.append('Authorization', 'Super-Advanced hoop-la');

      // When
      const serializedHeaders = serializeHeaders(headers);

      // Then
      expect(serializedHeaders).toEqual({
        authorization: ['Basic hoop-la', 'Advanced hoop-la', 'Super-Advanced hoop-la'],
      });
    });
  });

  describe('mergeInQueryOrForm', () => {
    test('should add query into URL ( with exising url )', () => {
      const req = {
        url: 'https://swagger.io?one=1&two=1',
        query: {
          two: {
            value: 2,
          },
          three: {
            value: 3,
          },
        },
      };
      expect(mergeInQueryOrForm(req)).toEqual({
        url: 'https://swagger.io?one=1&two=2&three=3',
      });
    });

    test('should not encode form-data', () => {
      const req = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        form: {
          testJson: {
            value: '{"name": "John"}',
          },
        },
      };
      mergeInQueryOrForm(req);
      const fdArrayItem = req.formdata.getAll('testJson');
      expect(fdArrayItem.length).toEqual(1);
      expect(fdArrayItem[0]).toEqual('{"name": "John"}');
    });
  });

  describe('encodeFormOrQuery', () => {
    test('should parse a query object into a query string', () => {
      const req = {
        query: {
          one: {
            value: 1,
          },
          two: {
            value: 2,
          },
          three: {
            value: false,
          },
        },
      };

      expect(encodeFormOrQuery(req.query)).toEqual('one=1&two=2&three=false');
    });

    test('should parse a generic object into a query string', () => {
      const data = {
        one: 1,
        two: 'two',
        three: false,
      };

      expect(encodeFormOrQuery(data)).toEqual('one=1&two=two&three=false');
    });

    test('should handle arrays', () => {
      const req = {
        query: {
          id: {
            value: [1, 2],
          },
        },
      };

      expect(encodeFormOrQuery(req.query)).toEqual('id=1,2');
    });

    test('should handle custom array serialization', () => {
      fetchMock.get('*', { body: 'response body' });
      const req = {
        url: 'http://example.com',
        method: 'GET',
        query: {
          anotherOne: ['one', 'two'], // No collection format
          evenMore: 'hi', // string, not an array
          bar: {
            // has a collectionFormat, so we need a way of indicating it
            collectionFormat: 'ssv',
            value: [1, 2, 3],
          },
        },
      };

      return http('http://example.com', req)
        .then((response) => {
          expect(response.url).toEqual(
            'http://example.com/?anotherOne=one,two&evenMore=hi&bar=1%202%203'
          );
          expect(response.status).toEqual(200);
        })
        .then(fetchMock.restore);
    });

    test('should remove newlines from header values', () => {
      // Given
      fetchMock.get('*', (url, opts) => ({
        headers: {
          'Content-Type': 'text/plain',
        },
        body: opts.headers.WilliamCWilliamsHeader,
      }));
      const req = {
        url: 'http://example.com',
        method: 'GET',
        headers: {
          WilliamCWilliamsHeader: 'so much depends\nupon\n\na red wheel\nbarrow',
        },
      };

      return http('http://example.com', req)
        .then((response) => {
          expect(response.url).toEqual('http://example.com/');
          expect(response.data.toString()).toEqual('so much depends upon a red wheel barrow');
        })
        .then(fetchMock.restore);
    });
  });

  describe('serializeRes', () => {
    test('should serialize fetch-like response and call serializeHeaders', () => {
      const response = new Response('data', {
        // eslint-disable-line no-undef
        status: 200,
        headers: {
          Authorization: 'Basic hoop-la, Advanced hoop-la',
          'Content-Type': 'text/plain',
        },
      });

      return serializeRes(response, 'https://swagger.io').then((serializedResponse) => {
        expect(serializedResponse.headers).toEqual({
          authorization: ['Basic hoop-la', 'Advanced hoop-la'],
          'content-type': 'text/plain',
        });
      });
    });

    test('should set .text and .data to body Blob or Buffer for binary response', () => {
      const headers = {
        'Content-Type': 'application/octet-stream',
      };

      const body = 'body data';
      fetchMock.mock('http://swagger.io', { body, headers });

      let originalRes;

      return fetch('http://swagger.io')
        .then((_res) => {
          // eslint-disable-line no-undef
          originalRes = _res;
          return serializeRes(_res, 'https://swagger.io');
        })
        .then((resSerialize) => {
          expect(resSerialize.data).toBe(resSerialize.text);
          if (originalRes.blob) {
            expect(Object.prototype.toString.call(resSerialize.data)).toBe('[object Blob]');
          } else {
            expect(resSerialize.data).toBeInstanceOf(Buffer);
            expect(resSerialize.data).toEqual(Buffer.from(body));
          }
        })
        .then(fetchMock.restore);
    });

    test('should set .text and .data to body string for text response', () => {
      const headers = {
        'Content-Type': 'application/json',
      };

      const body = '{}';
      fetchMock.mock('http://swagger.io', { body, headers });

      return fetch('http://swagger.io')
        .then((_res) =>
          // eslint-disable-line no-undef
          serializeRes(_res, 'https://swagger.io')
        )
        .then((resSerialize) => {
          expect(resSerialize.data).toBe(resSerialize.text);
          expect(resSerialize.data).toBe(body);
        })
        .then(fetchMock.restore);
    });
  });

  describe('shouldDownloadAsText', () => {
    test('should return true for json, xml, yaml, and text types', () => {
      const types = [
        'text/x-yaml',
        'application/xml',
        'text/xml',
        'application/json',
        'text/plain',
      ];

      types.forEach((v) => {
        expect(`${v} ${shouldDownloadAsText(v)}`).toEqual(`${v} true`);
      });
    });

    test('should return false for other common types', () => {
      const types = ['application/octet-stream', 'application/x-binary'];

      types.forEach((v) => {
        expect(`${v} ${shouldDownloadAsText(v)}`).toEqual(`${v} false`);
      });
    });

    test('should fail gracefully when called with no parameters', () => {
      expect(shouldDownloadAsText()).toEqual(false);
    });
  });

  describe('isFile', () => {
    const mockBrowserNavigator = {
      product: 'Gecko',
    };
    const mockReactNativeNavigator = {
      product: 'ReactNative',
    };

    const browserFile = new File(['file'], 'file.txt');
    const browserBlob = new Blob(['blob']);
    const reactNativeFileObject = {
      uri: '/mock/path',
    };

    test('should return true for browser File type', () => {
      expect(isFile(browserFile)).toEqual(true);
    });
    test('should return true for browser File type and browser user agent', () => {
      expect(isFile(browserFile, mockBrowserNavigator)).toEqual(true);
    });
    test('should return false for browser File type and React Native user agent', () => {
      expect(isFile(browserFile, mockReactNativeNavigator)).toEqual(false);
    });

    test('should return true for browser Blob type', () => {
      expect(isFile(browserBlob)).toEqual(true);
    });
    test('should return true for browser Blob type and browser user agent', () => {
      expect(isFile(browserBlob, mockBrowserNavigator)).toEqual(true);
    });
    test('should return false for browser Blob type and React Native user agent', () => {
      expect(isFile(browserBlob, mockReactNativeNavigator)).toEqual(false);
    });

    test('should return true for browser Buffer type', () => {
      expect(isFile(Buffer.from([]))).toEqual(true);
    });
    test('should return true for browser Buffer type and browser user agent', () => {
      expect(isFile(Buffer.from([]), mockBrowserNavigator)).toEqual(true);
    });
    test('should return false for browser Buffer type and React Native user agent', () => {
      expect(isFile(Buffer.from([]), mockReactNativeNavigator)).toEqual(false);
    });

    test('should return false for React Native-like file object', () => {
      expect(isFile(reactNativeFileObject)).toEqual(false);
    });
    test('should return false for React Native-like file object and browser user agent', () => {
      expect(isFile(reactNativeFileObject, mockBrowserNavigator)).toEqual(false);
    });
    test('should return true for React Native-like file object and React Native user agent', () => {
      expect(isFile(reactNativeFileObject, mockReactNativeNavigator)).toEqual(true);
    });

    test('should return false for non-File type and browser user agent', () => {
      expect(isFile(undefined, mockBrowserNavigator)).toEqual(false);
      expect(isFile('', mockBrowserNavigator)).toEqual(false);
      expect(isFile(123, mockBrowserNavigator)).toEqual(false);
      expect(isFile([], mockBrowserNavigator)).toEqual(false);
      expect(isFile({}, mockBrowserNavigator)).toEqual(false);
    });

    test('should return false for non-object type and React Native user agent', () => {
      expect(isFile(undefined, mockReactNativeNavigator)).toEqual(false);
      expect(isFile('', mockReactNativeNavigator)).toEqual(false);
      expect(isFile(123, mockReactNativeNavigator)).toEqual(false);
      expect(isFile([], mockReactNativeNavigator)).toEqual(false);
      expect(isFile({}, mockReactNativeNavigator)).toEqual(false);
    });
  });
});
