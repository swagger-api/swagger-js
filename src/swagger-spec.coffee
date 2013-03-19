window.api_key = 'special-key'

describe 'SwaggerApi', ->
  
  describe 'constructor', ->

    describe 'defaults', ->
    
      beforeEach ->
        window.wordnik = new SwaggerApi({discoveryUrl: 'http://petstore.swagger.wordnik.com/api/api-docs.json'})
        waitsFor ->
          wordnik
          
      it "sets the default discoveryUrl to wordnik swagger sandbox", ->
        runs ->
          expect(wordnik.discoveryUrl).toBe("http://petstore.swagger.wordnik.com/api/api-docs.json")

      it "disables the debugger by default", ->
        runs ->
          expect(wordnik.debug).toBe(false)
      
      it "builds right away if a 'success' callback was passed to the initializer", ->
        window.successFunctionCalled = false
        window.sampleApi = new SwaggerApi
          success: ->
            window.successFunctionCalled = true
            
        waitsFor ->
          sampleApi.ready?

        runs ->
          expect(window.successFunctionCalled).toBe(true)
      
    describe 'customization', ->

      beforeEach ->
        window.unicornApi = new SwaggerApi
          discoveryUrl: "http://unicorns.com"
          debug: true
          apiKey: 'stardust'

        waitsFor ->
          unicornApi
    
      it "allows discoveryUrl to be set", ->
        runs ->
          expect(unicornApi.discoveryUrl).toBe("http://unicorns.com?api_key=stardust")
    
      it "allows debugging to be enabled", ->
        runs ->
          expect(unicornApi.debug).toBe(true)
      
      it "converts apiKey to api_key", ->
        runs ->
          expect(unicornApi.api_key).toBe('stardust')
          
  describe 'build', ->
    
      beforeEach ->
        window.wordnik = new SwaggerApi({discoveryUrl: 'http://petstore.swagger.wordnik.com/api/api-docs.json'})
        wordnik.build()
        waitsFor ->
          wordnik.ready?

      it "sets basePath", ->
        runs ->
          expect(wordnik.basePath).toBe("http://petstore.swagger.wordnik.com/api")

      it "creates a container object for its resources, with resource names as keys", ->
        runs ->
          expect(wordnik.apis).toBeDefined()
          expect(wordnik.apis).toBeDefined()
          expect(wordnik.apis.pet).toBeDefined()
          
      it "creates shorthand references to its resources", ->
        runs ->
          expect(wordnik.pet).toBeDefined()
          
  describe 'resourceLevelDiscovery', ->

      beforeEach ->
        window.wordnik = new SwaggerApi({discoveryUrl: 'http://petstore.swagger.wordnik.com/api/api-docs.json/pet'})
        wordnik.build()
        waitsFor ->
          wordnik.ready?

      it "creates a container object for its resource, with resource name as keys", ->
        runs ->
          expect(wordnik.apis).toBeDefined()
          expect(wordnik.apis).toBeDefined()
          expect(wordnik.apis.pet).toBeDefined()

      it "creates shorthand references to its resource", ->
        runs ->
          expect(wordnik.pet).toBeDefined()

describe 'SwaggerResource', ->
  
  beforeEach ->
    window.wordnik = new SwaggerApi({discoveryUrl: 'http://petstore.swagger.wordnik.com/api/api-docs.json'})
    wordnik.build()
    waitsFor ->
      wordnik.ready?

  it "creates a url property", ->
    runs ->
      resource = wordnik.apis.pet
      expect(resource.url).toMatch(/\.json/)
      
  it "has a name property which is inferred from its path", ->
    runs ->
      resource = wordnik.pet
      expect(resource.name).toEqual('pet')

  it "creates a container object for its operations, with operation nicknames as keys", ->
    runs ->
      resource = wordnik.pet
      expect(resource.operations).toBeDefined()
      expect(resource.operationsArray).toBeDefined()
      expect(resource.operations.getPetById).toBeDefined()

  it "creates named functions that map to its operations", ->
    runs ->
      expect(wordnik.pet.getPetById).toBeDefined()

describe 'SwaggerOperation', ->
  
  beforeEach ->
    window.wordnik = new SwaggerApi({discoveryUrl: 'http://petstore.swagger.wordnik.com/api/api-docs.json'})
    wordnik.api_key = window.api_key
    wordnik.build()
    waitsFor ->
      wordnik.ready?

  describe "urlify", ->

    beforeEach ->
      window.operation = wordnik.apis.pet.operations.getPetById
      operation.path = "/my.{format}/{foo}/kaboo"
      operation.parameters = [{paramType: 'path', name: 'foo'}]
      window.args = {foo: 'pee'}
    
    it "verifies notes", ->
      runs ->
        expect(operation.notes).toMatch(/^Returns a pet/)?

    it "automatically converts {format} to json", ->
      runs ->
        expect(operation.urlify(args)).toMatch(/my\.json/) 

    it "injects path arguments into the path", ->
      runs ->
        expect(operation.urlify(args)).toMatch(/\/pee\/kaboo/)

    it "throws an exception if path has unmatched arguments", ->
      runs ->
        args = {}
        expect(-> operation.urlify(args) ).toThrow("foo is a required path param.")

  describe "do", ->

    beforeEach ->
      window.args =
        tags: 'tag1'
        limit: 2
      window.response = null

    it "gets back a list of pets", ->
      wordnik.pet.findPetsByTags args, (response) ->
        window.response = response

      waitsFor ->
        response?

      runs ->
        expect(response.length).toBeGreaterThan(0)
        expect(response[0].name).toBeDefined()
        expect(response[0].id).toBeDefined()
        expect(response[0].tags).toBeDefined()

    it "pulls request headers out of the args object", ->
      args.headers = 
        'head-cheese': 'certainly'
      window.request = wordnik.pet.findPetsByTags args, (response) ->
        window.response = response
      
      waitsFor ->
        response?

      runs ->
        expect(request.headers).toBeDefined()
        expect(request.headers['head-cheese']).toBeDefined()
    
    it "pulls request body out of the args object", ->
      args.body = 
        'name': 'haute couture'
        'pronunciation': 'hottie cooter-otty'
      window.request = wordnik.pet.findPetsByTags args, (response) ->
        window.response = response
      
      waitsFor ->
        response?
      
      runs ->
        expect(request.body).toBeDefined()
        expect(request.body.name).toMatch(/haute/)
        expect(request.body.pronunciation).toMatch(/cooter/)

  describe 'constructor', ->

    beforeEach ->
      resource =
        name: 'hello hello'
        models: {}
      window.construct = (c0nstructor, args) ->
        F = -> c0nstructor.apply(this, args)
        F.prototype = c0nstructor.prototype
        new F()

      window.defaultParams = ['nickname', '/path', 'GET',[], 'This is a summary', 'Some notes', '', [], resource, []]
    
    it 'must have a nickname set', ->
      expect(operation).toBeDefined()
      noNicknameParams = defaultParams
      noNicknameParams[0] = undefined
      expect( -> construct SwaggerOperation, noNicknameParams).toThrow()

    it 'must not fail if supportedContentTypes is not set', ->
      expect(operation).toBeDefined()
      expect(operation.supportedContentTypes).toBeUndefined()
                        
describe 'SwaggerRequest', ->
  
  beforeEach ->
    window.wordnik2 = new SwaggerApi({discoveryUrl: 'http://petstore.swagger.wordnik.com/api/api-docs.json'})
    wordnik2.build()
    waitsFor ->
      wordnik2.ready?

  describe "constructor", ->

    beforeEach ->
      window.headers =
        'api_key': 'magic'
        'mock': 'true' # SwaggerRequest won't run if mock header is present
      window.body = null
      window.callback = ->
        'mock callback'
      window.error = ->
          'mock error'
      window.operation = wordnik2.pet.operations.getPetById
      window.request = new SwaggerRequest("GET", "http://google.com", headers, body, callback, error, operation)

    it "sticks the API key into the headers, if present in the parent Api configuration", ->
      window.args =
        petId: '1'
    
      runs ->
        expect(request.headers.api_key).toMatch(/magic/)

  it "exposes an asCurl() method", ->
    curl = request.asCurl()
    expect(curl).toMatch(/--header \"api_key: magic\"/)

  it "supports an error callback", ->
    window.error_message = null
    success = ->
      window.error_message = "success"
    failure = ->
      window.error_message = "error"
    window.request = new SwaggerRequest("GET", "http://google.com/foo", {}, {}, success, failure, window.operation)
        
    waitsFor ->
      error_message?
    
    runs ->
      expect(error_message).toBe("error")

describe 'Crud Methods', ->
  window.random = Math.floor(Math.random()*1000000)

  beforeEach ->
    window.petstore = new SwaggerApi({discoveryUrl: 'http://petstore.swagger.wordnik.com/api/api-docs.json', api_key: 'special-key'})
    petstore.build()
    waitsFor ->
      petstore.ready?

   it "supports POST requests", ->
     args = body : {
       id: "#{random}"
       name: "pet-#{random}"
       status: "available"}

     petstore.pet.addPet args, (response) ->
       window.response = response
      
     waitsFor ->
       response?
        
     runs ->
       expect(response).toBeDefined()

   it "supports PUT requests", ->
     args = body : {
       id: "#{random}"
       name: "a nice pet-#{random}"
       status: "available"}

     petstore.pet.updatePet args, (response) ->
       window.response = response
      
     waitsFor ->
       response?

     runs ->
       expect(response).toBeDefined()
