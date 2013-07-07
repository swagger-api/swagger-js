window.api_key = 'special-key'

describe 'SwaggerRequest', ->
  
  beforeEach ->
    window.swagger = new SwaggerApi({discoveryUrl: 'http://localhost:8002/api/api-docs'})
    swagger.build()
    waitsFor ->
      swagger.ready?

  describe "execute get operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a GET", ->
      params = {
        headers: {}
        petId: 1
        mock: true
      }

      window.response = swagger.pet.getPetById(params, null, null, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "get"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/1")

    it "verifies the http request object for a GET with query params", ->
      params = {
        headers: {}
        status: "available"
        mock: true
      }

      window.response = swagger.pet.findPetsByStatus(params, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "get"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/findByStatus?status=available")

  describe "execute post operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a POST", ->
      params = {
        body: JSON.stringify({
          id: 100
          name: "monster"
          status: "dead"
        })
        mock: true
      }
      window.response = swagger.pet.addPet(params, success_callback, error_callback)

      waitsFor ->
        window.response?

      runs ->
        obj = window.response
        console.log obj
        expect(obj.method).toBe "post"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.headers["Content-Type"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet")

    it "verifies the http request object for a POST with form params", ->
      params = {
        headers: {}
        petId: 1
        name: "dog"
        status: "very happy"
        mock: true
      }

      window.response = swagger.pet.updatePetWithForm(params, success_callback, error_callback)

      waitsFor ->
        window.response?

      runs ->
        obj = window.response
        console.log obj
        expect(obj.body).toBe "name=dog&status=very%20happy"
        expect(obj.method).toBe "post"
        expect(obj.headers["Accept"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/1")

  describe "execute put operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a POST", ->
      params = {
        body: JSON.stringify({
          id: 100
          name: "monster"
          status: "dead"
        })
        mock: true
      }

      window.response = swagger.pet.updatePet(params, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "put"
        expect(obj.headers["Accept"]).toBe undefined
        expect(obj.headers["Content-Type"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet")


  describe "execute delete operations", ->

    beforeEach ->
      window.body = null
      window.response = null
      window.callback = null
      window.error = null
      window.success_callback = (data) ->
        window.response = data
      window.error_callback = (data) ->
        window.error = data

    it "verifies the http request object for a DELETE", ->
      params = {
        petId: 100
        mock: true
      }

      window.response = swagger.pet.deletePet(params, success_callback, error_callback)

     waitsFor ->
       window.response?

      runs ->
        obj = window.response
        expect(obj.method).toBe "delete"
        expect(obj.headers["Accept"]).toBe undefined
        expect(obj.headers["Content-Type"]).toBe "application/json"
        expect(obj.url).toBe ("http://localhost:8002/api/pet/100")


