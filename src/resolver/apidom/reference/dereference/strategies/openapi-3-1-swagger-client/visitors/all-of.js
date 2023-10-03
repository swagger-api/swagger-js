import { isArrayElement, deepmerge, cloneDeep, toValue } from '@swagger-api/apidom-core';
import { isSchemaElement, SchemaElement } from '@swagger-api/apidom-ns-openapi-3-1';

import compose from '../utils/compose.js';
import toPath from '../utils/to-path.js';

const AllOfVisitor = compose({
  init({ options }) {
    this.options = options;
  },
  props: {
    options: null,

    SchemaElement: {
      leave(schemaElement, key, parent, path, ancestors) {
        // do nothing
        if (typeof schemaElement.allOf === 'undefined') return undefined;

        // collect error and return if allOf keyword is not an array
        if (!isArrayElement(schemaElement.allOf)) {
          const error = new TypeError('allOf must be an array');
          error.fullPath = [...toPath([...ancestors, parent, schemaElement]), 'allOf'];
          this.options.dereference.dereferenceOpts?.errors?.push?.(error);
          return undefined;
        }

        // remove allOf keyword if empty
        if (schemaElement.allOf.isEmpty) {
          return new SchemaElement(
            schemaElement.content.filter((memberElement) => toValue(memberElement.key) !== 'allOf'),
            cloneDeep(schemaElement.meta),
            cloneDeep(schemaElement.attributes)
          );
        }

        // collect errors if allOf keyword contains anything else than Schema Object
        const includesSchemaElementOnly = schemaElement.allOf.content.every(isSchemaElement);
        if (!includesSchemaElementOnly) {
          const error = new TypeError('Elements in allOf must be objects');
          error.fullPath = [...toPath([...ancestors, parent, schemaElement]), 'allOf'];
          this.options.dereference.dereferenceOpts?.errors?.push?.(error);
          return undefined;
        }

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
  },
});

export default AllOfVisitor;
