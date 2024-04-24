import '../helpers/fetch-polyfill.node.js';
import { serializeRequest } from './serializers/request/index.js';
import { serializeResponse } from './serializers/response/index.js';

export { serializeResponse as serializeRes };

// Handles fetch-like syntax and the case where there is only one object passed-in
// (which will have the URL as a property). Also serializes the response.
export default async function http(url, request = {}) {
  if (typeof url === 'object') {
    request = url;
    url = request.url;
  }

  request.headers = request.headers || {};

  // Serializes query, for convenience
  // Should be the last thing we do, as its hard to mutate the URL with
  // the search string, but much easier to manipulate the req.query object
  request = serializeRequest(request);

  // Newlines in header values cause weird error messages from `window.fetch`,
  // so let's message them out.
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

  /**
   *  For content-type=multipart/form-data remove content-type from request before fetch,
   *  so that correct one with `boundary` is set when request body is different from boundary encoded string.
   */
  const contentType = request.headers['content-type'] || request.headers['Content-Type'];
  if (/multipart\/form-data/i.test(contentType)) {
    delete request.headers['content-type'];
    delete request.headers['Content-Type'];
  }

  // eslint-disable-next-line no-undef
  let res;
  try {
    res = await (request.userFetch || fetch)(request.url, request);
    res = await serializeResponse(res, url, request);
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

// Wrap a http function ( there are otherways to do this, consider this deprecated )
export function makeHttp(httpFn, preFetch, postFetch) {
  postFetch = postFetch || ((a) => a);
  preFetch = preFetch || ((a) => a);
  return (req) => {
    if (typeof req === 'string') {
      req = { url: req };
    }
    req = serializeRequest(req);
    req = preFetch(req);
    return postFetch(httpFn(req));
  };
}
