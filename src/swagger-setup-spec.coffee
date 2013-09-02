describe 'Swagger setup', ->
  describe "verifies the swagger setup process", ->
    it "ensures success called only once", ->
      window.swaggerCounter = 0

      verify = ->
        window.swaggerCounter = window.swaggerCounter + 1
        expect(window.swaggerCounter).toBe 1

      window.authorizations.add "key", new ApiKeyAuthorization("api_key", "special-key", "header")
      window.swagger = new SwaggerApi({url: 'http://petstore.swagger.wordnik.com/api/api-docs', success: verify})

      waitsFor ->
        swagger.ready?
