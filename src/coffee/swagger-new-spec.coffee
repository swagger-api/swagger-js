window.api_key = 'special-key'

describe 'Swagger Api Listing for version 1.2 spec', ->

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

    it "verifies a 1.2 spec can be read from an object", ->
      # this is included in the javascript from the filesystem
      obj = petstore_1_2_spec

      swagger = new window.SwaggerApi()

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

      swagger.specFromObject(obj, cb)

    it "verifies a 1.2 spec can built", ->
      # this is included in the javascript from the filesystem
      obj = petstore_1_2_spec

      swagger = new window.SwaggerApi()

      cb = (data) ->
        api = swagger.process data, swagger
        window.api = api

      swagger.specFromObject(obj, cb)

    it "creates a model signature", ->
      obj = {
        id: "Rat",
        properties: {
          id: {
            type: "integer",
            format: "int64"
          },
          name: {
            type: "string"
          }
        }
      }
      model = new SwaggerModel("Rat", obj)
      sampleObj = model.createJSONSample([])
      expect(sampleObj.id).toBe(0)
      expect(sampleObj.name).toBe("")

    it "creates a model signature", ->
      obj1 = {
        id: "Dog",
        properties: {
          id: {
            type: "integer",
            format: "int64"
          },
          name: {
            type: "string"
          },
          parent: {
            $ref: "Animal"
          }
        }
      }
      obj2 = {
        id: "Animal",
        properties: {
          id: {
            type: "integer",
            format: "int64"
          },
          name: {
            type: "string"
          }
        }
      }
      dog = new SwaggerModel("Dog", obj1)
      animal = new SwaggerModel("Animal", obj2)

      models = {}
      models.Dog = dog
      models.Animal = animal
      dog.setReferencedModels(models)
      animal.setReferencedModels(models)

      sampleObj = dog.createJSONSample([])
      expect(sampleObj.id).toBe(0)
      expect(sampleObj.name).toBe("")
      expect(typeof sampleObj.parent).toBe('object')
      
      parent = sampleObj.parent

      expect(parent.id).toBe(0)
      expect(parent.name).toBe("")