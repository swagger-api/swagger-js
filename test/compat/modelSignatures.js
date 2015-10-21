/* global after, before, describe, it */

'use strict';

var _ = require('lodash-compat');
var expect = require('expect');
var mock = require('./mock');
var sample, instance;

describe('1.2 model signatures', function () {
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

  it('returns the json representation of a pet with repeating models', function () {
    var animals = sample.models.Animals;
    var pet = sample.models.Pet;

    expect(animals.createJSONSample()).toEqual({
      cat: pet.createJSONSample(),
      dog: pet.createJSONSample(),
      mouse: pet.createJSONSample()
    });
  });

  it('should include property descriptions for model properties (Issue 533)', function () {
    var html = sample.models.Animals.getMockSignature();
    var descriptions = [
      'The cat property',
      'The dog property',
      'The mouse property'
    ];

    _.forEach(descriptions, function (description) {
      expect(html.indexOf('<span class="propDesc">' + description + '</span>')).toBeGreaterThan(-1);
    });
  });
});
