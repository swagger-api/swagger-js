// eslint-disable-next-line camelcase
import resolveOpenAPI2_30Strategy from './strategies/openapi-2--3-0.js';
import { makeFetchJSON } from './utils/index.js';
import * as optionsUtil from './utils/options.js';

const resolve = async (options) => {
  const { spec, requestInterceptor, responseInterceptor } = options;

  const retrievalURI = optionsUtil.retrievalURI(options);
  const httpClient = optionsUtil.httpClient(options);
  const retrievedSpec =
    spec ||
    (await makeFetchJSON(httpClient, { requestInterceptor, responseInterceptor })(retrievalURI));

  return resolveOpenAPI2_30Strategy({ ...options, spec: retrievedSpec });
};

export default resolve;
