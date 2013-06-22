window.api_key = 'special-key'

describe 'SwaggerRequest', ->
  
  beforeEach ->
    window.swagger = new SwaggerApi({discoveryUrl: 'http://localhost:8002/api/api-docs?api_key=special-key'})
    swagger.build()
    waitsFor ->
      swagger.ready?

  describe "verifies the get pet operation", ->

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
      expect (responseMessages).toBeDefined
      expect (responseMessages.length == 2)
      expect (responseMessages[0].code == 400)
      expect (responseMessages[1].code == 404)

    it "gets help() from the pet operation", ->
      operation = swagger.pet.operations.getPetById
      expect (operation.help() == "petId (required) - ID of pet that needs to be fetched")

    it "verifies the get pet operation", ->
      operation = swagger.pet.operations.getPetById
      parameters = operation.parameters

      expect (parameters).toBeDefined
      expect (parameters.length == 1)

      param = parameters[0]
      expect (param.name == "petId")
      expect (param.dataType == "string")
      expect (param.paramType == "path")
      expect (param.description).toBeDefined

    it "verifies the post pet operation", ->
      operation = swagger.pet.operations.addPet
      parameters = operation.parameters

      expect (parameters).toBeDefined
      expect (parameters.length == 1)

      param = parameters[0]
      expect (param.name == "body")
      expect (param.dataType == "Pet")
      expect (param.paramType == "body")
      expect (param.description).toBeDefined
      expect (param.required == true)

      console.log param.responseMessages


    it "verifies the put pet operation", ->
      operation = swagger.pet.operations.updatePet
      parameters = operation.parameters

      expect (parameters).toBeDefined
      expect (parameters.length == 1)

      param = parameters[0]
      expect (param.name == "body")
      expect (param.dataType == "Pet")
      expect (param.paramType == "body")
      expect (param.description).toBeDefined
      expect (param.required == true)

    it "verifies the findByTags operation", ->
      operation = swagger.pet.operations.findPetsByTags
      parameters = operation.parameters

      expect (parameters).toBeDefined
      expect (parameters.length == 1)

      param = parameters[0]
      expect (param.name == "tags")
      expect (param.dataType == "string")
      expect (param.paramType == "query")
      expect (param.description).toBeDefined
      expect (param.required == true)
      expect (param.allowMultiple == true)

    it "verifies the patch pet operation", ->
      operation = swagger.pet.operations.partialUpdate
      parameters = operation.parameters

      expect (parameters).toBeDefined
      expect (parameters.length == 2)

      param = parameters[0]
      expect (param.name == "petId")
      expect (param.dataType == "string")
      expect (param.paramType == "path")
      expect (param.description).toBeDefined

      param = parameters[1]
      expect (param.name == "body")
      expect (param.dataType == "Pet")
      expect (param.paramType == "body")
      expect (param.description).toBeDefined
      expect (param.allowMultiple == false)
      expect (param.required == true)
