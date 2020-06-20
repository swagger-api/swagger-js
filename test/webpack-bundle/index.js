// eslint-disable-next-line import/no-unresolved
const Swagger = require('./.tmp/swagger-client.js')

describe('webpack build', () => {
  test('should export a function', () => {
    expect(Swagger).toBeInstanceOf(Function)
  })
  test('should export helpers attached to the default export', () => {
    expect(Swagger.http).toBeInstanceOf(Function)
    expect(Swagger.makeHttp).toBeInstanceOf(Function)
    expect(Swagger.resolve).toBeInstanceOf(Function)
    expect(Swagger.resolveSubtree).toBeInstanceOf(Function)
    expect(Swagger.execute).toBeInstanceOf(Function)
    expect(Swagger.serializeRes).toBeInstanceOf(Function)
    expect(Swagger.serializeHeaders).toBeInstanceOf(Function)
    expect(Swagger.clearCache).toBeInstanceOf(Function)
    expect(Swagger.makeApisTagOperation).toBeInstanceOf(Function)
    expect(Swagger.buildRequest).toBeInstanceOf(Function)
    expect(Object.keys(Swagger.helpers)).toContain('opId')
    expect(Swagger.getBaseUrl).toBeInstanceOf(Function)
  })

  test('should be able to resolve things when minified', () => {
    const spec = {
      a: {
        $ref: '#/b'
      },
      b: {
        value: {
          $ref: '#/c/value'
        }
      },
      c: {
        value: 1234
      }
    }

    return Swagger.resolve({
      spec,
      allowMetaPatches: false
    }).then((res) => {
      expect(res.errors).toEqual([])
      expect(res.spec).toEqual({
        a: {
          value: 1234
        },
        b: {
          value: 1234
        },
        c: {
          value: 1234
        },
      })
    })
  })
})
