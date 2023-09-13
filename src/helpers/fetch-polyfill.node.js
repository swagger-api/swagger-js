import {
  fetch as fetchU,
  Headers as HeaderU,
  Request as RequestU,
  Response as ResponseU,
  FormData as FormDataU,
  File as FileU,
  Blob as BlobU,
} from './fetch-ponyfill-undici.node.js';
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
  globalThis.fetch = fetchU || fetchNF;
}
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = HeaderU || HeadersNF;
}
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = RequestU || RequestNF;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = ResponseU || ResponseNF;
}
if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = FormDataU || FormDataNF;
}
if (typeof globalThis.File === 'undefined') {
  globalThis.File = FileU || FileNF;
}
if (typeof globalThis.Blob === 'undefined') {
  globalThis.Blob = BlobU || BlobNF;
}
