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

      console.log operation

      responseMessages = operation.responseMessages
      expect(responseMessages).toBeDefined
      expect(responseMessages.length).toBe 2
      expect(responseMessages[0].code).toBe 400
      expect(responseMessages[1].code).toBe 404

    it "gets help() from the get pet operation", ->
      operation = swagger.pet.operations.getPetById
      expect(operation.help()).toBe "* petId (required) - ID of pet that needs to be fetched"

    it "verifies the get pet operation", ->
      operation = swagger.pet.operations.getPetById
      expect(operation.method).toBe "get"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      expect(param.name).toBe "petId"
      expect(param.dataType).toBe "string"
      expect(param.paramType).toBe "path"
      expect(param.description).toBeDefined

    it "verifies the post pet operation", ->
      operation = swagger.pet.operations.addPet
      expect(operation.method).toBe "post"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      expect(param.name).toBe "body"
      expect(param.dataType).toBe "Pet"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined
      expect(param.required).toBe true


    it "verifies the put pet operation", ->
      operation = swagger.pet.operations.updatePet
      expect(operation.method).toBe "put"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      expect(param.name).toBe "body"
      expect(param.dataType).toBe "Pet"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined
      expect(param.required).toBe true

    it "verifies the findByTags operation", ->
      operation = swagger.pet.operations.findPetsByTags
      expect(operation.method).toBe "get"

      parameters = operation.parameters

      expect(parameters).toBeDefined
      expect(parameters.length).toBe 1

      param = parameters[0]
      expect(param.name).toBe "tags"
      expect(param.dataType).toBe "string"
      expect(param.paramType).toBe "query"
      expect(param.description).toBeDefined
      expect(param.required).toBe true
      expect(param.allowMultiple).toBe true

    it "verifies the patch pet operation", ->
      operation = swagger.pet.operations.partialUpdate
      expect(operation.method).toBe "patch"

      produces = operation.produces
      expect(produces.length).toBe 2
      expect(produces[0]).toBe "application/json"
      expect(produces[1]).toBe "application/xml"

      parameters = operation.parameters
      expect(parameters).toBeDefined
      expect(parameters.length).toBe 2

      param = parameters[0]
      expect(param.name).toBe "petId"
      expect(param.dataType).toBe "string"
      expect(param.paramType).toBe "path"
      expect(param.description).toBeDefined

      param = parameters[1]
      expect(param.name).toBe "body"
      expect(param.dataType).toBe "Pet"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined
      expect(param.allowMultiple).toBe false
      expect(param.required).toBe true


    it "verifies the post pet operation with form", ->
      operation = swagger.pet.operations.updatePetWithForm
      expect(operation.method).toBe "post"

      consumes = operation.consumes
      expect(consumes.length).toBe 1
      expect(consumes[0]).toBe "application/x-www-form-urlencoded"

      parameters = operation.parameters
      expect(parameters).toBeDefined
      expect(parameters.length).toBe 3

      param = parameters[0]
      expect(param.name).toBe "petId"
      expect(param.dataType).toBe "string"
      expect(param.paramType).toBe "path"
      expect(param.required).toBe true
      expect(param.description).toBeDefined

      param = parameters[1]
      expect(param.name).toBe "name"
      expect(param.dataType).toBe "string"
      expect(param.paramType).toBe "form"
      expect(param.description).toBeDefined
      expect(param.allowMultiple).toBe false
      expect(param.required).toBe false

      param = parameters[2]
      expect(param.name).toBe "status"
      expect(param.dataType).toBe "string"
      expect(param.paramType).toBe "form"
      expect(param.description).toBeDefined
      expect(param.allowMultiple).toBe false
      expect(param.required).toBe false

    it "verifies a file upload", ->
      operation = swagger.pet.operations.uploadFile
      expect(operation.method).toBe "post"

      consumes = operation.consumes
      expect(consumes.length).toBe 1
      expect(consumes[0]).toBe "multipart/form-data"

      parameters = operation.parameters
      expect(parameters).toBeDefined
      expect(parameters.length).toBe 2

      param = parameters[0]
      expect(param.name).toBe "additionalMetadata"
      expect(param.dataType).toBe "string"
      expect(param.paramType).toBe "form"
      expect(param.required).toBe false
      expect(param.description).toBeDefined

      param = parameters[1]
      expect(param.name).toBe "file"
      expect(param.dataType).toBe "File"
      expect(param.paramType).toBe "body"
      expect(param.description).toBeDefined
      expect(param.allowMultiple).toBe false
      expect(param.required).toBe false

    it "gets help() from the file upload operation", ->
      operation = swagger.pet.operations.uploadFile
      expect(operation.help().trim()).toBe "* additionalMetadata - Additional data to pass to server\n* file - file to upload"
