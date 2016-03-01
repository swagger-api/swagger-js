/* global after, before, describe, it */

'use strict';

var test = require('unit.js');
var mock = require('./mock');
var sample, instance;


describe('yaml http', function () {
  describe('superagent', function(){
    before(function (done) {
      mock.petstore(done,{
        url: 'http://localhost:8000/v2/petstore.yaml'
        /*,swaggerRequestHeaders: 'application/yaml',*/
      }, function (petstore, server){
        sample = petstore;
        instance = server;
      });

    });

    after(function (done){
      instance.close();

      done();
    });

    it('should fetch/parse petstore.yaml', function(){
      test.object(sample.pet);
      test.function(sample.pet.getPetById);
      test.object(sample.info);
      test.string(sample.info.version).is('1.0.0');
      // Make sure we /are/ testing the yaml spec and not the json...
      test.string(sample.info.title).is('Swagger Petstore YAML');
    });

  });

});
