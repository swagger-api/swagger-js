import { fetch, Headers, Request, Response } from './fetch-ponyfill.browser.js';

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch;
}
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = Headers;
}
if (typeof globalThis.Request === 'undefined') {
  globalThis.Headers = Request;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Headers = Response;
}
