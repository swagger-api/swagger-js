import 'isomorphic-fetch'
import qs from 'qs'
import jsYaml from 'js-yaml'
import assign from 'lodash/assign'
import isString from 'lodash/isString'

// For testing
export const self = {
  serializeRes,
  mergeInQueryOrForm
};

// Handles fetch-like syntax and the case where there is only one object passed-in
// (which will have the URL as a property). Also serilizes the response.
export default function http(arg1, arg2 = {}) {
  let request = arg2;
  if (typeof arg1 === 'object') {
    request = arg1;
  } else {
    request.url = arg1;
  }

  request.headers = request.headers || {};

  // Serializes query, for convenience
  // Should be the last thing we do, as its hard to mutate the URL with
  // the search string, but much easier to manipulate the req.query object
  request = (req => (request.requestInterceptor || (req => req))(req) || req)(
    self.mergeInQueryOrForm(request)
  );

  // for content-type=multipart\/form-data remove content-type from request before fetch
  // so that correct one with `boundary` is set
  if ((request.headers['content-type'] || request.headers['Content-Type'] || "").toLowerCase().includes("multipart/form-data")) {
    delete request.headers['content-type'];
    delete request.headers['Content-Type'];
  }

  return (request.fetch || fetch)(request.url, request).then((res) => {
    const serialized = self
      .serializeRes(res, request.url, request)
      .then((_res) => (request.responseInterceptor || (res => res))(_res) || _res);

    if (!res.ok) {
      const error = new Error(res.statusText);
      error.statusCode = error.status = res.status;
      return serialized.then(
        (_res) => {
          error.response = _res;
          throw error;
        },
        (resError) => {
          error.responseError = resError;
          throw error;
        }
      );
    }

    return serialized;
  });
}

function shouldDownloadAsText(contentType = "") {
  return ["json", "xml", "yaml", "text"].some(str => contentType.includes(str));
}

// Serialize the response, returns a promise with headers and the body part of the hash
export function serializeRes(oriRes, url, { loadSpec = false } = {}) {
  const res = {
    ok: oriRes.ok,
    url: oriRes.url || url,
    status: oriRes.status,
    statusText: oriRes.statusText,
    headers: serializeHeaders(oriRes.headers)
  };

  const useText = loadSpec || shouldDownloadAsText(res.headers['content-type']);

  // Note: Response.blob not implemented in node-fetch 1.  Use buffer instead.
  const getBody = useText ? oriRes.text : (oriRes.blob || oriRes.buffer);

  return getBody.call(oriRes).then((body) => {
    res.text = res.data = body;

    if (useText) {
      try {
        // Optimistically try to convert all bodies
        res.body = res.obj = jsYaml.safeLoad(body);
      } catch (e) {
        res.parseError = e;
      }
    }
    return res;
  });
}

// Serialize headers into a hash, where mutliple-headers result in an array.
//
// eg: Cookie: one
//     Cookie: two
//  =  { Cookie: [ "one", "two" ]
export function serializeHeaders(headers = {}) {
  const obj = {};

  // Iterate over headers, making multiple-headers into an array
  if (typeof headers.forEach === 'function') {
    headers.forEach((headerValue, header) => {
      if (obj[header] !== undefined) {
        obj[header] = Array.isArray(obj[header]) ? obj[header] : [obj[header]];
        obj[header].push(headerValue);
      }
      else {
        obj[header] = headerValue;
      }
    })
    return obj;
  }

  return obj;
}

function isFile(obj) {
  if (typeof File !== 'undefined') {
    return obj instanceof File;
  }
  return obj !== null && typeof obj === 'object' && typeof obj.pipe === 'function';
}

function formatValue({ value, collectionFormat, allowEmptyValue }, skipEncoding) {
  const SEPARATORS = {
    csv: ',',
    ssv: '%20',
    tsv: '%09',
    pipes: '|'
  };

  if (value === undefined && allowEmptyValue) {
    return '';
  }
  if (isFile(value)) {
    return value;
  }

  let encodeFn = encodeURIComponent
  if (skipEncoding) {
    encodeFn = isString(value) ? str => str : obj => JSON.stringify(obj);
  }

  if (value && !Array.isArray(value)) {
    return encodeFn(value);
  }
  if (Array.isArray(value) && !collectionFormat) {
    return value.map(encodeFn).join(',');
  }
  if (collectionFormat === 'multi') {
    return value.map(encodeFn);
  }
  return value.map(encodeFn).join(SEPARATORS[collectionFormat]);
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
    const isObject = a => a && typeof a === 'object';
    const paramValue = data[parameterName];
    const encodedParameterName = encodeURIComponent(parameterName);
    const notArray = isObject(paramValue) && !Array.isArray(paramValue);
    result[encodedParameterName] = formatValue(notArray ? paramValue : { value: paramValue });
    return result;
  }, {});
  return qs.stringify(encodedQuery, { encode: false, indices: false }) || '';
}

// If the request has a `query` object, merge it into the request.url, and delete the object
export function mergeInQueryOrForm(req = {}) {
  const { url = '', query, form } = req;

  const joinSearch = (...strs) => {
    const search = strs.filter(a => a).join('&');
    return search ? `?${search}` : ''; // Only add '?' if there is a str
  };

  if (form) {
    const hasFile = Object.keys(form).some((key) => isFile(form[key].value));
    const isForm = (req.headers['content-type'] || req.headers['Content-Type'] || "").toLowerCase().includes("multipart/form-data");
    if (hasFile || isForm) {
      const FormData = require('isomorphic-form-data'); // eslint-disable-line global-require
      req.body = new FormData();
      Object.keys(form).forEach((key) => {
        req.body.append(key, formatValue(form[key], true));
      });
    } else {
      req.body = encodeFormOrQuery(form);
    }

    delete (req.form);
  }

  if (query) {
    const [baseUrl, oriSearch] = url.split('?');
    let newStr = '';

    if (oriSearch) {
      const oriQuery = qs.parse(oriSearch);
      const keysToRemove = Object.keys(query);
      keysToRemove.forEach(key => delete oriQuery[key]);
      newStr = qs.stringify(oriQuery, { encode: true });
    }

    req.url = baseUrl + joinSearch(newStr, encodeFormOrQuery(query));
    delete (req.query);
  }
  return req;
}

// Wrap a http function ( there are otherways to do this, conisder this deprecated )
export function makeHttp(httpFn, preFetch = a => a, postFetch = a => a) {
  return req => postFetch(
    httpFn(
      preFetch(
        self.mergeInQueryOrForm(typeof req === 'string' ? { url: req } : req)
      )
    )
  );
}
process.on('unhandledRejection', (reason) => {
    console.log(eason);
});