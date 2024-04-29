import mapSpec, { plugins } from '../../../src/resolver/specmap/index.js';

if (process.env.NODE_LIVETESTS === 'true') {
  describe('Live tests against the internet', () => {
    test('should fetch ponelat/common/1', () => {
      jest.setTimeout(30 * 1000);

      return mapSpec({
        spec: {
          hello: 'josh',
          $ref: 'https://swagger.io/domains/ponelat/common/1#/pathitems/EntityOperations',
        },
        plugins: [plugins.refs],
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: {
            hello: 'josh',
            get: {
              description: 'Returns a pet based on ID',
              summary: 'Find pet by ID',
              responses: {
                default: {
                  description: 'General Error',
                  schema: {
                    required: ['code', 'message'],
                    properties: {
                      code: {
                        type: 'integer',
                        format: 'int32',
                      },
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        });
      });
    });
  });
} else {
  describe('Live tests against the internet', () => {
    test('(skipping test suite; `NODE_LIVETESTS` is not enabled', () => {
      expect(true).toEqual(true);
    });
  });
}
