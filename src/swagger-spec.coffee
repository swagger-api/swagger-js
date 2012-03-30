window.api_key = 'a2a73e7b926c924fad7001ca3111acd55af2ffabf50eb4ae5'

describe 'SwaggerApi', ->
  
  describe 'constructor', ->

    describe 'defaults', ->
    
      beforeEach ->
        window.wordnik = new SwaggerApi
        waitsFor ->
          wordnik
      
      it "sets the default discoveryUrl to wordnik's production API", ->
        runs ->
          expect(wordnik.discoveryUrl).toBe("http://api.wordnik.com/v4/resources.json")

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
          expect(unicornApi.discoveryUrl).toBe("http://unicorns.com")
    
      it "allows debugging to be enabled", ->
        runs ->
          expect(unicornApi.debug).toBe(true)
      
      it "converts apiKey to api_key", ->
        runs ->
          expect(unicornApi.api_key).toBe('stardust')
          
  describe 'build', ->
    
      beforeEach ->
        window.wordnik = new SwaggerApi
        wordnik.build()
        waitsFor ->
          wordnik.ready?
              
      it "sets basePath", ->
        runs ->
          expect(wordnik.basePath).toBe("http://api.wordnik.com/v4")

      it "creates a container object for its resources, with resource names as keys", ->
        runs ->
          expect(wordnik.resources).toBeDefined()
          expect(wordnik.resources.word).toBeDefined()
          
      it "creates shorthand references to its resources", ->
        runs ->
          expect(wordnik.words).toBeDefined()
          
describe 'SwaggerResource', ->
  
  beforeEach ->
    window.wordnik = new SwaggerApi
    wordnik.build()
    waitsFor ->
      wordnik.ready?
        
  it "creates a url property", ->
    runs ->
      resource = wordnik.resources.wordList
      expect(resource.url).toMatch(/\.json$/)
      
  it "has a name property which is inferred from its path", ->
    runs ->
      resource = wordnik.word
      expect(resource.name).toEqual('word')

  it "creates a container object for its operations, with operation nicknames as keys", ->
    runs ->
      resource = wordnik.word
      expect(resource.operations).toBeDefined()
      expect(resource.operations.getExamples).toBeDefined()

  it "creates named functions that map to its operations", ->
    runs ->
      expect(wordnik.word.getDefinitions).toBeDefined()

describe 'SwaggerOperation', ->
  
  beforeEach ->
    window.wordnik = new SwaggerApi
    wordnik.api_key = window.api_key
    wordnik.build()
    waitsFor ->
      wordnik.ready?

  describe "urlify", ->

    beforeEach ->
      window.operation = wordnik.resources.word.operations.getDefinitions
      operation.path = "/my.{format}/{foo}/kaboo"
      operation.parameters = [{paramType: 'path', name: 'foo'}]
      window.args = {foo: 'pee'}

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
        word: 'flagrant'
        limit: 3
      window.response = null

    it "gets back an array of definitions", ->
      wordnik.word.getDefinitions args, (response) ->
        window.response = response
      
      waitsFor ->
        response?

      runs ->
        expect(response.length).toBeGreaterThan(0)
        expect(response[0].word).toBeDefined()
        expect(response[0].text).toBeDefined()
        expect(response[0].partOfSpeech).toBeDefined()
          
    it "pulls request headers out of the args object", ->
      args.headers = 
        'head-cheese': 'certainly'
      window.request = wordnik.word.getDefinitions args, (response) ->
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
      window.request = wordnik.word.getDefinitions args, (response) ->
        window.response = response
      
      waitsFor ->
        response?
      
      runs ->
        expect(request.body).toBeDefined()
        expect(request.body.name).toMatch(/haute/)
        expect(request.body.pronunciation).toMatch(/cooter/)
                        
describe 'SwaggerRequest', ->
  
  beforeEach ->
    window.wordnik2 = new SwaggerApi
    wordnik2.api_key = 'magic'
    wordnik2.build()
    waitsFor ->
      wordnik2.ready?

  describe "constructor", ->

    beforeEach ->
      headers =
        'mock': 'true' # SwaggerRequest won't run if mock header is present
      body = null
      callback = ->
        'mock callback'
      error = ->
          'mock error'
      operation = wordnik2.word.operations.getExamples
      window.request = new SwaggerRequest("GET", "http://google.com", headers, body, callback, error, operation)

    it "sticks the API key into the headers, if present in the parent Api configuration", ->
      runs ->
        expect(request.headers.api_key).toMatch(/magic/)

  it "exposes an asCurl() method", ->
    curl = request.asCurl()
    expect(curl).toMatch(/curl --header \"mock: true\" --header \"api_key: magic\"/)
    
  it "supports POST requests", ->
    window.petstore = new SwaggerApi
      # discoveryUrl: "http://petstore.swagger.wordnik.com/api/resources.json"
      discoveryUrl: "http://chorus-dev.nik.io/api/resources.json"
      success: ->
        
        # Use a random suffix to pass uniqueness validations.
        window.random = Math.floor(Math.random()*1000000)
        
        userParts = 
          username: "kareem#{random}"
          # firstName: "Kareem"
          # lastName: "Abdul-Jabbar"
          email: "kareem#{random}@abdul-jabbar.com"
          # phone: "415-123-4567"
          password: "thunderbolt"
          
        # petstore.user.createUser {body: userParts}, (response) ->
        petstore.users.register {body: userParts}, (response) ->
          window.user = response

    waitsFor ->
      window.user?
    
    runs ->
      expect(window.user.username).toBe("kareem#{random}")
      
  # it "supports PUT requests", ->
  #       window.chorus = new SwaggerApi
  #         discoveryUrl: "http://chorus-dev.nik.io/api/resources.json"
  #         success: ->
  # 
  #             # Use a random suffix to pass uniqueness validations.
  #             window.random = Math.floor(Math.random()*1000000)
  #                 
  #             siteParts = 
  #               name: name
  #               url : url
  #               description : desc
  # 
  #             window.chorus.sites.createSite { body: siteParts }, (site) ->
  #               updateSiteParts = 
  #                 id: site.id 
  #                 partnerId: site.partnerId
  #                 name: site.name
  #                 url : site.url
  #                 settings: 
  #                   interBlogRecommendations: true
  #                   intraBlogRecommendations: false
  #                         
  #               window.chorus.sites.updateSite {body: updateSiteParts}, (response) ->
  #                 window.site = response
  # 
  #       waitsFor ->
  #         window.site?
  # 
  #       runs ->
  #         expect(window.site.interBlogRecommendations).toBe(true)