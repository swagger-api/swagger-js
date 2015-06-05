'use strict';
var expect = require('chai').expect;
var SwaggerClient = require('../../');
var client;

describe('petstore', function () {
  before(function(done){
    client = new SwaggerClient({
      spec: require('../spec/v2/petstore.json'),
      success: done,
      failure: function () {
        throw 'unable to create SwaggerClient';
      }
    });
  });

// disabled because this has to be run in a browser
/*
  it('should create body when file parameter present', function () {
    var req = client.pet.uploadFile({
      petId: 1,
      file: new Blob(['Hello World'], {type: 'text/plain'})
    }, {mock: true, useJQuery: true});

    expect(req.useJQuery).to.equal(true);
    expect(req.method).to.equal('POST');
    expect(req.headers['Content-Type']).equal('multipart/form-data');
    expect(req.body).to.be.an('object');
    expect(req.body).to.have.property('type');
    expect(req.body.type).to.equal('formData');
  });
*/
});
