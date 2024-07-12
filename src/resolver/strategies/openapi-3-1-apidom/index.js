import { isElement } from '@swagger-api/apidom-core';

import resolveOpenAPI31Strategy from './resolve.js';
import normalize, { pojoAdapter } from './normalize.js';
import { isOpenAPI31 } from '../../../helpers/openapi-predicates.js';

const openApi31ApiDOMStrategy = {
  name: 'openapi-3-1-apidom',
  match(spec) {
    return isOpenAPI31(spec);
  },
  normalize(spec) {
    /**
     * We need to perform pre-normalization only once before the first lazy dereference.
     * We always need to perform post-normalization after every lazy dereference.
     */
    if (isElement(spec)) {
      // post-normalization - happens after the dereferencing and in ApiDOM context
      return normalize(spec);
    }
    // pre-normalization - happens only once before the first lazy dereferencing and in JavaScript context
    return spec?.$$normalized ? spec : pojoAdapter(normalize)(spec);
  },
  async resolve(options) {
    return resolveOpenAPI31Strategy(options);
  },
};
export default openApi31ApiDOMStrategy;
