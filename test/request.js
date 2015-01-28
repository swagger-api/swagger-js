var test = require('unit.js')
var should = require('should')
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
    should(req.method).equal('GET');
    should(req.headers['Accept']).equal('application/json');
    should(req.url).equal('http://localhost:8000/api/pet/1');
  });
});