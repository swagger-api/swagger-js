import { Blob } from 'buffer';
import { fetch, Response, Headers, Request, FormData, File } from 'undici';

const BlobU = typeof fetch === 'undefined' ? undefined : Blob;

export { fetch, Response, Headers, Request, FormData, File, BlobU as Blob };
