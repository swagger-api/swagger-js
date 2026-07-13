import getOperationRaw from '../../src/helpers/get-operation-raw.js';

describe('helpers', () => {
  describe('getOperationRaw', () => {
    test('should return the operation object, given an explicit operationId', () => {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: { operationId: 'op1' },
          },
        },
      };

      // When
      const op = getOperationRaw(spec, 'op1');

      // Then
      expect(op).toMatchObject({
        operation: spec.paths['/one'].get,
        pathName: '/one',
        method: 'GET',
      });
    });

    test('should return the operation object, given an explicit operationId with special characters', () => {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: { operationId: 'A.Very_Special-operationID!' },
          },
        },
      };

      // When
      const op = getOperationRaw(spec, 'A.Very_Special-operationID!');

      // Then
      expect(op).toMatchObject({
        operation: spec.paths['/one'].get,
        pathName: '/one',
        method: 'GET',
      });
    });

    test('should return null, given an explicit operationId that does not exist', () => {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: { operationId: 'getOne' },
          },
        },
      };

      // When
      const op = getOperationRaw(spec, 'ThisOperationIdDoesNotExist');

      // Then
      expect(op).toEqual(null);
    });

    test('should return the operationObj, given a generated operationId', () => {
      // Given`
      const spec = {
        paths: {
          '/two': {
            get: {
              description: 'an operation',
            },
          },
        },
      };

      // When
      const op = getOperationRaw(spec, 'get_two');

      // Then
      expect(op).toMatchObject({
        operation: spec.paths['/two'].get,
        pathName: '/two',
        method: 'GET',
      });
    });

    test('should return the operationObj, given a generated legacy operationId', () => {
      // Given`
      const spec = {
        paths: {
          '/two': {
            get: {
              description: 'an operation',
            },
          },
        },
      };

      // When
      const op = getOperationRaw(spec, 'get-/two');

      // Then
      expect(op).toMatchObject({
        operation: spec.paths['/two'].get,
        pathName: '/two',
        method: 'GET',
      });
    });

    test('should return the operationObj from OpenAPI 3.2 additionalOperations', () => {
      // Given
      const spec = {
        openapi: '3.2.0',
        paths: {
          '/two': {
            get: {
              description: 'query-filter list operation',
            },
            additionalOperations: {
              LIST: {
                operationId: 'listTwo',
                description: 'body list operation',
              },
              SEARCH: {
                operationId: 'searchTwo',
                description: 'custom search operation',
              },
            },
          },
        },
      };

      // When
      const listOp = getOperationRaw(spec, 'listTwo');
      const searchOp = getOperationRaw(spec, 'searchTwo');

      // Then
      expect(listOp).toMatchObject({
        operation: spec.paths['/two'].additionalOperations.LIST,
        pathName: '/two',
        method: 'LIST',
      });
      expect(searchOp).toMatchObject({
        operation: spec.paths['/two'].additionalOperations.SEARCH,
        pathName: '/two',
        method: 'SEARCH',
      });
    });

    test('should ignore additionalOperations outside OpenAPI 3.2', () => {
      const spec = {
        openapi: '3.1.0',
        paths: {
          '/two': {
            additionalOperations: {
              LIST: { operationId: 'listTwo' },
            },
          },
        },
      };

      expect(getOperationRaw(spec, 'listTwo')).toBeNull();
    });

    test('should ignore inherited additionalOperations', () => {
      const inheritedOperation = { operationId: 'inheritedOperation' };
      const additionalOperations = Object.create({ INHERITED: inheritedOperation });
      additionalOperations.LIST = { operationId: 'listTwo' };
      const spec = {
        openapi: '3.2.0',
        paths: {
          '/two': { additionalOperations },
        },
      };

      expect(getOperationRaw(spec, 'inheritedOperation')).toBeNull();
      expect(getOperationRaw(spec, 'listTwo')).toMatchObject({
        operation: additionalOperations.LIST,
        pathName: '/two',
        method: 'LIST',
      });
    });
  });
});
