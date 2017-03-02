/* global after, before, describe, it */

'use strict';

var expect = require('expect');
var test = require('unit.js');
var SwaggerClient = require('..');

var petstoreRaw = require('./spec/v2/petstore.json');


describe('swagger resolver', function () {
  it('fails gracefully with bad spec', function(done) {
    new SwaggerClient({
      spec: 'bad',
      usePromise: true
    }).then(function(client) {
      done('should have failed');
    }).catch(function(err) {
      done();
    })
  });

  it('fails gracefully with bad URL', function(done) {
    new SwaggerClient({
      url: 'http://fake.fake/swagger.json',
      usePromise: true
    }).then(function(client) {
      done('should have failed');
    }).catch(function(err) {
      done();
    })
  });

  it('fails gracefully with operation', function(done) {
    new SwaggerClient({
      spec: petstoreRaw,
      usePromise: true
    }).then(function(client) {
      client.pet.getPetById({petId: 3})
        .then(function(data) {
          done('should have failed');
        })
        .catch(function(error) {
          // this is expected
          done();
        })
    }).catch(function(err) {
      done('should have failed');
    })
  }); 
});