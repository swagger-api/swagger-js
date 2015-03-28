/* global after, before, describe, it */

'use strict';

var test = require('unit.js');
var expect = require('expect');
var mock = require('./single');
var sample, instance;

describe('1.2 request operations', function() {
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

  it('loads a single file resource', function() {
    var petApi = sample.pet;

    test.object(petApi);

    var help = petApi.getPetById.help(true);

    expect(help.indexOf('getPetById: Find pet by ID')).toBe(0);
  });
});
