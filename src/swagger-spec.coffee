window.context = window.describe
window.xcontext = window.xdescribe

describe 'SwaggeringApi', ->
  
  describe 'initialization', ->

    describe 'defaults', ->
    
      beforeEach ->
        window.wordnik = new SwaggeringApi()      
        waitsFor ->
          wordnik
      
      it "sets the default discoveryUrl to wordnik's production API", ->
        runs ->
          expect(wordnik.discoveryUrl).toBe("http://api.wordnik.com/v4/resources.json")

      it "disables the debugger by default", ->
        runs ->
          expect(wordnik.debug).toBe(false)

      it "sets the default format to JSON", ->
        runs ->
          expect(wordnik.format).toBe('json')

      it "creates an empty container for resources", ->
        runs ->
          expect(wordnik.resources.length).toBe(0)
          
    describe 'customization', ->

      beforeEach ->
        window.unicornApi = new SwaggeringApi
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
        window.wordnik = new SwaggeringApi
        wordnik.build()
        waitsFor ->
          wordnik.isReady()
    
      it "fetchs a list of resources", ->
        runs ->
          expect(wordnik.resources.length).toBeGreaterThan(0)
          
      it "sets basePath", ->
        runs ->
          expect(wordnik.basePath).toBe("http://api.wordnik.com/v4")
          
      # it "creates named references to its resources", ->
      #   runs ->
      #     expect(wordnik.words).toBeDefined()
          
describe 'resource', ->

  describe 'descriptionUrl()', ->
  
    beforeEach ->
      window.wordnik = new SwaggeringApi()
      wordnik.build()
      waitsFor ->
        wordnik.isReady()
        
    it "replaces {format} with json", ->
      runs ->
        resource = wordnik.resources[0]
        expect(resource.descriptionUrl()).toMatch(/\.json$/)
        
    # it "", ->
    #   expect('pending').toEqual('completed') 
