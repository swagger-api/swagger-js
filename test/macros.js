var test = require('unit.js')
var should = require('should')
var mock = require('../test/mock');
var sample, instance;

describe('macro overrides', function() {
  before(function(done) {
    var macros = {
      parameter: function(parameter, operation) {
        if(parameter.defaultValue === 1)
          return 'testing';
        return parameter.defaultValue;
      },
      modelProperty: function(property, model) {
        return property.defaultValue;
      }
    }
    mock.petstore(done, function(petstore, server){
      sample = petstore;
      instance = server;
    }, macros);
  });

  after(function(done){
    instance.close();

    done();
  });

  it('set a parameter default value macro', function() {
    var params = sample.pet.operations.getPetById.parameters;
    test.object(params);

    should(params[0].defaultValue).equal('testing');
  })
})
