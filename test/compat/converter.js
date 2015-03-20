/* global after, before, describe, it */

'use strict';

var test = require('unit.js');
var expect = require('expect');
var mock = require('./mock');
var SwaggerSpecConverter = require('../../lib/spec-converter');
var SwaggerHttp = require('../../lib/http');

var sample, instance;

describe('converts specs', function () {
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

  it('ignores an empty spec', function(done) {
      var converter = new SwaggerSpecConverter();
      converter.convert({}, function(result) {
        expect(result).toBe(null);
        done();
      });    
  });

  it('converts the petstore 1.2 spec', function (done) {
    var obj = {
      url: 'http://localhost:8000/v1/api-docs.json',
      method: 'get',
      headers: {accept: 'application/json'},
      on: {}
    };
    obj.on.response = function(data) {
      var converter = new SwaggerSpecConverter();
      converter.convert(data.obj, function(swagger) {
        console.log(JSON.stringify(swagger, null, 2));
        done();
      });
    };

    var resource = new SwaggerHttp().execute(obj);
  });

});
