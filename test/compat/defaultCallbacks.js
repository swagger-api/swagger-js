/* global after, before, describe, it */

'use strict';

var mock = require('./mock');
var sample, instance;

describe('1.2 default success callback', function () {
  var opts = {};
  var finished;

  opts.defaultSuccessCallback = function () {
    finished();
  };

  before(function (done) {
    mock.petstore(done, opts, function (petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function (done){
    instance.close();
    done();
  });

  it('verifies the default success callback function, per #141', function (done) {
    finished = done;

    var petApi = sample.pet;

    petApi.getPetById({petId: 1});
    // TODO: enable when callback support is back https://github.com/swagger-api/swagger-js/issues/308
    done();
  });
});

describe('default error callback', function () {
  var opts = {};
  var finished;

  opts.defaultErrorCallback = function () {
    finished();
  };

  before(function (done) {
    mock.petstore(done, opts, function (petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function (done){
    instance.close();
    done();
  });

  it('verifies the default error callback function, per #141', function (done) {
    finished = done;

    var petApi = sample.pet;

    petApi.getPetById({petId: 1}, {responseContentType: 'invalid'});

    // TODO: enable when callback support is back https://github.com/swagger-api/swagger-js/issues/308
    done();
  });
});
