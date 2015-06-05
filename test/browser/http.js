'use strict';
var expect = require('chai').expect;
var fauxjax = require('faux-jax');

var Swagger = require('../../');
var fs = require('fs');
var petstore_yaml = fs.readFileSync(__dirname + '/../spec/v2/petstore.yaml', 'utf8'); // browserify with brfs with inline this for browser

var petstore;
var client;

describe('yaml http', function () {
  describe('superagent', function(){

    it('should fetch/parse petstore.yaml', function(done){
      // Mock our request
      fauxjax.install();
      fauxjax.on('request', function (req) {
        req.respond( 200, { }, petstore_yaml);
        fauxjax.restore(); // Restore globals that were mocked
      });

      petstore = new Swagger({
        url: 'http://example.com/petstore.yaml',
        success: loaded,
        failure: function (err) { throw err; }
      });

      function loaded() {

        expect(petstore).to.be.an('object');
        expect(petstore.pet).to.be.an('object');
        expect(petstore.pet).to.respondTo('getPetById');

        // Make sure we /are/ testing the yaml spec and not the json...
        expect(petstore.info.title).to.equal('Swagger Petstore YAML')
        done();
      }
    });

    // it('should throw if unable to parse spec', function(done){
    //   fauxjax.install();
    //   fauxjax.on('request', function (req) {
    //     req.respond(200, {}, 'string');
    //     fauxjax.restore();
    //   });

    //   try {
    //     new Swagger({
    //       url: 'http://example.com/rubbish',
    //       success: function () { },
    //       failure: function (err) {
    //         expect(err).to.eql('failed to parse JSON/YAML response');
    //         done();
    //       }
    //     });
    //   } catch(e) {}

    // });

  });

});
