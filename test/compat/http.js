var test = require('unit.js');
var expect = require('expect');
var mock = require('../../test/compat/mock');
var sample, instance;

describe('1.2 http', function() {
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

  it('verifies the response messages from the get operation', function(done) {
    var petApi = sample.pet;
    test.object(petApi);
    var req = petApi.getPetById({petId: 1}, function(data) {
      var pet = data.obj;
      test.object(pet);
      expect(pet.id).toBe(1);
      done();
    }, function(data) {
      console.log('error');
    });
  });

  it('tests the redirect', function(done) {
    var petApi = sample.pet;
    petApi.redirect({}, function(data) {
      var pet = data.obj;
      test.object(pet);
      expect(pet.id).toBe(1);
      done();
    });
  });

  it('verifies the callback function', function(done) {
    var petApi = sample.pet;
    petApi.getPetById({petId: 1}, {}, function(data) {
      var pet = data.obj;
      test.object(pet);
      done();
    });
  });

  it('verifies the callback function with opts, per #101', function(done) {
    var petApi = sample.pet;
    petApi.getPetById({petId: 1}, {}, function(data) {
      var pet = data.obj;
      test.object(pet);
      done();
    });
  });

  it('verifies the error callback with all params, per #203', function(done) {
    var petApi = sample.pet;
    var success = function(data) {
      done();
    };
    var failure = function(data) {
      done();
    };
    var req = petApi.getPetById({petId: 0}, {responseContentType: 'invalid'}, success, failure);
  });

  it('verifies the error callback with three params, per #203', function(done) {
    var petApi = sample.pet;
    var success = function(data) {
      fail();
    };
    var failure = function(data) {
      done();
    };
    var req = petApi.getPetById({petId: 0}, success, failure);
  });
});
