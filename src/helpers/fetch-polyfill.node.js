import {
  fetch as fetchU,
  Headers as HeaderU,
  Request as RequestU,
  Response as ResponseU,
} from './fetch-ponyfill-undici.node.js';
import {
  fetch as fetchNF,
  Headers as HeadersNF,
  Request as RequestNF,
  Response as ResponseNF,
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
