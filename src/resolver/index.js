// eslint-disable-next-line camelcase
import resolveOpenAPI2_30Strategy from './strategies/openapi-2--3-0/index.js';
import resolveOpenAPI31Strategy from './strategies/openapi-3-1/index.js';
import { makeFetchJSON } from './utils/index.js';
import * as optionsUtil from './utils/options.js';
import { isOpenAPI31 } from '../helpers/openapi-predicates.js';

const resolve = async (options) => {
  const { spec, requestInterceptor, responseInterceptor } = options;

  const retrievalURI = optionsUtil.retrievalURI(options);
  const httpClient = optionsUtil.httpClient(options);
  const retrievedSpec =
    spec ||
    (await makeFetchJSON(httpClient, { requestInterceptor, responseInterceptor })(retrievalURI));
  const strategyOptions = { ...options, spec: retrievedSpec };

  return isOpenAPI31(retrievedSpec)
    ? resolveOpenAPI31Strategy(strategyOptions)
    : resolveOpenAPI2_30Strategy(strategyOptions);
};

export default resolve;
