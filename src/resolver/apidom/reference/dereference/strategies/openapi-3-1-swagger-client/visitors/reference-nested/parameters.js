import { toValue } from '@swagger-api/apidom-core';

import toPath from '../../utils/to-path.js';

class ParameterMacroVisitor {
  parameterMacro;

  options;

  #macroOperation;

  OperationElement = {
    enter: (operationElement) => {
      this.#macroOperation = operationElement;
    },
    leave: () => {
      this.#macroOperation = undefined;
    },
  };

  ParameterElement = {
    leave: (parameterElement, key, parent, path, ancestors) => {
      const pojoOperation = this.#macroOperation ? toValue(this.#macroOperation) : null;
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
  };

  constructor({ parameterMacro, options }) {
    this.parameterMacro = parameterMacro;
    this.options = options;
  }
}

export default ParameterMacroVisitor;
