import { isArrayElement, deepmerge } from '@swagger-api/apidom-core';
import { isSchemaElement, SchemaElement } from '@swagger-api/apidom-ns-openapi-3-1';

const AllOfVisitor = () => ({
  SchemaElement: {
    leave(schemaElement) {
      // do nothing
      if (typeof schemaElement.allOf === 'undefined') return undefined;
      // throw if allOf keyword is not an array
      if (!isArrayElement(schemaElement.allOf)) {
        throw new TypeError('allOf must be an array');
      }
      // remove allOf keyword if empty
      if (schemaElement.allOf.isEmpty) {
        return new SchemaElement(
          schemaElement.content.filter((memberElement) => memberElement.key.toValue() !== 'allOf'),
          schemaElement.meta.clone(),
          schemaElement.attributes.clone()
        );
      }
      // throw if allOf keyword contains anything else than Schema Object
      schemaElement.allOf.forEach((item) => {
        if (!isSchemaElement(item)) {
          throw new TypeError('Elements in allOf must be objects');
        }
      });

      const mergedSchemaElement = deepmerge.all([...schemaElement.allOf.content, schemaElement]);

      /**
       * If there was not an original $$ref value, make sure to remove
       * any $$ref value that may exist from the result of `allOf` merges.
       */
      if (!schemaElement.hasKey('$$ref')) {
        mergedSchemaElement.remove('$$ref');
      }

      /**
       * If there was an example keyword in the original definition,
       * keep it instead of merging with example from other schema.
       */
      if (schemaElement.hasKey('example')) {
        const member = mergedSchemaElement.getMember('example');
        member.value = schemaElement.get('example');
      }

      /**
       * If there was an examples keyword in the original definition,
       * keep it instead of merging with examples from other schema.
       */
      if (schemaElement.hasKey('examples')) {
        const member = mergedSchemaElement.getMember('examples');
        member.value = schemaElement.get('examples');
      }

      // remove allOf keyword after the merge
      mergedSchemaElement.remove('allOf');
      return mergedSchemaElement;
    },
  },
});

export default AllOfVisitor;
