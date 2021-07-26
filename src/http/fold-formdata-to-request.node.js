import { Readable } from 'stream';
import { Encoder } from 'form-data-encoder';

/**
 * formdata-node works in node-fetch@2.x via form-data-encoder only.
 * FormData instance is converted to Encoder instance which gets converted
 * to Readable Stream.
 *
 * TODO(vladimir.gorej@gmail.com): this can be removed when migrated to node-fetch@3.x
 */
const foldFormDataToRequest = (formdata, request) => {
  const encoder = new Encoder(formdata);
  const readableStream = Readable.from(encoder);

  // get rid of previous headers
  delete request.headers['content-type'];
  delete request.headers['Content-Type'];

  // set computed headers
  request.headers = { ...request.headers, ...encoder.headers };

  // set FormData instance to request for debugging purposes
  request.formdata = formdata;

  // assign readable stream as request body
  request.body = readableStream;
};

export default foldFormDataToRequest;
