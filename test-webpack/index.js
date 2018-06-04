const expect = require('expect')

const Swagger = require('../src')

describe('webpack build', () => {
  it('should export a function', () => {
    expect(Swagger).toBeA(Function)
  })
  it('should export helpers attached to the default export', () => {
    expect(Swagger.http).toBeA(Function)
    expect(Swagger.makeHttp).toBeA(Function)
    expect(Swagger.resolve).toBeA(Function)
    expect(Swagger.resolveSubtree).toBeA(Function)
    expect(Swagger.execute).toBeA(Function)
    expect(Swagger.serializeRes).toBeA(Function)
    expect(Swagger.serializeHeaders).toBeA(Function)
    expect(Swagger.clearCache).toBeA(Function)
    expect(Swagger.makeApisTagOperation).toBeA(Function)
    expect(Swagger.buildRequest).toBeA(Function)
    expect(Swagger.helpers).toIncludeKeys(['opId'])
  })
})
