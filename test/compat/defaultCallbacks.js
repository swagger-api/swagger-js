var test = require('unit.js');
var expect = require('expect');
var mock = require('../../test/compat/mock');
var swagger = require('../../lib/swagger-client');
var sample, instance;

describe('1.2 default success callback', function() {
  var opts = {};
  var finished;
  opts.defaultSuccessCallback = function(data) {
    finished();
  };

  before(function(done) {
    mock.petstore(done, opts, function(petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function(done){
    instance.close();
    done();
  });

  it('verifies the default success callback function, per #141', function(done) {
    finished = done;
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1});
  });
});

describe('default error callback', function() {
  var opts = {};
  var finished;
  opts.defaultErrorCallback = function(data) {
    finished();
  };

  before(function(done) {
    mock.petstore(done, opts, function(petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function(done){
    instance.close();
    done();
  });

  it('verifies the default error callback function, per #141', function(done) {
    finished = done;
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {responseContentType: 'invalid'});
  });
});
