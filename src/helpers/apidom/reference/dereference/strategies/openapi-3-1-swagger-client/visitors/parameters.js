import { toValue } from '@swagger-api/apidom-core';

const ParameterMacroVisitor = ({ parameterMacro }) => {
  let macroOperation = null;

  return {
    OperationElement: {
      enter(operationElement) {
        macroOperation = operationElement;
      },
      leave() {
        macroOperation = null;
      },
    },
    ParameterElement: {
      leave: (parameterElement) => {
        const pojoOperation = macroOperation === null ? null : toValue(macroOperation);
        const pojoParameter = toValue(parameterElement);
        const defaultValue = parameterMacro(pojoOperation, pojoParameter);

        parameterElement.set('default', defaultValue);
      },
    },
  };
};

export default ParameterMacroVisitor;
