var test = require('unit.js');
var should = require('should');
var swagger = require('../lib/swagger-client');

describe('content type negotiation', function() {
  it('set default accept as application/json for a GET operation', function() {
    var parameters = [];
    var op = new swagger.Operation({}, 'test', 'get', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({},{});
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    test.value(headers['Content-Type']).isUndefined();
  });

  it('set accept as application/json, content-type as undefined for a POST operation with no body param or data', function() {
    var parameters = [];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({},{});
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    test.value(headers['Content-Type']).isUndefined();
  });

  it('set accept as application/json, content-type as undefined for a POST operation with no data', function() {
    var parameters = [{
      in: 'body',
      name: 'theBody',
      schema: {
        properties: {
          name: 'name',
          type: 'string'
        }
      }
    }];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({},{});
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    test.value(headers['Content-Type']).isUndefined();
  });

  it('set accept as application/json, content-type as application/json for a POST operation with data', function() {
    var parameters = [{
      in: 'body',
      name: 'theBody',
      schema: {
        properties: {
          name: 'name',
          type: 'string'
        }
      }
    }];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({theBody: { name: 'tony'}},{});
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    should(headers['Content-Type']).equal('application/json');
  });

  it('honors the accept media type requested', function () {
    var parameters = [{
      in: 'body',
      name: 'theBody',
      schema: {
        properties: {
          name: 'name',
          type: 'string'
        }
      }
    }];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { requestContentType: 'application/xml' }
    );
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    should(headers['Content-Type']).equal('application/xml');
  });

  it('honors the accept media type and response content type requested', function () {
    var parameters = [{
      in: 'body',
      name: 'theBody',
      schema: {
        properties: {
          name: 'name',
          type: 'string'
        }
      }
    }];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { requestContentType: 'application/xml',
        responseContentType: 'application/xml'
      }
    );
    should(headers['Accept']).equal('application/xml');  // jshint ignore:line
    should(headers['Content-Type']).equal('application/xml');
  });

  it('sets the content type for form of x-www-form-urlencoded', function () {
    var parameters = [{
      in: 'formData',
      name: 'name',
      type: 'string'
    }];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { }
    );
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    should(headers['Content-Type']).equal('application/x-www-form-urlencoded');
  });

  it('sets the content type for form of multipart/form-data when specified', function () {
    var parameters = [{
      in: 'formData',
      name: 'name',
      type: 'string'
    }];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { requestContentType: 'multipart/form-data'}
    );
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    should(headers['Content-Type']).equal('multipart/form-data');
  });

  it('sets the content type for multipart/form-data with a file parameter', function () {
    var parameters = [{
      in: 'formData',
      name: 'name',
      type: 'string'
    },{
      in: 'formData',
      name: 'theFile',
      type: 'file'
    }];
    var op = new swagger.Operation({}, 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      {}
    );
    should(headers['Accept']).equal('application/json');  // jshint ignore:line
    should(headers['Content-Type']).equal('multipart/form-data');
  });
});
