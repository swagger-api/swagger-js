import { visit, toValue } from '@swagger-api/apidom-core';
// eslint-disable-next-line camelcase
import { OpenApi3_2Element, getNodeType, keyMap } from '@swagger-api/apidom-ns-openapi-3-2';

import ModelPropertyMacroVisitor from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-2-swagger-client/visitors/properties.js';

const buildOptions = (errors = []) => ({
  dereference: { dereferenceOpts: { errors } },
});

const applyMacro = (spec, macro, errors = []) => {
  // eslint-disable-next-line camelcase
  const element = OpenApi3_2Element.refract(spec);
  const visitor = new ModelPropertyMacroVisitor({
    modelPropertyMacro: macro,
    options: buildOptions(errors),
  });
  return visit(element, visitor, { keyMap, nodeTypeGetter: getNodeType });
};

describe('dereference', () => {
  describe('strategies', () => {
    describe('openapi-3-2-swagger-client', () => {
      describe('visitors', () => {
        describe('ModelPropertyMacroVisitor', () => {
          describe('given a schema without a properties keyword', () => {
            test('should leave the schema unchanged', () => {
              const spec = {
                openapi: '3.2.0',
                components: { schemas: { User: { type: 'object' } } },
              };
              const result = applyMacro(spec, () => 'default-val');

              expect(toValue(result)).toEqual(spec);
            });
          });

          describe('given a schema with properties as a non-object value', () => {
            test('should leave the schema unchanged', () => {
              const spec = {
                openapi: '3.2.0',
                components: {
                  schemas: { User: { type: 'object', properties: ['not', 'an', 'object'] } },
                },
              };
              const result = applyMacro(spec, () => 'default-val');

              expect(toValue(result)).toEqual(spec);
            });
          });

          describe('given a schema with valid properties', () => {
            test('should call the macro for each property and set the default', () => {
              const result = applyMacro(
                {
                  openapi: '3.2.0',
                  components: {
                    schemas: {
                      User: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer' },
                          name: { type: 'string' },
                        },
                      },
                    },
                  },
                },
                (property) => `${property.type}-default`
              );

              const schema = toValue(result).components.schemas.User;
              expect(schema.properties.id.default).toBe('integer-default');
              expect(schema.properties.name.default).toBe('string-default');
            });
          });

          describe('given a schema where the macro throws an error', () => {
            test('should collect error with fullPath pointing to properties', () => {
              const errors = [];

              applyMacro(
                {
                  openapi: '3.2.0',
                  components: {
                    schemas: {
                      User: {
                        type: 'object',
                        properties: { id: { type: 'integer' } },
                      },
                    },
                  },
                },
                () => {
                  throw new Error('macro failed');
                },
                errors
              );

              expect(errors).toHaveLength(1);
              expect(errors[0]).toMatchObject({
                message: expect.stringMatching(/macro failed/),
                fullPath: ['components', 'schemas', 'User', 'properties'],
              });
            });

            test('should leave the property unchanged when the macro throws', () => {
              const result = applyMacro(
                {
                  openapi: '3.2.0',
                  components: {
                    schemas: {
                      User: {
                        type: 'object',
                        properties: { id: { type: 'integer' } },
                      },
                    },
                  },
                },
                () => {
                  throw new Error('macro failed');
                }
              );

              const prop = toValue(result).components.schemas.User.properties.id;
              expect(prop).not.toHaveProperty('default');
            });
          });
        });
      });
    });
  });
});
