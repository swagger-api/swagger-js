/* global describe, it */

'use strict';

var test = require('unit.js');
var expect = require('expect');
var Operation = require('../lib/types/operation');

describe('content type negotiation', function () {
  it('set default accept as application/json for a GET operation', function () {
    var parameters = [];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({},{});

    expect(headers.Accept).toBe('application/json');

    test.value(headers['Content-Type']).isUndefined();
  });

  it('set accept as application/json, content-type as undefined for a POST operation with no body param or data', function () {
    var parameters = [];
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({},{});

    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('set accept as application/json, content-type as undefined for a POST operation with no data', function () {
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
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({},{});

    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('set accept as application/json, content-type as application/json for a POST operation with data', function () {
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
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes({theBody: { name: 'tony'}},{});

    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('application/json');
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
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { requestContentType: 'application/xml' }
    );

    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('application/xml');
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
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { requestContentType: 'application/xml',
        responseContentType: 'application/xml'
      }
    );

    expect(headers.Accept).toBe('application/xml');
    expect(headers['Content-Type']).toBe('application/xml');
  });

  it('sets the content type for form of x-www-form-urlencoded', function () {
    var parameters = [{
      in: 'formData',
      name: 'name',
      type: 'string'
    }];
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { }
    );

    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('sets the content type for form of multipart/form-data when specified', function () {
    var parameters = [{
      in: 'formData',
      name: 'name',
      type: 'string'
    }];
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      { requestContentType: 'multipart/form-data'}
    );

    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('multipart/form-data');
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
    var op = new Operation({}, 'http', 'test', 'post', '/foo/{names}/bar', { parameters: parameters });
    var headers = op.setContentTypes(
      { theBody: { name: 'tony'} },
      {}
    );

    expect(headers.Accept).toBe('application/json');
    expect(headers['Content-Type']).toBe('multipart/form-data');    
  });
});
