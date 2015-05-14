/* global after, before, describe, it */

'use strict';

var mock = require('./mock');
var expect = require('expect');
var sample, instance;

describe('1.2 get model operations', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function (done){
    instance.close();

    done();
  });

  it('doesn\'t add double slashes per #202', function (done) {
    sample.basePath = 'http://localhost:8000/api-docs/';
    
    var petApi = sample.pet;

    petApi.getPetById({petId: 1}, {mock: true});

    done();
  });

  it('verifies enum values in a model property', function(done) {
    var user = sample.models.User;
    expect(user.definition.properties.userStatus['enum']).toEqual([ '1-registered', '2-active', '3-closed' ]);
    done();
  });
});
