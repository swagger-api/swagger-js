// we're targeting browsers that already support fetch API
const {
  fetch,
  Response,
  Headers,
  Request,
  FormData,
  File,
  Blob
} = globalThis;
export { fetch, Response, Headers, Request, FormData, File, Blob };