window.context = window.describe
window.xcontext = window.xdescribe

describe 'Api', ->
  
  describe 'constructor', ->

    describe 'defaults', ->
    
      beforeEach ->
        window.wordnik = new Api()
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
          
    describe 'customization', ->

      beforeEach ->
        window.unicornApi = new Api
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
        window.wordnik = new Api
        wordnik.build()
        waitsFor ->
          wordnik.isReady()
    
      it "fetchs a list of resources", ->
        runs ->
          expect(wordnik.resources.length).toBeGreaterThan(0)
          
      it "sets basePath", ->
        runs ->
          expect(wordnik.basePath).toBe("http://api.wordnik.com/v4")
          
      it "creates named references to its resources", ->
        runs ->
          expect(wordnik.words).toBeDefined()
          
describe 'Resource', ->
  
  beforeEach ->
    window.wordnik = new Api()
    wordnik.build()
    waitsFor ->
      wordnik.isReady()
        
  it "has a url()", ->
    runs ->
      resource = wordnik.resources[0]
      expect(resource.url()).toMatch(/\.json$/)
      
  it "has a name() method which is inferred from its path", ->
    runs ->
      resource = new Resource("/word.{format}", "an imaginary resource", wordnik)
      expect(resource.name()).toEqual('word')
        
  it "creates named references to its operations", ->
    runs ->
      resource = wordnik.word
      expect(resource.getDefinitions).toBeDefined()

describe 'Operation', ->
  
  beforeEach ->
    window.wordnik = new Api()
    wordnik.build()
    waitsFor ->
      wordnik.isReady()
      
  describe "urlFor", ->
    
    describe "path params", ->
    
      beforeEach ->
        runs ->
          window.operation = wordnik.word.getDefinitions
          operation.path = "/my/{foo}/kaboo"
          operation.parameters = [{paramType: 'path', name: 'foo'}]
          window.args = {foo: 'pee'}
    
      it "injects path params into the path", ->
        runs ->
          expect(operation.urlFor(args)).toMatch(/\/pee\/kaboo/)
    
      it "throws an exception if path has unmatched params", ->
        runs ->
          args = {}
          expect(-> operation.urlFor(args) ).toThrow("foo is a required path param.")
    
    describe "API key", ->
      
      beforeEach ->
        runs ->
          # Circumvent path param validation
          wordnik.word.getDefinitions.parameters = {}
    
      it "includes API key in URL if it's present", ->
        runs ->
          wordnik.api_key = 'xyz'
          expect(wordnik.word.getDefinitions.urlFor({})).toMatch(/api_key=xyz/)
    
      it "doesn't include API key in URL if it's null", ->
        runs ->
          wordnik.api_key = null
          expect(wordnik.word.getDefinitions.urlFor({})).not.toMatch(/api_key/)

  describe "run", ->
    
    it "runs", ->
      runs ->
        args = {word: 'flagrant', limit: 3}
        res = null
        wordnik.word.getDefinitions.run args, (response) =>
          res = response
        
        waitsFor ->
          res?

        runs ->        
          expect(res.foo).toBe('bar')