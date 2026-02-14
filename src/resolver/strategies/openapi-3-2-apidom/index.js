import { isPlainObject } from 'ramda-adjunct';
import { isElement } from '@swagger-api/apidom-core';

import resolveOpenAPI32Strategy from './resolve.js';
import normalize, { pojoAdapter } from './normalize.js';
import { isOpenAPI32 } from '../../../helpers/openapi-predicates.js';

const openApi32ApiDOMStrategy = {
  name: 'openapi-3-2-apidom',
  match(spec) {
    return isOpenAPI32(spec);
  },
  normalize(spec) {
    // pre-normalization - happens only once before the first lazy dereferencing and in JavaScript context
    if (!isElement(spec) && isPlainObject(spec) && !spec.$$normalized) {
      const preNormalized = pojoAdapter(normalize)(spec);
      preNormalized.$$normalized = true;
      return preNormalized;
    }
    // post-normalization - happens after each dereferencing and in ApiDOM context
    if (isElement(spec)) {
      return normalize(spec);
    }

    return spec;
  },
  async resolve(options) {
    return resolveOpenAPI32Strategy(options);
  },
};
export default openApi32ApiDOMStrategy;
