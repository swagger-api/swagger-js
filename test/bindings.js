/* global after, before, describe, it */

'use strict';

var expect = require('expect');
var mock = require('./mock');
var sample, instance;

describe('help and bindings', function () {
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

  it('verifies the direct help function', function () {
    var petApi = sample.pet;
    var help = petApi.help(true);

    expect(help.indexOf('operations for the \'pet\' tag')).toBe(0);
  });

  it('verifies the direct help operation function', function () {
    var petApi = sample.pet;
    var help = petApi.getPetById.help(true);

    expect(help.indexOf('getPetById: Find pet by ID')).toBe(0);
  });

  it('verifies the direct help operation function 2', function () {
    var petApi = sample.pet;
    var help = petApi.findPetsByStatus.help(true);

    expect(help.indexOf('status (Array[string]): Status values')).toBeGreaterThan(0);
  });

  it('verifies the direct asCurl function', function () {
    var petApi = sample.pet;
    var curl = petApi.getPetById.asCurl;

    expect(typeof curl).toBe('function');
  });

  it('verifies the direct execute function', function () {
    var petApi = sample.pet;
    var execute = petApi.getPetById;

    expect(typeof execute).toBe('function');
  });

  it('verifies the apis help function', function () {
    var petApi = sample.apis.pet;
    var help = petApi.help(true);

    expect(help.indexOf('operations for the \'pet\' tag')).toBe(0);
  });

  it('verifies the apis help operation function', function () {
    var petApi = sample.apis.pet;
    var help = petApi.getPetById.help(true);

    expect(help.indexOf('getPetById: Find pet by ID')).toBe(0);
  });

  it('verifies the apis asCurl function', function () {
    var petApi = sample.apis.pet;
    var curl = petApi.getPetById.asCurl;

    expect(typeof curl).toBe('function');
  });

  it('verifies the apis execute function', function () {
    var petApi = sample.apis.pet;
    var execute = petApi.getPetById;

    expect(typeof execute).toBe('function');
  });
});
