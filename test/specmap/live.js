import expect from 'expect'
import mapSpec, {plugins} from '../../src/specmap'

if (process.env.NODE_LIVETESTS === 'true') {
  describe('Live tests against the internet', function () {
    it('should fetch ponelat/common/1', function () {
      this.timeout(30 * 1000)

      return mapSpec({
        spec: {
          hello: 'josh',
          $ref: 'https://swagger.io/domains/ponelat/common/1#/pathitems/EntityOperations'
        },
        plugins: [plugins.refs]
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
                        format: 'int32'
                      },
                      message: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        })
      })
    })
  })
}
