// eslint-disable-next-line camelcase
import normalize from '../../../../src/resolver/strategies/openapi-2/normalize.js';

describe('helpers', () => {
  describe('normalize', () => {
    describe('OpenAPI 2.0 and OpenAPI 3.0.x', () => {
      describe('operationId', () => {
        test('should create unique operationIds when explicit operationIds are duplicates, and preserve originals', () => {
          const input = {
            spec: {
              paths: {
                '/foo': {
                  get: {
                    operationId: 'test',
                  },
                },
                '/bar': {
                  get: {
                    operationId: 'test',
                  },
                },
                '/baz': {
                  get: {
                    operationId: 'test',
                  },
                },
              },
            },
          };

          const res = normalize(input);
          const fooRes = res.spec.paths['/foo'].get;
          const barRes = res.spec.paths['/bar'].get;
          const bazRes = res.spec.paths['/baz'].get;

          // Then
          expect(fooRes.operationId).toEqual('test1');
          expect(barRes.operationId).toEqual('test2');
          expect(bazRes.operationId).toEqual('test3');
          expect(fooRes.__originalOperationId).toEqual('test');
          expect(barRes.__originalOperationId).toEqual('test');
          expect(bazRes.__originalOperationId).toEqual('test');
        });

        test('should add the normalized operation id to the spec, if a non-normalized id exists', () => {
          // Given
          const spec = {
            spec: {
              paths: {
                '/foo': {
                  get: {
                    operationId: 'something with spaces',
                  },
                },
              },
            },
          };

          // When
          const normalizedSpec = normalize(spec);
          const id = normalizedSpec.spec.paths['/foo'].get.operationId;

          // Then
          expect(id).toEqual('something_with_spaces');
        });

        test('should add __originalOperationId for non-duplicate, normal operationIds', () => {
          // Given
          const input = {
            spec: {
              paths: {
                '/foo': {
                  get: {
                    operationId: 'fooOperation',
                  },
                },
                '/bar': {
                  get: {
                    operationId: 'barOperation',
                  },
                },
                '/baz': {
                  get: {
                    operationId: 'bazOperation',
                  },
                },
              },
            },
          };

          // When
          normalize(input);
          const fooOperation = input.spec.paths['/foo'].get;
          const barOperation = input.spec.paths['/bar'].get;
          const bazOperation = input.spec.paths['/baz'].get;

          // Then
          expect(fooOperation.operationId).toEqual('fooOperation');
          expect(fooOperation.__originalOperationId).toEqual('fooOperation');

          expect(barOperation.operationId).toEqual('barOperation');
          expect(barOperation.__originalOperationId).toEqual('barOperation');

          expect(bazOperation.operationId).toEqual('bazOperation');
          expect(bazOperation.__originalOperationId).toEqual('bazOperation');
        });

        test('should add __originalOperationId for non-duplicate, abnormal operationIds', () => {
          // Given
          const input = {
            spec: {
              paths: {
                '/foo': {
                  get: {
                    operationId: 'foo!Operation',
                  },
                },
                '/bar': {
                  get: {
                    operationId: 'bar!Operation',
                  },
                },
                '/baz': {
                  get: {
                    operationId: 'baz!Operation',
                  },
                },
              },
            },
          };

          // When
          normalize(input);
          const fooOperation = input.spec.paths['/foo'].get;
          const barOperation = input.spec.paths['/bar'].get;
          const bazOperation = input.spec.paths['/baz'].get;

          // Then
          expect(fooOperation.operationId).toEqual('foo_Operation');
          expect(fooOperation.__originalOperationId).toEqual('foo!Operation');

          expect(barOperation.operationId).toEqual('bar_Operation');
          expect(barOperation.__originalOperationId).toEqual('bar!Operation');

          expect(bazOperation.operationId).toEqual('baz_Operation');
          expect(bazOperation.__originalOperationId).toEqual('baz!Operation');
        });

        test('should add the original operation id to the spec, if a non-normalized id exists', () => {
          // Given
          const spec = {
            spec: {
              paths: {
                '/foo': {
                  get: {
                    operationId: 'something with spaces',
                  },
                },
              },
            },
          };

          // When
          const normalizedSpec = normalize(spec);
          const originalId = normalizedSpec.spec.paths['/foo'].get.__originalOperationId;

          // Then
          expect(originalId).toEqual('something with spaces');
        });

        test('should not set __originalOperationId when operationId is not defined', () => {
          // Given
          const spec = {
            spec: {
              paths: {
                '/foo': {
                  get: {},
                  post: {
                    operationId: 'myId2',
                  },
                },
              },
            },
          };

          // When
          const normalizedSpec = normalize(spec);
          const fooGet = normalizedSpec.spec.paths['/foo'].get;
          const fooPost = normalizedSpec.spec.paths['/foo'].post;

          // Then
          expect(fooPost.__originalOperationId).toEqual('myId2');
          expect(fooGet.__originalOperationId).toEqual(undefined);
        });

        test('should create unique operationIds when explicit operationIds are effectively the same due to whitespace', () => {
          const spec = {
            spec: {
              paths: {
                '/foo': {
                  get: {
                    operationId: 'test',
                  },
                },
                '/bar': {
                  get: {
                    operationId: 'te st',
                  },
                },
                '/bat': {
                  get: {
                    operationId: 'te/st',
                  },
                },
              },
            },
          };

          const id = normalize(spec);
          const id1 = id.spec.paths['/foo'].get.operationId;
          const id2 = id.spec.paths['/bar'].get.operationId;
          const id3 = id.spec.paths['/bat'].get.operationId;

          // Then
          expect(id1).toEqual('test');
          expect(id2).toEqual('te_st1');
          expect(id3).toEqual('te_st2');
        });
      });
      describe('consumes', () => {
        test('should not overwrite consumes values from the global-level when exists in operation', () => {
          const spec = {
            spec: {
              consumes: ['application/json'],
              paths: {
                '/two': {
                  get: {
                    consumes: ['application/moar-test'],
                  },
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              consumes: ['application/json'],
              paths: {
                '/two': {
                  get: {
                    consumes: ['application/moar-test'],
                  },
                },
              },
            },
          });
        });

        test('should add consumes values from the global-level when no consumes in operation', () => {
          const spec = {
            spec: {
              consumes: ['application/json'],
              paths: {
                '/two': {
                  get: {},
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              consumes: ['application/json'],
              paths: {
                '/two': {
                  get: {
                    consumes: ['application/json'],
                  },
                },
              },
            },
          });
        });
      });

      describe('produces', () => {
        test('should not overwrite produces values from the global-level when exists in operation', () => {
          const spec = {
            spec: {
              produces: ['application/json'],
              paths: {
                '/two': {
                  get: {
                    produces: ['application/moar-test'],
                  },
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              produces: ['application/json'],
              paths: {
                '/two': {
                  get: {
                    produces: ['application/moar-test'],
                  },
                },
              },
            },
          });
        });

        test('should add produces values from the global-level when no produces in operation', () => {
          const spec = {
            spec: {
              produces: ['application/json'],
              paths: {
                '/two': {
                  get: {},
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              produces: ['application/json'],
              paths: {
                '/two': {
                  get: {
                    produces: ['application/json'],
                  },
                },
              },
            },
          });
        });
      });

      describe('security', () => {
        test('should not overwrite security values from the global-level when exists in operation', () => {
          const spec = {
            spec: {
              security: ['test'],
              paths: {
                '/two': {
                  get: {
                    security: ['test1'],
                  },
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              security: ['test'],
              paths: {
                '/two': {
                  get: {
                    security: ['test1'],
                  },
                },
              },
            },
          });
        });

        test('should add security values from the global-level when no security in operation', () => {
          const spec = {
            spec: {
              security: ['test1'],
              paths: {
                '/two': {
                  get: {},
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              security: ['test1'],
              paths: {
                '/two': {
                  get: {
                    security: ['test1'],
                  },
                },
              },
            },
          });
        });
      });

      describe('parameters', () => {
        test('should add parameters from path when no parameters in operation', () => {
          const spec = {
            spec: {
              paths: {
                '/two': {
                  parameters: [{ name: 'a', in: 'path' }],
                  get: {},
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              paths: {
                '/two': {
                  parameters: [{ name: 'a', in: 'path' }],
                  get: {
                    parameters: [{ name: 'a', in: 'path' }],
                  },
                },
              },
            },
          });
        });

        test('should add parameters from path but not override parameters in operation', () => {
          const spec = {
            spec: {
              paths: {
                '/two': {
                  parameters: [
                    { name: 'a', in: 'path' },
                    { name: 'b', in: 'path' },
                  ],
                  get: {
                    parameters: [
                      { name: 'a', in: 'query' },
                      { name: 'c', in: 'query' },
                    ],
                  },
                },
              },
            },
          };

          const resultSpec = normalize(spec);

          expect(resultSpec).toEqual({
            spec: {
              $$normalized: true,
              paths: {
                '/two': {
                  parameters: [
                    { name: 'a', in: 'path' },
                    { name: 'b', in: 'path' },
                  ],
                  get: {
                    parameters: [
                      { name: 'a', in: 'query' },
                      { name: 'c', in: 'query' },
                      { name: 'b', in: 'path' },
                    ],
                  },
                },
              },
            },
          });
        });
      });
    });
  });
});
