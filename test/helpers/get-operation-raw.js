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
  });
});
