var test = require('unit.js')
var should = require('should')
var mock = require('../test/mock');
var swagger = require('../lib/swagger');
var sample, instance;

describe('get model operations', function() {
  before(function(done) {
    mock.petstore(done, function(petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function(done){
    instance.close();

    done();
  });

  it('verifies the Pet model', function(done) {
    var pet = sample.pet.models['Pet'];
    
    should(pet.name).equal('Pet');
    var props = pet.properties;

    should(props[0].name).equal('id');
    should(props[0].dataType).equal('integer');

    should(props[1].name).equal('category')
    should(props[1].dataType).equal('Category')

    should(props[2].name).equal('name')
    should(props[2].dataType).equal('string')

    should(props[3].name).equal('photoUrls')
    should(props[3].dataType).equal('array')
    should(props[3].refDataType).equal('string')

    should(props[4].name).equal('tags')
    should(props[4].dataType).equal('array')
    should(props[4].refDataType).equal('Tag')

    should(props[5].name).equal('status')
    should(props[5].dataType).equal('string')
    done();
  })

  it('verifies the getAbsoluteBasePath method for relativeBasePath "/"', function(done) {
    sample.basePath = 'http://localhost:8000/api-docs/';
    should(sample.pet.getAbsoluteBasePath("/")).equal("http://localhost:8000");
    done();
  })

  it('doesn\'t add double slashes per #202', function(done) {
    sample.basePath = 'http://localhost:8000/api-docs/';
    
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {mock: true});

    console.log(req);
    done();
  })
})