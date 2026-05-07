import { visit, toValue } from '@swagger-api/apidom-core';
// eslint-disable-next-line camelcase
import { OpenApi3_2Element, getNodeType, keyMap } from '@swagger-api/apidom-ns-openapi-3-2';

import ParameterMacroVisitor from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-2-swagger-client/visitors/parameters.js';

const buildOptions = (errors = []) => ({
  dereference: { dereferenceOpts: { errors } },
});

const applyMacro = (spec, macro, errors = []) => {
  // eslint-disable-next-line camelcase
  const element = OpenApi3_2Element.refract(spec);
  const visitor = new ParameterMacroVisitor({
    parameterMacro: macro,
    options: buildOptions(errors),
  });
  return visit(element, visitor, { keyMap, nodeTypeGetter: getNodeType });
};

describe('dereference', () => {
  describe('strategies', () => {
    describe('openapi-3-2-swagger-client', () => {
      describe('visitors', () => {
        describe('ParameterMacroVisitor', () => {
          describe('given a parameter inside an operation', () => {
            test('should call the macro with the plain operation and parameter objects', () => {
              const calls = [];
              applyMacro(
                {
                  openapi: '3.2.0',
                  paths: {
                    '/pets': {
                      get: {
                        operationId: 'listPets',
                        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
                        responses: { 200: { description: 'OK' } },
                      },
                    },
                  },
                },
                (operation, parameter) => {
                  calls.push({ operation, parameter });
                  return `${operation.operationId}-${parameter.name}`;
                }
              );

              expect(calls).toHaveLength(1);
              expect(calls[0].operation.operationId).toBe('listPets');
              expect(calls[0].parameter.name).toBe('limit');
            });

            test('should set the default on the parameter element', () => {
              const result = applyMacro(
                {
                  openapi: '3.2.0',
                  paths: {
                    '/pets': {
                      get: {
                        operationId: 'listPets',
                        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
                        responses: { 200: { description: 'OK' } },
                      },
                    },
                  },
                },
                (operation, parameter) => `${operation.operationId}-${parameter.name}`
              );

              const param = toValue(result).paths['/pets'].get.parameters[0];
              expect(param.default).toBe('listPets-limit');
            });
          });

          describe('given a parameter outside of any operation (path-level)', () => {
            test('should call the macro with null as the operation', () => {
              const calls = [];
              applyMacro(
                {
                  openapi: '3.2.0',
                  paths: {
                    '/pets': {
                      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
                    },
                  },
                },
                (operation, parameter) => {
                  calls.push({ operation, parameter });
                  return `${String(operation)}-${parameter.name}`;
                }
              );

              expect(calls).toHaveLength(1);
              expect(calls[0].operation).toBeNull();
              expect(calls[0].parameter.name).toBe('limit');
            });
          });

          describe('given the macro throws an error', () => {
            test('should collect error with fullPath pointing to the parameters array', () => {
              const errors = [];

              applyMacro(
                {
                  openapi: '3.2.0',
                  paths: {
                    '/pets': {
                      get: {
                        operationId: 'listPets',
                        parameters: [{ name: 'limit', in: 'query' }],
                        responses: { 200: { description: 'OK' } },
                      },
                    },
                  },
                },
                () => {
                  throw new Error('macro exploded');
                },
                errors
              );

              expect(errors).toHaveLength(1);
              expect(errors[0]).toMatchObject({
                message: expect.stringMatching(/macro exploded/),
                fullPath: ['paths', '/pets', 'get', 'parameters'],
              });
            });

            test('should leave the parameter unchanged when the macro throws', () => {
              const result = applyMacro(
                {
                  openapi: '3.2.0',
                  paths: {
                    '/pets': {
                      get: {
                        operationId: 'listPets',
                        parameters: [{ name: 'limit', in: 'query' }],
                        responses: { 200: { description: 'OK' } },
                      },
                    },
                  },
                },
                () => {
                  throw new Error('macro exploded');
                }
              );

              const param = toValue(result).paths['/pets'].get.parameters[0];
              expect(param).not.toHaveProperty('default');
            });
          });

          describe('given multiple operations with parameters', () => {
            test('should call the macro once per parameter and clear operation context between operations', () => {
              const calls = [];
              applyMacro(
                {
                  openapi: '3.2.0',
                  paths: {
                    '/pets': {
                      get: {
                        operationId: 'listPets',
                        parameters: [{ name: 'limit', in: 'query' }],
                        responses: { 200: { description: 'OK' } },
                      },
                      post: {
                        operationId: 'createPet',
                        parameters: [{ name: 'dryRun', in: 'query' }],
                        responses: { 201: { description: 'Created' } },
                      },
                    },
                  },
                },
                (operation, parameter) => {
                  calls.push({ opId: operation?.operationId ?? null, param: parameter.name });
                  return 'val';
                }
              );

              expect(calls).toHaveLength(2);
              expect(calls[0]).toEqual({ opId: 'listPets', param: 'limit' });
              expect(calls[1]).toEqual({ opId: 'createPet', param: 'dryRun' });
            });
          });
        });
      });
    });
  });
});
