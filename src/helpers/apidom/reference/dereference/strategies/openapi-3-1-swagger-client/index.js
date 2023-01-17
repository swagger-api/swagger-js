/* eslint-disable camelcase */
import { createNamespace, visit } from '@swagger-api/apidom-core';
import { ReferenceSet, Reference } from '@swagger-api/apidom-reference/configuration/empty';
import OpenApi3_1DereferenceStrategy from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1';
import openApi3_1Namespace, { getNodeType, keyMap } from '@swagger-api/apidom-ns-openapi-3-1';

import OpenApi3_1SwaggerClientDereferenceVisitor from './visitor.js';

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

      const visitor = OpenApi3_1SwaggerClientDereferenceVisitor({
        reference,
        namespace,
        options,
        useCircularStructures: this.useCircularStructures,
        allowMetaPatches: this.allowMetaPatches,
        parameterMacro: this.parameterMacro,
        modelPropertyMacro: this.modelPropertyMacro,
      });
      const dereferencedElement = await visitAsync(refSet.rootRef.value, visitor, {
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
