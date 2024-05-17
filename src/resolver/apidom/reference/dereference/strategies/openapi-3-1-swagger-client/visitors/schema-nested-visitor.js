import { mergeAllVisitors } from '@swagger-api/apidom-core';
import { getNodeType } from '@swagger-api/apidom-ns-openapi-3-1';

import AllOfVisitor from './all-of.js';
import ModelPropertyMacroVisitor from './properties.js';

/**
 * This visitor represents merge of all SchemaElement adjunct nested visitors.
 */
class SchemaNestedVisitor {
  canTraverse = false;

  constructor({ modelPropertyMacro, mode, options }) {
    const visitors = [];

    if (typeof modelPropertyMacro === 'function') {
      visitors.push(new ModelPropertyMacroVisitor({ modelPropertyMacro, options }));
    }

    if (mode !== 'strict') {
      visitors.push(new AllOfVisitor({ options }));
    }

    this.canTraverse = visitors.length > 0;

    const mergedVisitor = mergeAllVisitors(visitors, { nodeTypeGetter: getNodeType });
    Object.assign(this, mergedVisitor);
  }
}

export default SchemaNestedVisitor;
