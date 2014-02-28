window.api_key = 'special-key'

describe 'Swagger Api Listing for remote 1.2 spec', ->

  beforeEach ->
    success =  ->
      log "success"

  describe "verifies loading a specification", ->
    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies a 1.2 spec can be generated", ->
      url = "http://petstore.swagger.wordnik.com/api/api-docs"
      swagger = new window.SwaggerApi(url)

      cb = (data) ->
        resourceListing = data
        expect(resourceListing).toBeDefined

      swagger.specFromURL(url, cb)

    it "verifies a 1.2 spec has expected apis", ->
      url = "http://petstore.swagger.wordnik.com/api/api-docs"
      swagger = new window.SwaggerApi(url)

      cb = (data) ->
        resourceListing = data
        
        expect(resourceListing.apiDeclarations.length).toBe 3
        for api in resourceListing.apiDeclarations
          expect(api.resourcePath).toBeDefined
          expect(api.apiVersion).toBeDefined
          expect(api.swaggerVersion).toBe('1.2')
          expect(api.basePath).toBe("http://petstore.swagger.wordnik.com/api")
          expect(api.apis).toBeDefined
          expect(api.models).toBeDefined

      swagger.specFromURL(url, cb)
