"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _ramda = require("ramda");
var _apidomCore = require("@swagger-api/apidom-core");
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-2");
var _toPath = _interopRequireDefault(require("../utils/to-path.js"));
class AllOfVisitor {
  options;
  SchemaElement = {
    leave(schemaElement, key, parent, path, ancestors) {
      // do nothing
      if (typeof schemaElement.allOf === 'undefined') return undefined;

      // collect error and return if allOf keyword is not an array
      if (!(0, _apidomCore.isArrayElement)(schemaElement.allOf)) {
        const error = new TypeError('allOf must be an array');
        error.fullPath = [...(0, _toPath.default)([...ancestors, parent, schemaElement]), 'allOf'];
        this.options.dereference.dereferenceOpts?.errors?.push?.(error);
        return undefined;
      }

      // remove allOf keyword if empty
      if (schemaElement.allOf.isEmpty) {
        schemaElement.remove('allOf');
        return undefined;
      }

      // collect errors if allOf keyword contains anything else than Schema Object
      const includesSchemaElementOnly = schemaElement.allOf.content.every(_apidomNsOpenapi.isSchemaElement);
      if (!includesSchemaElementOnly) {
        const error = new TypeError('Elements in allOf must be objects');
        error.fullPath = [...(0, _toPath.default)([...ancestors, parent, schemaElement]), 'allOf'];
        this.options.dereference.dereferenceOpts?.errors?.push?.(error);
        return undefined;
      }
      while (schemaElement.hasKey('allOf')) {
        const {
          allOf
        } = schemaElement;
        schemaElement.remove('allOf');
        const allOfMerged = _apidomCore.deepmerge.all([...allOf.content, schemaElement], {
          customMerge: keyElement => {
            if ((0, _apidomCore.toValue)(keyElement) === 'enum') {
              return (targetElement, sourceElement) => {
                if ((0, _apidomCore.includesClasses)(['json-schema-enum'], targetElement) && (0, _apidomCore.includesClasses)(['json-schema-enum'], sourceElement)) {
                  const areElementsEqual = (a, b) => {
                    if ((0, _apidomCore.isArrayElement)(a) || (0, _apidomCore.isArrayElement)(b) || (0, _apidomCore.isObjectElement)(a) || (0, _apidomCore.isObjectElement)(b)) {
                      return false;
                    }
                    return a.equals((0, _apidomCore.toValue)(b));
                  };
                  const clone = (0, _apidomCore.cloneShallow)(targetElement);
                  clone.content = (0, _ramda.uniqWith)(areElementsEqual)([...targetElement.content, ...sourceElement.content]);
                  return clone;
                }
                return (0, _apidomCore.deepmerge)(targetElement, sourceElement);
              };
            }
            return _apidomCore.deepmerge;
          }
        });

        /**
         * If there was not an original $$ref value, make sure to remove
         * any $$ref value that may exist from the result of `allOf` merges.
         */
        if (!schemaElement.hasKey('$$ref')) {
          allOfMerged.remove('$$ref');
        }

        /**
         * If there was an example keyword in the original schema,
         * keep it instead of merging with example from other schema.
         */
        if (schemaElement.hasKey('example')) {
          const member = allOfMerged.getMember('example');
          if (member) {
            member.value = schemaElement.get('example');
          }
        }

        /**
         * If there was an examples keyword in the original schema,
         * keep it instead of merging with examples from other schema.
         */
        if (schemaElement.hasKey('examples')) {
          const member = allOfMerged.getMember('examples');
          if (member) {
            member.value = schemaElement.get('examples');
          }
        }
        schemaElement.content = allOfMerged.content;
      }
      return undefined;
    }
  };
  constructor({
    options
  }) {
    this.options = options;
  }
}
var _default = exports.default = AllOfVisitor;