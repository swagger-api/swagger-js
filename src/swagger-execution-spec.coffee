window.api_key = 'special-key'

describe 'SwaggerRequest', ->
  
  beforeEach ->
    window.swagger = new SwaggerApi({discoveryUrl: 'http://localhost:8002/api/api-docs?api_key=special-key'})
    swagger.build()
    waitsFor ->
      swagger.ready?

  describe "builds a get request object", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the response messages from the get operation", ->
      operation = swagger.pet.operations.getPetById

      responseMessages = operation.responseMessages
      expect(responseMessages).toBeDefined
      expect(responseMessages.length).toBe 2
      expect(responseMessages[0].code).toBe 400
      expect(responseMessages[1].code).toBe 404
