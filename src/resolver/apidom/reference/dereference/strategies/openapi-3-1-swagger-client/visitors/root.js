import { mergeAllVisitors } from '@swagger-api/apidom-core';
import { getNodeType } from '@swagger-api/apidom-ns-openapi-3-1';

import ModelPropertyMacroVisitor from './properties.js';
import AllOfVisitor from './all-of.js';
import ParameterMacroVisitor from './parameters.js';
import OpenAPI3_1SwaggerClientDereferenceVisitor from './dereference.js'; // eslint-disable-line camelcase

const mergeAllVisitorsAsync = mergeAllVisitors[Symbol.for('nodejs.util.promisify.custom')];

class RootVisitor {
  constructor({ parameterMacro, modelPropertyMacro, mode, options, ...rest }) {
    const visitors = [];

    visitors.push(
      new OpenAPI3_1SwaggerClientDereferenceVisitor({
        ...rest,
        options,
      })
    );

    if (typeof modelPropertyMacro === 'function') {
      visitors.push(new ModelPropertyMacroVisitor({ modelPropertyMacro, options }));
    }

    if (mode !== 'strict') {
      visitors.push(new AllOfVisitor({ options }));
    }

    if (typeof parameterMacro === 'function') {
      visitors.push(new ParameterMacroVisitor({ parameterMacro, options }));
    }

    const mergedVisitor = mergeAllVisitorsAsync(visitors, { nodeTypeGetter: getNodeType });
    Object.assign(this, mergedVisitor);
  }
}

export default RootVisitor;
