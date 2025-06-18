import { isPlainObject } from 'ramda-adjunct';
import { isElement } from '@swagger-api/apidom-core';

import resolveOpenAPI31Strategy from './resolve.js';
import normalize, { pojoAdapter } from './normalize.js';
import { isOpenAPI31 } from '../../../helpers/openapi-predicates.js';

const openApi31ApiDOMStrategy = {
  name: 'openapi-3-1-apidom',
  match(spec) {
    return isOpenAPI31(spec);
  },
  normalize(spec, options = {}) {
    // pre-normalization - happens only once before the first lazy dereferencing and in JavaScript context
    if (!isElement(spec) && isPlainObject(spec) && !spec.$$normalized) {
      const preNormalized = pojoAdapter(normalize)(spec);
      preNormalized.$$normalized = true;
      return preNormalized;
    }
    // post-normalization - happens after each dereferencing and in ApiDOM context
    if (isElement(spec)) {
      return normalize(spec, options);
    }

    return spec;
  },
  async resolve(options) {
    return resolveOpenAPI31Strategy(options);
  },
};
export default openApi31ApiDOMStrategy;
