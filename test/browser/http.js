'use strict';
var expect = require('chai').expect;
var fauxjax = require('faux-jax');

var Swagger = require('../../');
var fs = require('fs');
var petstore_yaml = fs.readFileSync(__dirname + '/../spec/v2/petstore.yaml', 'utf8'); // browserify with brfs with inline this for browser
var petstoreJson = JSON.parse(fs.readFileSync(__dirname + '/../spec/v2/petstore.json', 'utf8')); // browserify with brfs with inline this for browser

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
        expect(petstore.info.title).to.equal('Swagger Petstore YAML');
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

  describe('superagent with promise', function() {

    var petstoreWithPromise;

    beforeEach(function(done) {
      // Mock our request
      fauxjax.install();
      fauxjax.on('request', function (req) {
        req.respond( 200, { }, petstore_yaml);
        fauxjax.restore(); // Restore globals that were mocked
      });

      new Swagger({
        url: 'http://example.com/petstore.yaml',
        usePromise: true
      }).then(function(petstore) {
        petstoreWithPromise = petstore;
        done();
      });
    });

    it('should fetch/parse petstore.yaml', function(done){
      expect(petstoreWithPromise).to.be.an('object');
      expect(petstoreWithPromise.pet).to.be.an('object');
      expect(petstoreWithPromise.pet).to.respondTo('getPetById');

      // Make sure we /are/ testing the yaml spec and not the json...
      expect(petstoreWithPromise.info.title).to.equal('Swagger Petstore YAML');
      done();
    });

    it('should call the then-function when executing a valid api-call', function(done) {
      var petId = 3;
      petstoreWithPromise.pet.getPetById({petId: petId})
        .then(function(pet) {
            expect(pet).to.be.an('object');
            expect(pet.obj.id).to.equal(petId);
            expect(pet.obj.name).to.be.an('string');
            done();
        })
        .catch(function(error) {
            // someone deleted our pet!
            expect(error.status).to.equal(404);
            done();
      });
    });

    it('should call the catch-function when executing an invalid api-call', function(done) {
      var petId = -100;
      petstoreWithPromise.pet.getPetById({petId: petId}).then(function (success) {
        console.log('why?');
        console.log(success);
        done();
      }).catch(function(error) {
        expect(error.status).to.equal(404);
        expect(error.statusText.indexOf('Pet not found')).to.be.greaterThan(0);
        done();
      });
    });
  });



  it('calls the API with promise from a static spec', function(done) {
    var spec = petstoreJson;

    // set the host + basePath so we can make real calls
    spec.host = 'petstore.swagger.io';
    spec.basePath = '/v2';
    new Swagger({
      url: 'http://foo.bar',
      spec: petstoreJson,
      usePromise: true
    }).then(function(client) {
        client.pet.getPetById({petId: 4})
        .then(
          function(response) {
            var pet = response.obj;
            expect(pet.id).to.equal(4);
            done();
          })
        .catch(function(error) {
          // it's ok if the pet was deleted
          expect(error.status).to.equal(404);
          expect(error.statusText.indexOf('Pet not found')).to.be.greaterThan(0);
          done();
        });
      });
  });

  it('calls the API with promise from a url', function(done) {
    new Swagger({
      url: 'http://petstore.swagger.io/v2/swagger.json',
      usePromise: true
    }).then(function(client) {
          client.pet.getPetById({petId: 4})
              .then(
              function(response) {
                var pet = response.obj;
                expect(pet.id).to.equal(4);
                done();
              })
              .catch(function(error) {
                // it's ok if the pet was deleted
                expect(error.status).to.equal(404);
                expect(error.statusText.indexOf('Pet not found')).to.be.greaterThan(0);
                done();
              });
        });
  });

  it('should support relative spec URLs as per #645', function(done) {
    // this test requires being run from the browser
    if(typeof window !== 'undefined') {
      try {
        new Swagger({
          url: '/base/test/spec/v2/test.json',
          usePromise: true
        }).then(function (client) {
          done();
        });
      } catch (exception) {
        done(exception);
      }
    }
    else {
      console.log('skipping headless test');
      done();
    }
  });
});
