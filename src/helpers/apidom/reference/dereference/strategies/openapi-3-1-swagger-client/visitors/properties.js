import { isObjectElement, toValue } from '@swagger-api/apidom-core';

const ModelPropertyMacroVisitor = ({ modelPropertyMacro }) => ({
  SchemaElement: {
    leave(schemaElement) {
      if (typeof schemaElement.properties === 'undefined') return;
      if (!isObjectElement(schemaElement.properties)) return;

      schemaElement.properties.forEach((property) => {
        if (!isObjectElement(property)) return;

        property.set('default', modelPropertyMacro(toValue(property)));
      });
    },
  },
});

export default ModelPropertyMacroVisitor;
