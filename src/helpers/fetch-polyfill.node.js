import {
  fetch as fetchNF,
  Headers as HeadersNF,
  Request as RequestNF,
  Response as ResponseNF,
  FormData as FormDataNF,
  File as FileNF,
  Blob as BlobNF,
} from './fetch-ponyfill-node-fetch.node.js';

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = fetchNF;
}
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = HeadersNF;
}
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = RequestNF;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = ResponseNF;
}
if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = FormDataNF;
}
if (typeof globalThis.File === 'undefined') {
  globalThis.File = FileNF;
}
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = BlobNF;
}
