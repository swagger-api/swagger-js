/* eslint-disable camelcase */
import { createNamespace, visit, mergeAllVisitors, cloneDeep } from '@swagger-api/apidom-core';
import { ReferenceSet, Reference } from '@swagger-api/apidom-reference/configuration/empty';
import OpenAPI3_1DereferenceStrategy from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1';
import openApi3_1Namespace, { getNodeType, keyMap } from '@swagger-api/apidom-ns-openapi-3-1';

import OpenAPI3_1SwaggerClientDereferenceVisitor from './visitors/dereference.js';
import ParameterMacroVisitor from './visitors/parameters.js';
import ModelPropertyMacroVisitor from './visitors/properties.js';
import AllOfVisitor from './visitors/all-of.js';

const visitAsync = visit[Symbol.for('nodejs.util.promisify.custom')];
const mergeAllVisitorsAsync = mergeAllVisitors[Symbol.for('nodejs.util.promisify.custom')];

class OpenAPI3_1SwaggerClientDereferenceStrategy extends OpenAPI3_1DereferenceStrategy {
  allowMetaPatches;

  parameterMacro;

  modelPropertyMacro;

  mode;

  ancestors;

  constructor({
    allowMetaPatches = false,
    parameterMacro = null,
    modelPropertyMacro = null,
    mode = 'non-strict',
    ancestors = [],
    ...rest
  } = {}) {
    super({ ...rest });

    this.name = 'openapi-3-1-swagger-client';
    this.allowMetaPatches = allowMetaPatches;
    this.parameterMacro = parameterMacro;
    this.modelPropertyMacro = modelPropertyMacro;
    this.mode = mode;
    this.ancestors = [...ancestors];
  }

  async dereference(file, options) {
    const visitors = [];
    const namespace = createNamespace(openApi3_1Namespace);
    const immutableRefSet = options.dereference.refSet ?? new ReferenceSet();
    const mutableRefsSet = new ReferenceSet();
    let refSet = immutableRefSet;
    let reference;

    if (!immutableRefSet.has(file.uri)) {
      reference = new Reference({ uri: file.uri, value: file.parseResult });
      immutableRefSet.add(reference);
    } else {
      // pre-computed refSet was provided as configuration option
      reference = immutableRefSet.find((ref) => ref.uri === file.uri);
    }

    /**
     * Clone refSet due the dereferencing process being mutable.
     * We don't want to mutate the original refSet and the references.
     */
    if (options.dereference.immutable) {
      immutableRefSet.refs
        .map(
          (ref) =>
            new Reference({
              ...ref,
              value: cloneDeep(ref.value),
            })
        )
        .forEach((ref) => mutableRefsSet.add(ref));
      reference = mutableRefsSet.find((ref) => ref.uri === file.uri);
      refSet = mutableRefsSet;
    }

    // create main dereference visitor
    const dereferenceVisitor = new OpenAPI3_1SwaggerClientDereferenceVisitor({
      reference,
      namespace,
      options,
      allowMetaPatches: this.allowMetaPatches,
      ancestors: this.ancestors,
      parameterMacro: this.parameterMacro,
      modelPropertyMacro: this.modelPropertyMacro,
      mode: this.mode,
    });
    visitors.push(dereferenceVisitor);

    // create parameter macro visitor (if necessary)
    if (typeof this.parameterMacro === 'function') {
      const parameterMacroVisitor = new ParameterMacroVisitor({
        parameterMacro: this.parameterMacro,
        options,
      });
      visitors.push(parameterMacroVisitor);
    }

    // create model property macro visitor (if necessary)
    if (typeof this.modelPropertyMacro === 'function') {
      const modelPropertyMacroVisitor = new ModelPropertyMacroVisitor({
        modelPropertyMacro: this.modelPropertyMacro,
        options,
      });
      visitors.push(modelPropertyMacroVisitor);
    }

    // create allOf visitor (if necessary)
    if (this.mode !== 'strict') {
      const allOfVisitor = new AllOfVisitor({ options });
      visitors.push(allOfVisitor);
    }

    // establish root visitor by visitor merging
    const rootVisitor = mergeAllVisitorsAsync(visitors, { nodeTypeGetter: getNodeType });

    const dereferencedElement = await visitAsync(refSet.rootRef.value, rootVisitor, {
      keyMap,
      nodeTypeGetter: getNodeType,
    });

    /**
     * If immutable option is set, replay refs from the refSet.
     */
    if (options.dereference.immutable) {
      mutableRefsSet.refs
        .filter((ref) => ref.uri.startsWith('immutable://'))
        .map(
          (ref) =>
            new Reference({
              ...ref,
              uri: ref.uri.replace(/^immutable:\/\//, ''),
            })
        )
        .forEach((ref) => immutableRefSet.add(ref));
    }

    /**
     * Release all memory if this refSet was not provided as an configuration option.
     * If provided as configuration option, then provider is responsible for cleanup.
     */
    if (options.dereference.refSet === null) {
      immutableRefSet.clean();
    }

    mutableRefsSet.clean();

    return dereferencedElement;
  }
}

export default OpenAPI3_1SwaggerClientDereferenceStrategy;
/* eslint-enable camelcase */
