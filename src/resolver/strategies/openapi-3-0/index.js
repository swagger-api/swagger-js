import resolveOpenAPI30Strategy from './resolve.js';
import normalize from './normalize.js';
import { isOpenAPI30 } from '../../../helpers/openapi-predicates.js';

export { clearCache } from '../generic/index.js';

const openApi30Strategy = {
  name: 'openapi-3-0',
  match(spec) {
    return isOpenAPI30(spec);
  },
  normalize(spec) {
    const { spec: normalized } = normalize({ spec });
    return normalized;
  },
  async resolve(options) {
    return resolveOpenAPI30Strategy(options);
  },
};
export default openApi30Strategy;
