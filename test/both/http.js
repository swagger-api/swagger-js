/* global describe,before,it,after */
'use strict';
var expect = require('chai').expect;
var fauxjax = require('faux-jax');

var Swagger = require('../../');
var fs = require('fs');
var petstoreYaml = fs.readFileSync(__dirname + '/../spec/v2/petstore.yaml', 'utf8'); // browserify with brfs will inline this for browser
var petstore;

describe('yaml http', function () {

  before(function(){
    fauxjax.install();
  });

  after(function(){
    fauxjax.restore();
    fauxjax.removeAllListeners();
  });

  describe('superagent', function(){

    it('should fetch/parse petstore.yaml', function(done){
      // Mock our request
      fauxjax.once('request', function (req) {
        req.respond( 200, { }, petstoreYaml);
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
        expect(petstore.info.title).to.equal('Swagger Petstore YAML');
        done();
      }
    });


    // it('should parse yaml with the resolver', function(done){
    //   var baseSpec = 'swagger: "2.0"';
    //   baseSpec += '\ninfo:';
    //   baseSpec += '\n\ttitle: basey';
    //   baseSpec += '\n\t\t$ref: "http://example.com/outside.yaml#/outside"';
    //   baseSpec += '\n';

    //   var outsideSpec = 'outside:';
    //   outsideSpec += '\n\tget:\n\t\tsummary: yay';

    //   // Mock our request
    //   // fauxjax.install();
    //   // fauxjax.on('request', respond);

    //   function respond (req) {
    //     switch(req.requestURL) {
    //       case 'http://example.com/base.yaml':
    //         req.respond( 200, { }, baseSpec);
    //         break;
    //       case 'http://example.com/outside.yaml':
    //         req.respond( 200, { }, outsideSpec);
    //         break;
    //     }
    //   }

    //   var base = new Swagger({
    //     url: 'http://localhost:8000/swagger.yaml',
    //     // url: 'http://example.com/base.yaml',
    //     success: loaded,
    //     failure: function (err) { throw err; }
    //   });

    //   function loaded() {
    //     // expect(base.title).to.equal('basey');
    //     // expect(Object.keys(base.apis).length).to.equal(1); // dummy
    //     expect(base.apis.admin).to.be.an('object');
    //     done();
    //   }

    // });

    // Need to figure out async exceptions and how to catch/test properly

    // it('should throw if unable to parse spec', function(done){
    //   fauxjax.install();
    //   fauxjax.on('request', function (req) {
    //     req.respond(200, {}, 'string');
    //     fauxjax.restore();
    //   });


    //   var tmp = new Swagger({
    //     url: 'http://example.com/rubbish',
    //     success: function () { },
    //     failure: function (err) {
    //       expect(err).to.eql('failed to parse JSON/YAML response');
    //       done();
    //     }
    //   });

    // });

  });

});
