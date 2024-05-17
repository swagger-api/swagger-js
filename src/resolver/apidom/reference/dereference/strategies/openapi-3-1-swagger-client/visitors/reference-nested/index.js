import { mergeAllVisitors } from '@swagger-api/apidom-core';
import { getNodeType } from '@swagger-api/apidom-ns-openapi-3-1';

import ParameterMacroVisitor from './parameters.js';

/**
 * This visitor represents merge of all ReferenceElement adjunct nested visitors.
 */
class Index {
  canTraverse = false;

  constructor({ parameterMacro, options }) {
    const visitors = [];

    if (typeof parameterMacro === 'function') {
      visitors.push(new ParameterMacroVisitor({ parameterMacro, options }));
    }

    this.canTraverse = visitors.length > 0;

    const mergedVisitor = mergeAllVisitors(visitors, { nodeTypeGetter: getNodeType });
    Object.assign(this, mergedVisitor);
  }
}

export default Index;
