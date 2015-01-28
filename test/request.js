var test = require('unit.js')
var expect = require('expect')
var mock = require('../test/mock');
var swagger = require('../lib/swagger-client');
var sample, instance;

describe('api key authorizations', function() {
  before(function(done) {
    mock.petstore(done, function(petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function(done){
    instance.close();

    swagger.authorizations.authz = {};
    done();
  });

  it('generate a get request', function() {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {mock: true});

    test.object(req);
    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/api/pet/1');
  });

  it('generate a get request with query params', function() {
    var petApi = sample.pet;
    var req = petApi.findPetsByTags({tags: ["tag 1", "tag 2"]}, {mock: true});

    test.object(req);
    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/api/pet/findByTags?tags=tag%201&tags=tag%202');
  });

  it('generate a get request with email query param array', function() {
    var petApi = sample.pet;
    var req = petApi.findPetsByStatus({status: ["fehguy@gmail.com", "nada"]}, {mock: true});

    test.object(req);
    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/api/pet/findByStatus?status=fehguy%40gmail.com|nada');
  });

  it('generate a POST request with body', function() {
    var petApi = sample.pet;
    var req = petApi.addPet({body: {id: 100, name: 'gorilla'}}, {mock: true});

    test.object(req);
    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/api/pet');
    expect(req.body).toEqual({ id: 100, name: 'gorilla' });
  });

  it('generate a POST request with no body', function() {
    var petApi = sample.pet;
    var req = petApi.addPet({}, {mock: true});

    test.object(req);
    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBeUndefined;
    expect(req.url).toBe('http://localhost:8000/api/pet');
    expect(req.body).toBeUndefined;
  });

  it('generate a POST request with an empty body', function() {
    var petApi = sample.pet;
    var req = petApi.addPet({body:{}}, {mock: true});

    test.object(req);
    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/api/pet');
    expect(req.body).toEqual({});
  });

  it('generate a POST request for application/x-www-form-urlencoded', function() {
    var petApi = sample.pet;
    var req = petApi.updatePetWithForm({petId:100, name: 'monster', status: 'miserable dog'}, {mock: true});

    test.object(req);
    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(req.url).toBe('http://localhost:8000/api/pet/100');
    expect(req.body).toEqual('name=monster&status=miserable%20dog');
  });

  it('generate a DELETE request', function() {
    var petApi = sample.pet;
    var req = petApi.deletePet({petId: 100}, {mock: true});

    test.object(req);
    expect(req.method).toBe('DELETE');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBeUndefined;
    expect(req.url).toBe('http://localhost:8000/api/pet/100');
    expect(req.body).toBeUndefined;
  });

  it('escape an operation id', function() {
    var storeApi = sample.store.get_inventory_1;
    expect(typeof storeApi).toEqual('function');
  });
});