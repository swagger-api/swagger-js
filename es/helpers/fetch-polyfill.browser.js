import { fetch, Headers, Request, Response, FormData, File, Blob } from './fetch-ponyfill.browser.js';
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetch;
}
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = Headers;
}
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = Request;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = Response;
}
if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = FormData;
}
if (typeof globalThis.File === 'undefined') {
  globalThis.File = File;
}
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = Blob;
}