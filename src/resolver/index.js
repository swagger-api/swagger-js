import { makeFetchJSON } from './utils/index.js';
import * as optionsUtil from './utils/options.js';
import genericStrategy from './strategies/generic/index.js';
import openApi2Strategy from './strategies/openapi-2/index.js';
import openApi30Strategy from './strategies/openapi-3-0/index.js';

const resolve = async (options) => {
  const { spec, requestInterceptor, responseInterceptor } = options;

  const retrievalURI = optionsUtil.retrievalURI(options);
  const httpClient = optionsUtil.httpClient(options);
  const retrievedSpec =
    spec ||
    (await makeFetchJSON(httpClient, { requestInterceptor, responseInterceptor })(retrievalURI));
  const strategyOptions = { ...options, spec: retrievedSpec };
  const strategies = options.strategies || [openApi30Strategy, openApi2Strategy, genericStrategy];
  const strategy = strategies.find((strg) => strg.match(strategyOptions));

  return strategy.resolve(strategyOptions);
};

export default resolve;
