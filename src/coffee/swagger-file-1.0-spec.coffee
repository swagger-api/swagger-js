window.api_key = 'special-key'

describe 'Swagger Api Listing for file-based 1.0 spec', ->

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

    it "verifies a 1.0 spec functions can be read from an object", ->
      # this is included in the javascript from the filesystem
      obj = wordnik_1_0_spec

      swagger = new window.SwaggerApi()

      cb = (data) ->
        resourceListing = data
        expect(resourceListing.apisArray.length).toBe 5

        for api in resourceListing.apisArray
          expect(api.basePath).toBe("http://api.wordnik.com/v4")

        wordApi = resourceListing.word
        expect(wordApi.operations).toBeDefined
        expect(wordApi.getAudio).toBeDefined
        expect(wordApi.getDefinitions).toBeDefined
        expect(wordApi.getEtymologies).toBeDefined
        expect(wordApi.getExamples).toBeDefined
        expect(wordApi.getPhrases).toBeDefined
        expect(wordApi.getRelatedWords).toBeDefined
        expect(wordApi.getScrabbleScore).toBeDefined
        expect(wordApi.getTextPronunciations).toBeDefined
        expect(wordApi.getWord).toBeDefined
        expect(wordApi.getWordFrequency).toBeDefined

      swagger.specFromObject(obj, cb)


    it "verifies a 1.0 spec models can be read from an object", ->
      # this is included in the javascript from the filesystem
      obj = wordnik_1_0_spec

      swagger = new window.SwaggerApi()

      cb = (data) ->
        resourceListing = data

        wordApi = resourceListing.word
        models = wordApi.models

        window.foo = wordApi.getWord

      swagger.specFromObject(obj, cb)