import 'cross-fetch/polyfill';
import qs from 'qs';
import jsYaml from 'js-yaml';
import { FormData, File, Blob } from 'formdata-node';

import { encodeDisallowedCharacters } from '../execute/oas3/style-serializer.js';
import foldFormDataToRequest from './fold-formdata-to-request.node.js';

// For testing
export const self = {
  serializeRes,
  mergeInQueryOrForm,
};

// Handles fetch-like syntax and the case where there is only one object passed-in
// (which will have the URL as a property). Also serilizes the response.
export default async function http(url, request = {}) {
  if (typeof url === 'object') {
    request = url;
    url = request.url;
  }

  request.headers = request.headers || {};

  // Serializes query, for convenience
  // Should be the last thing we do, as its hard to mutate the URL with
  // the search string, but much easier to manipulate the req.query object
  self.mergeInQueryOrForm(request);

  // Newlines in header values cause weird error messages from `window.fetch`,
  // so let's massage them out.
  // Context: https://stackoverflow.com/a/50709178
  if (request.headers) {
    Object.keys(request.headers).forEach((headerName) => {
      const value = request.headers[headerName];

      if (typeof value === 'string') {
        request.headers[headerName] = value.replace(/\n+/g, ' ');
      }
    });
  }

  // Wait for the request interceptor, if it was provided
  // WARNING: don't put anything between this and the request firing unless
  // you have a good reason!
  if (request.requestInterceptor) {
    request = (await request.requestInterceptor(request)) || request;
  }

  // for content-type=multipart\/form-data remove content-type from request before fetch
  // so that correct one with `boundary` is set when request body is different than boundary encoded string
  const contentType = request.headers['content-type'] || request.headers['Content-Type'];
  // TODO(vladimir.gorej@gmail.com): assertion of FormData instance can be removed when migrated to node-fetch@2.x
  if (/multipart\/form-data/i.test(contentType) && request.body instanceof FormData) {
    delete request.headers['content-type'];
    delete request.headers['Content-Type'];
  }

  // eslint-disable-next-line no-undef
  let res;
  try {
    res = await (request.userFetch || fetch)(request.url, request);
    res = await self.serializeRes(res, url, request);
    if (request.responseInterceptor) {
      res = (await request.responseInterceptor(res)) || res;
    }
  } catch (resError) {
    if (!res) {
      // res is completely absent, so we can't construct our own error
      // so we'll just throw the error we got
      throw resError;
    }
    const error = new Error(res.statusText || `response status is ${res.status}`);
    error.status = res.status;
    error.statusCode = res.status;
    error.responseError = resError;
    throw error;
  }
  if (!res.ok) {
    const error = new Error(res.statusText || `response status is ${res.status}`);
    error.status = res.status;
    error.statusCode = res.status;
    error.response = res;
    throw error;
  }
  return res;
}

// exported for testing
export const shouldDownloadAsText = (contentType = '') =>
  /(json|xml|yaml|text)\b/.test(contentType);

function parseBody(body, contentType) {
  if (
    contentType &&
    (contentType.indexOf('application/json') === 0 || contentType.indexOf('+json') > 0)
  ) {
    return JSON.parse(body);
  }
  return jsYaml.load(body);
}

// Serialize the response, returns a promise with headers and the body part of the hash
export function serializeRes(oriRes, url, { loadSpec = false } = {}) {
  const res = {
    ok: oriRes.ok,
    url: oriRes.url || url,
    status: oriRes.status,
    statusText: oriRes.statusText,
    headers: serializeHeaders(oriRes.headers),
  };
  const contentType = res.headers['content-type'];
  const useText = loadSpec || shouldDownloadAsText(contentType);
  const getBody = useText ? oriRes.text : oriRes.blob || oriRes.buffer;
  return getBody.call(oriRes).then((body) => {
    res.text = body;
    res.data = body;
    if (useText) {
      try {
        const obj = parseBody(body, contentType);
        res.body = obj;
        res.obj = obj;
      } catch (e) {
        res.parseError = e;
      }
    }
    return res;
  });
}

function serializeHeaderValue(value) {
  const isMulti = value.includes(', ');

  return isMulti ? value.split(', ') : value;
}

// Serialize headers into a hash, where mutliple-headers result in an array.
//
// eg: Cookie: one
//     Cookie: two
//  =  { Cookie: [ "one", "two" ]
export function serializeHeaders(headers = {}) {
  if (typeof headers.entries !== 'function') return {};

  return Array.from(headers.entries()).reduce((acc, [header, value]) => {
    acc[header] = serializeHeaderValue(value);
    return acc;
  }, {});
}

export function isFile(obj, navigatorObj) {
  if (!navigatorObj && typeof navigator !== 'undefined') {
    // eslint-disable-next-line no-undef
    navigatorObj = navigator;
  }
  if (navigatorObj && navigatorObj.product === 'ReactNative') {
    if (obj && typeof obj === 'object' && typeof obj.uri === 'string') {
      return true;
    }
    return false;
  }

  if (typeof File !== 'undefined' && obj instanceof File) {
    return true;
  }
  if (typeof Blob !== 'undefined' && obj instanceof Blob) {
    return true;
  }
  if (ArrayBuffer.isView(obj)) {
    return true;
  }

  return obj !== null && typeof obj === 'object' && typeof obj.pipe === 'function';
}

function isArrayOfFile(obj, navigatorObj) {
  return Array.isArray(obj) && obj.some((v) => isFile(v, navigatorObj));
}

const STYLE_SEPARATORS = {
  form: ',',
  spaceDelimited: '%20',
  pipeDelimited: '|',
};

const SEPARATORS = {
  csv: ',',
  ssv: '%20',
  tsv: '%09',
  pipes: '|',
};

/**
 * Specialized sub-class of File class, that only
 * accepts string data and retain this data in `data`
 * public property throughout the lifecycle of its instances.
 *
 * This sub-class is exclusively used only when Encoding Object
 * is defined within the Media Type Object (OpenAPI 3.x.y).
 */
class FileWithData extends File {
  constructor(data, name = '', options = {}) {
    super([data], name, options);
    this.data = data;
  }

  valueOf() {
    return this.data;
  }

  toString() {
    return this.valueOf();
  }
}

// Formats a key-value and returns an array of key-value pairs.
//
// Return value example 1: [['color', 'blue']]
// Return value example 2: [['color', 'blue,black,brown']]
// Return value example 3: [['color', ['blue', 'black', 'brown']]]
// Return value example 4: [['color', 'R,100,G,200,B,150']]
// Return value example 5: [['R', '100'], ['G', '200'], ['B', '150']]
// Return value example 6: [['color[R]', '100'], ['color[G]', '200'], ['color[B]', '150']]
function formatKeyValue(key, input, skipEncoding = false) {
  const { collectionFormat, allowEmptyValue, serializationOption, encoding } = input;
  // `input` can be string
  const value = typeof input === 'object' && !Array.isArray(input) ? input.value : input;
  const encodeFn = skipEncoding ? (k) => k.toString() : (k) => encodeURIComponent(k);
  const encodedKey = encodeFn(key);

  if (typeof value === 'undefined' && allowEmptyValue) {
    return [[encodedKey, '']];
  }

  // file
  if (isFile(value) || isArrayOfFile(value)) {
    return [[encodedKey, value]];
  }

  // for OAS 3 Parameter Object for serialization
  if (serializationOption) {
    return formatKeyValueBySerializationOption(key, value, skipEncoding, serializationOption);
  }

  // for OAS 3 Encoding Object
  if (encoding) {
    if (
      [typeof encoding.style, typeof encoding.explode, typeof encoding.allowReserved].some(
        (type) => type !== 'undefined'
      )
    ) {
      const { style, explode, allowReserved } = encoding;
      return formatKeyValueBySerializationOption(key, value, skipEncoding, {
        style,
        explode,
        allowReserved,
      });
    }

    if (typeof encoding.contentType === 'string') {
      if (encoding.contentType.startsWith('application/json')) {
        // if value is a string, assume value is already a JSON string
        const json = typeof value === 'string' ? value : JSON.stringify(value);
        const encodedJson = encodeFn(json);
        const file = new FileWithData(encodedJson, 'blob', { type: encoding.contentType });

        return [[encodedKey, file]];
      }

      const encodedData = encodeFn(String(value));
      const blob = new FileWithData(encodedData, 'blob', { type: encoding.contentType });

      return [[encodedKey, blob]];
    }

    // Primitive
    if (typeof value !== 'object') {
      return [[encodedKey, encodeFn(value)]];
    }

    // Array of primitives
    if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
      return [[encodedKey, value.map(encodeFn).join(',')]];
    }

    // Array or object
    return [[encodedKey, encodeFn(JSON.stringify(value))]];
  }

  // for OAS 2 Parameter Object
  // Primitive
  if (typeof value !== 'object') {
    return [[encodedKey, encodeFn(value)]];
  }

  // Array
  if (Array.isArray(value)) {
    if (collectionFormat === 'multi') {
      // In case of multipart/formdata, it is used as array.
      // Otherwise, the caller will convert it to a query by qs.stringify.
      return [[encodedKey, value.map(encodeFn)]];
    }

    return [[encodedKey, value.map(encodeFn).join(SEPARATORS[collectionFormat || 'csv'])]];
  }

  // Object
  return [[encodedKey, '']];
}

function formatKeyValueBySerializationOption(key, value, skipEncoding, serializationOption) {
  const style = serializationOption.style || 'form';
  const explode =
    typeof serializationOption.explode === 'undefined'
      ? style === 'form'
      : serializationOption.explode;
  // eslint-disable-next-line no-nested-ternary
  const escape = skipEncoding
    ? false
    : serializationOption && serializationOption.allowReserved
    ? 'unsafe'
    : 'reserved';
  const encodeFn = (v) => encodeDisallowedCharacters(v, { escape });
  const encodeKeyFn = skipEncoding ? (k) => k : (k) => encodeDisallowedCharacters(k, { escape });

  // Primitive
  if (typeof value !== 'object') {
    return [[encodeKeyFn(key), encodeFn(value)]];
  }

  // Array
  if (Array.isArray(value)) {
    if (explode) {
      // In case of multipart/formdata, it is used as array.
      // Otherwise, the caller will convert it to a query by qs.stringify.
      return [[encodeKeyFn(key), value.map(encodeFn)]];
    }
    return [[encodeKeyFn(key), value.map(encodeFn).join(STYLE_SEPARATORS[style])]];
  }

  // Object
  if (style === 'deepObject') {
    return Object.keys(value).map((valueKey) => [
      encodeKeyFn(`${key}[${valueKey}]`),
      encodeFn(value[valueKey]),
    ]);
  }

  if (explode) {
    return Object.keys(value).map((valueKey) => [encodeKeyFn(valueKey), encodeFn(value[valueKey])]);
  }

  return [
    [
      encodeKeyFn(key),
      Object.keys(value)
        .map((valueKey) => [`${encodeKeyFn(valueKey)},${encodeFn(value[valueKey])}`])
        .join(','),
    ],
  ];
}

function buildFormData(reqForm) {
  /**
   * Build a new FormData instance, support array as field value
   * OAS2.0 - when collectionFormat is multi
   * OAS3.0 - when explode of Encoding Object is true
   *
   * This function explicitly handles Buffers (for backward compatibility)
   * if provided as a values to FormData. FormData can only handle USVString
   * or Blob.
   *
   * @param {Object} reqForm - ori req.form
   * @return {FormData} - new FormData instance
   */
  return Object.entries(reqForm).reduce((formData, [name, input]) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of formatKeyValue(name, input, true)) {
      if (Array.isArray(value)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const v of value) {
          if (ArrayBuffer.isView(v)) {
            const blob = new Blob([v]);
            formData.append(key, blob);
          } else {
            formData.append(key, v);
          }
        }
      } else if (ArrayBuffer.isView(value)) {
        const blob = new Blob([value]);
        formData.append(key, blob);
      } else {
        formData.append(key, value);
      }
    }
    return formData;
  }, new FormData());
}

// Encodes an object using appropriate serializer.
export function encodeFormOrQuery(data) {
  /**
   * Encode parameter names and values
   * @param {Object} result - parameter names and values
   * @param {string} parameterName - Parameter name
   * @return {object} encoded parameter names and values
   */
  const encodedQuery = Object.keys(data).reduce((result, parameterName) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of formatKeyValue(parameterName, data[parameterName])) {
      if (value instanceof FileWithData) {
        result[key] = value.valueOf();
      } else {
        result[key] = value;
      }
    }
    return result;
  }, {});

  return qs.stringify(encodedQuery, { encode: false, indices: false }) || '';
}

// If the request has a `query` object, merge it into the request.url, and delete the object
// If file and/or multipart, also create FormData instance
export function mergeInQueryOrForm(req = {}) {
  const { url = '', query, form } = req;
  const joinSearch = (...strs) => {
    const search = strs.filter((a) => a).join('&'); // Only truthy value
    return search ? `?${search}` : ''; // Only add '?' if there is a str
  };

  if (form) {
    const hasFile = Object.keys(form).some((key) => {
      const { value } = form[key];
      return isFile(value) || isArrayOfFile(value);
    });

    const contentType = req.headers['content-type'] || req.headers['Content-Type'];

    if (hasFile || /multipart\/form-data/i.test(contentType)) {
      const formdata = buildFormData(req.form);
      foldFormDataToRequest(formdata, req);
    } else {
      req.body = encodeFormOrQuery(form);
    }

    delete req.form;
  }

  if (query) {
    const [baseUrl, oriSearch] = url.split('?');
    let newStr = '';

    if (oriSearch) {
      const oriQuery = qs.parse(oriSearch);
      const keysToRemove = Object.keys(query);
      keysToRemove.forEach((key) => delete oriQuery[key]);
      newStr = qs.stringify(oriQuery, { encode: true });
    }

    const finalStr = joinSearch(newStr, encodeFormOrQuery(query));
    req.url = baseUrl + finalStr;
    delete req.query;
  }
  return req;
}

// Wrap a http function ( there are otherways to do this, consider this deprecated )
export function makeHttp(httpFn, preFetch, postFetch) {
  postFetch = postFetch || ((a) => a);
  preFetch = preFetch || ((a) => a);
  return (req) => {
    if (typeof req === 'string') {
      req = { url: req };
    }
    self.mergeInQueryOrForm(req);
    req = preFetch(req);
    return postFetch(httpFn(req));
  };
}
