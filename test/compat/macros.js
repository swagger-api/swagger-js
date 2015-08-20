/* global after, before, describe, it */

'use strict';

var test = require('unit.js');
var expect = require('expect');
var mock = require('./mock');
var sample, instance;

describe('1.2 macro overrides', function () {
  before(function (done) {
    var macros = {
      parameter: function (operation, parameter) {
        if (parameter.default === 3) {
          return 'testing';
        }

        return parameter.default;
      },
      modelProperty: function (property) {
        return property.default;
      }
    };

    mock.petstore(done, function (petstore, server) {
      sample = petstore;
      instance = server;
    }, macros);
  });

  after(function (done){
    instance.close();

    done();
  });

  it('set a parameter default value macro', function () {
    var params = sample.pet.operations.getPetById.parameters;

    test.object(params);

    expect(params[0].default).toBe('testing');
  });
});
