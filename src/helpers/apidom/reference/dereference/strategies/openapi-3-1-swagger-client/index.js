/* eslint-disable camelcase */
import { createNamespace, visit, mergeAllVisitors } from '@swagger-api/apidom-core';
import { ReferenceSet, Reference } from '@swagger-api/apidom-reference/configuration/empty';
import OpenApi3_1DereferenceStrategy from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1';
import openApi3_1Namespace, { getNodeType, keyMap } from '@swagger-api/apidom-ns-openapi-3-1';

import OpenApi3_1SwaggerClientDereferenceVisitor from './visitors/dereference.js';
import ParameterMacroVisitor from './visitors/parameters.js';
import ModelPropertyMacroVisitor from './visitors/properties.js';

const visitAsync = visit[Symbol.for('nodejs.util.promisify.custom')];

const OpenApi3_1SwaggerClientDereferenceStrategy = OpenApi3_1DereferenceStrategy.compose({
  props: {
    useCircularStructures: true,
    allowMetaPatches: false,
    parameterMacro: null,
    modelPropertyMacro: null,
  },
  init({
    useCircularStructures = this.useCircularStructures,
    allowMetaPatches = this.allowMetaPatches,
    parameterMacro = this.parameterMacro,
    modelPropertyMacro = this.modelPropertyMacro,
  } = {}) {
    this.name = 'openapi-3-1-swagger-client';
    this.useCircularStructures = useCircularStructures;
    this.allowMetaPatches = allowMetaPatches;
    this.parameterMacro = parameterMacro;
    this.modelPropertyMacro = modelPropertyMacro;
  },
  methods: {
    async dereference(file, options) {
      const visitors = [];
      const namespace = createNamespace(openApi3_1Namespace);
      const refSet = options.dereference.refSet ?? ReferenceSet();
      let reference;

      if (!refSet.has(file.uri)) {
        reference = Reference({ uri: file.uri, value: file.parseResult });
        refSet.add(reference);
      } else {
        // pre-computed refSet was provided as configuration option
        reference = refSet.find((ref) => ref.uri === file.uri);
      }

      // create main dereference visitor
      const dereferenceVisitor = OpenApi3_1SwaggerClientDereferenceVisitor({
        reference,
        namespace,
        options,
        useCircularStructures: this.useCircularStructures,
        allowMetaPatches: this.allowMetaPatches,
      });
      visitors.push(dereferenceVisitor);

      // create parameter macro visitor (if necessary)
      if (typeof this.parameterMacro === 'function') {
        const parameterMacroVisitor = ParameterMacroVisitor({
          parameterMacro: this.parameterMacro,
        });
        visitors.push(parameterMacroVisitor);
      }

      // create model property macro visitor (if necessary)
      if (typeof this.modelPropertyMacro === 'function') {
        const modelPropertyMacroVisitor = ModelPropertyMacroVisitor({
          modelPropertyMacro: this.modelPropertyMacro,
        });
        visitors.push(modelPropertyMacroVisitor);
      }

      // determine the root visitor
      const rootVisitor =
        visitors.length === 1
          ? visitors[0]
          : mergeAllVisitors(visitors, { nodeTypeGetter: getNodeType });

      const dereferencedElement = await visitAsync(refSet.rootRef.value, rootVisitor, {
        keyMap,
        nodeTypeGetter: getNodeType,
      });

      /**
       * Release all memory if this refSet was not provided as a configuration option.
       * If provided as configuration option, then provider is responsible for cleanup.
       */
      if (options.dereference.refSet === null) {
        refSet.clean();
      }

      return dereferencedElement;
    },
  },
});

export default OpenApi3_1SwaggerClientDereferenceStrategy;
/* eslint-enable camelcase */
