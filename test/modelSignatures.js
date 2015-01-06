var test = require('unit.js')
var should = require('should')
var mock = require('../test/mock');
var sample, instance;

describe('model signatures', function() {
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

  it('returns the json representation of a pet', function() {
    var pet = sample.models['Pet'];
    test.object(pet);
    
    var properties = pet.properties;
    test.array(properties);

    var id = properties[0];
    var sampleValue = id.getSampleValue();
    should(sampleValue).equal(0);
  })
})
