import resolveOpenAPI2Strategy from './resolve.js';
import normalize from './normalize.js';
import { isOpenAPI2 } from '../../../helpers/openapi-predicates.js';
export { clearCache } from '../generic/index.js';
const openApi2Strategy = {
  name: 'openapi-2',
  match(spec) {
    return isOpenAPI2(spec);
  },
  normalize(spec) {
    const {
      spec: normalized
    } = normalize({
      spec
    });
    return normalized;
  },
  async resolve(options) {
    return resolveOpenAPI2Strategy(options);
  }
};
export default openApi2Strategy;