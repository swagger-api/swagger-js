// we cannot use `node-fetch@3` as it's pure ESM package not compatible with CommonJS
import fetch, { Response, Headers, Request } from 'node-fetch-commonjs';

export { fetch, Response, Headers, Request };
