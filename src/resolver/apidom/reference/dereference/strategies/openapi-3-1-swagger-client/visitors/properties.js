import { isObjectElement, toValue } from '@swagger-api/apidom-core';

import compose from '../utils/compose.js';
import toPath from '../utils/to-path.js';

const ModelPropertyMacroVisitor = compose({
  init({ modelPropertyMacro, options }) {
    this.modelPropertyMacro = modelPropertyMacro;
    this.options = options;
  },
  props: {
    modelPropertyMacro: null,
    options: null,
    SchemaElement: {
      leave(schemaElement, key, parent, path, ancestors) {
        if (typeof schemaElement.properties === 'undefined') return;
        if (!isObjectElement(schemaElement.properties)) return;

        schemaElement.properties.forEach((property) => {
          if (!isObjectElement(property)) return;

          try {
            const macroValue = this.modelPropertyMacro(toValue(property));
            property.set('default', macroValue);
          } catch (error) {
            const macroError = new Error(error, { cause: error });
            macroError.fullPath = [...toPath([...ancestors, parent, schemaElement]), 'properties'];
            this.options.dereference.dereferenceOpts?.errors?.push?.(macroError);
          }
        });
      },
    },
  },
});

export default ModelPropertyMacroVisitor;
