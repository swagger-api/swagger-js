import resolveOpenAPI31Strategy from './resolve.js';
import normalize, { pojoAdapter } from './normalize.js';
import { isOpenAPI31 } from '../../../helpers/openapi-predicates.js';

const openApi31ApiDOMStrategy = {
  name: 'openapi-3-1-apidom',
  match({ spec }) {
    return isOpenAPI31(spec);
  },
  normalize({ spec }) {
    return pojoAdapter(normalize)(spec);
  },
  async resolve(options) {
    return resolveOpenAPI31Strategy(options);
  },
};
export default openApi31ApiDOMStrategy;
