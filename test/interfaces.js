import AbortController from 'abort-controller';

import {
  mapTagOperations,
  makeApisTagOperationsOperationExecute,
  makeApisTagOperation,
  self as stubs,
} from '../src/interfaces.js';

describe('intefaces', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('makeApisTagOperation', () => {
    test('should call mapTagOperations with { spec, cb:Function }', () => {
      // Given
      const spyMapTagOperations = jest.spyOn(stubs, 'mapTagOperations');
      const spec = {};

      // When
      makeApisTagOperation({ spec });

      // Then
      expect(spyMapTagOperations.mock.calls.length).toEqual(1);
      const [arg] = spyMapTagOperations.mock.calls[0];
      expect(arg.spec).toEqual(spec);
      expect(arg.cb).toBeInstanceOf(Function);
    });

    test('should pass the result of makeExecute as `cb` ', () => {
      // Given
      const spyMapTagOperations = jest.spyOn(stubs, 'mapTagOperations');
      const spyExecute = jest.fn();
      makeApisTagOperation({ execute: spyExecute });
      const { cb } = spyMapTagOperations.mock.calls[0][0];

      // When
      const executer = cb({ pathName: '/one', method: 'GET' });
      executer(['param'], { option: 1 });

      // Then
      expect(spyExecute.mock.calls.length).toEqual(1);
      expect(spyExecute.mock.calls[0][0]).toEqual({
        spec: undefined,
        operationId: undefined,
        method: 'GET',
        option: 1,
        parameters: ['param'],
        pathName: '/one',
      });
    });

    test('should expose the apis[tag][operationId]', () => {
      const interfaceValue = makeApisTagOperation({
        spec: {
          paths: {
            '/one': {
              get: {
                tags: ['me'],
                operationId: 'getMe',
              },
              put: { operationId: 'putMe' },
            },
          },
        },
      });

      expect(interfaceValue.apis.me.getMe).toBeInstanceOf(Function);
      expect(interfaceValue.apis.default.putMe).toBeInstanceOf(Function);
    });
  });

  describe('makeApisTagOperationsOperationExecute', () => {
    test('should call mapTagOperations with { spec, cb:Function }', () => {
      // Given
      const spyMapTagOperations = jest.spyOn(stubs, 'mapTagOperations');
      const spec = {};

      // When
      makeApisTagOperationsOperationExecute({ spec });

      // Then
      expect(spyMapTagOperations.mock.calls.length).toEqual(1);
      const [arg] = spyMapTagOperations.mock.calls[0];
      expect(arg.spec).toEqual(spec);
      expect(arg.cb).toBeInstanceOf(Function);
    });

    test('should pass the result of makeExecute as `cb` ', () => {
      // Given
      const spyMapTagOperations = jest.spyOn(stubs, 'mapTagOperations');
      const spyExecute = jest.fn();
      makeApisTagOperationsOperationExecute({ execute: spyExecute });
      const { cb } = spyMapTagOperations.mock.calls[0][0];

      // When
      const executer = cb({ pathName: '/one', method: 'GET' });
      executer(['param'], { option: 1 });

      // Then
      expect(spyExecute.mock.calls.length).toEqual(1);
      expect(spyExecute.mock.calls[0][0]).toEqual({
        spec: undefined,
        operationId: undefined,
        method: 'GET',
        option: 1,
        parameters: ['param'],
        pathName: '/one',
      });
    });

    test('should pass signal option to execute', () => {
      // Given
      const spyMapTagOperations = jest.spyOn(stubs, 'mapTagOperations');
      const spyExecute = jest.fn();
      makeApisTagOperationsOperationExecute({ execute: spyExecute });
      const { cb } = spyMapTagOperations.mock.calls[0][0];

      // When
      const controller = new AbortController();
      const { signal } = controller;
      const executer = cb({ pathName: '/one', method: 'GET' });
      executer(['param'], { signal });

      // Then
      expect(spyExecute.mock.calls.length).toEqual(1);
      expect(spyExecute.mock.calls[0][0]).toEqual({
        spec: undefined,
        operationId: undefined,
        method: 'GET',
        parameters: ['param'],
        pathName: '/one',
        signal,
      });
    });

    test('should map tagOperations to execute', () => {
      const interfaceValue = makeApisTagOperationsOperationExecute({
        spec: {
          paths: {
            '/one': {
              get: {
                tags: ['me'],
                operationId: 'getMe',
              },
              put: { operationId: 'putMe' },
            },
          },
        },
      });

      expect(interfaceValue).toMatchObject({
        apis: {
          default: { operations: {} },
          me: { operations: {} },
        },
      });

      expect(interfaceValue.apis.me.operations.getMe.execute).toBeInstanceOf(Function);
    });
  });

  describe('mapTagOperations', () => {
    test('should give default tag when there is no tag', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              operationId: 'getOne',
            },
          },
        },
      };

      // With
      const tags = mapTagOperations({ spec, defaultTag: 'default' });

      // Then
      expect(tags).toEqual({
        default: {
          getOne: null,
        },
      });
    });

    test('should return a hash of tags: { operationId1, ... }', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne',
            },
          },
        },
      };

      // With
      const tags = mapTagOperations({ spec });

      // Then
      expect(tags).toEqual({
        alpha: {
          getOne: null,
        },
      });
    });

    test('should put the result of the `cb` prop into the operation method', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne',
            },
          },
        },
      };
      const spy = jest.fn().mockImplementation(() => 'hug');

      // With
      const tags = mapTagOperations({ spec, cb: spy });

      // Then
      expect(tags).toEqual({
        alpha: {
          getOne: 'hug',
        },
      });
    });

    test('should call the `cb` prop with the operation object, the spec and the path and the method ', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne',
            },
          },
        },
      };
      const spy = jest.fn();

      // With
      mapTagOperations({ spec, cb: spy });

      // Then
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy.mock.calls[0][0]).toEqual({
        operation: spec.paths.one.get,
        pathName: 'one',
        method: 'GET',
        operationId: 'getOne',
        spec,
      });
    });

    test('should group multiple operations with the same tag', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne',
            },
            post: {
              tags: ['alpha'],
              operationId: 'postOne',
            },
          },
        },
      };

      // With
      const tags = mapTagOperations({ spec });

      // Then
      expect(tags).toEqual({
        alpha: {
          getOne: null,
          postOne: null,
        },
      });
    });

    test('should be able to assign multiple tags', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha', 'beta'],
              operationId: 'getOne',
            },
            post: {
              tags: ['alpha'],
              operationId: 'postOne',
            },
          },
        },
      };

      // With
      const tags = mapTagOperations({ spec });

      // Then
      expect(tags).toEqual({
        alpha: {
          getOne: null,
          postOne: null,
        },
        beta: {
          getOne: null,
        },
      });
    });

    test('should use method + path for ops without an operationId', () => {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: {
              tags: ['alpha'],
            },
          },
        },
      };

      // With
      const tags = mapTagOperations({ spec });

      // Then
      expect(tags).toEqual({
        alpha: {
          get_one: null,
        },
      });
    });

    test('should put untagged operations in `defaultTag`', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              operationId: 'getOne',
            },
          },
        },
      };

      // With
      const tags = mapTagOperations({ spec, defaultTag: 'hug' });

      // Then
      expect(tags).toEqual({
        hug: {
          getOne: null,
        },
      });
    });

    test('should remap duplicate operationId as {operationId}{count} starting at 1', () => {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              operationId: 'getOne',
            },
            put: {
              operationId: 'getOne',
            },
            post: {
              operationId: 'getOne',
            },
          },
        },
      };

      // With
      let count = 1;
      // eslint-disable-next-line no-return-assign, no-plusplus
      const tags = mapTagOperations({ spec, defaultTag: 'hug', cb: () => count++ });

      // Then
      expect(tags).toEqual({
        hug: {
          getOne1: 1,
          getOne2: 2,
          getOne3: 3,
        },
      });
    });
  });
});
