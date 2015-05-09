/* global after, before, describe, it */

'use strict';

var mock = require('./mock');
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
/*
  it('verifies the Pet model', function (done) {
    var pet = sample.models.Pet;

    expect(pet.name).toBe('Pet');

    var props = pet.properties;

    expect(props[0].name).toBe('id');
    console.log(props[0]);
    expect(props[0].dataType).toBe('integer');

    expect(props[1].name).toBe('category');
    expect(props[1].dataType).toBe('Category');

    expect(props[2].name).toBe('name');
    expect(props[2].dataType).toBe('string');

    expect(props[3].name).toBe('photoUrls');
    expect(props[3].dataType).toBe('array');
    expect(props[3].refDataType).toBe('string');

    expect(props[4].name).toBe('tags');
    expect(props[4].dataType).toBe('array');
    expect(props[4].refDataType).toBe('Tag');

    expect(props[5].name).toBe('status');
    expect(props[5].dataType).toBe('string');

    done();
  });

  it('verifies the getAbsoluteBasePath method for relativeBasePath "/"', function (done) {
    sample.basePath = 'http://localhost:8000/api-docs/';

    expect(sample.pet.getAbsoluteBasePath('/')).toBe('http://localhost:8000');

    done();
  });
*/
  it('doesn\'t add double slashes per #202', function (done) {
    sample.basePath = 'http://localhost:8000/api-docs/';
    
    var petApi = sample.pet;

    petApi.getPetById({petId: 1}, {mock: true});

    done();
  });
});
