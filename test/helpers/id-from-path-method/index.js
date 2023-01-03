import idFromPathMethod from '../../../src/helpers/id-from-path-method/index.js';

describe('helpers', () => {
  describe('idFromPathMethod', () => {
    test('should return get_one as an operationId', () => {
      const id = idFromPathMethod('/one', 'get');

      expect(id).toEqual('get_one');
    });

    test('should return get_one as an operationId', () => {
      const id = idFromPathMethod('/one', 'get');

      expect(id).toEqual('get_one');
    });

    test('should handle strange paths/methods correctly when in v2 mode', () => {
      const fn = (path, method) =>
        idFromPathMethod(path, method, {
          v2OperationIdCompatibilityMode: true,
        });

      // https://github.com/swagger-api/swagger-js/issues/1269#issue-309070070
      expect(fn('/foo/{bar}/baz', 'get')).toEqual('get_foo_bar_baz');
      expect(fn('/one/{foo}/{bar}', 'get')).toEqual('get_one_foo_bar');
      expect(fn('/one/{bar}/-----{baz}', 'get')).toEqual('get_one_bar_baz');
    });
  });
});
