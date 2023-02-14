import { toValue } from '@swagger-api/apidom-core';

import compose from '../utils/compose.js';
import toPath from '../utils/to-path.js';

const ParameterMacroVisitor = compose({
  init({ parameterMacro, options }) {
    this.parameterMacro = parameterMacro;
    this.options = options;
  },
  props: {
    parameterMacro: null,
    options: null,
    macroOperation: null,

    OperationElement: {
      enter(operationElement) {
        this.macroOperation = operationElement;
      },
      leave() {
        this.macroOperation = null;
      },
    },
    ParameterElement: {
      leave(parameterElement, key, parent, path, ancestors) {
        const pojoOperation = this.macroOperation === null ? null : toValue(this.macroOperation);
        const pojoParameter = toValue(parameterElement);

        try {
          const macroValue = this.parameterMacro(pojoOperation, pojoParameter);
          parameterElement.set('default', macroValue);
        } catch (error) {
          const macroError = new Error(error, { cause: error });
          macroError.fullPath = toPath([...ancestors, parent]);
          this.options.dereference.dereferenceOpts?.errors?.push?.(macroError);
        }
      },
    },
  },
});

export default ParameterMacroVisitor;
