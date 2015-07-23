/* global describe, it */

'use strict';

var auth = require('../lib/auth');
var expect = require('expect');
var Operation = require('../lib/types/operation');

describe('help options', function () {
  it('verify help options with no parameters', function () {
    var op = new Operation({}, 'http', 'test', 'get', '/path', {summary: 'test operation'});
    var help = op.help(true);

    expect(help).toBe('test: test operation\n');
  });

  it('verify help options with single parameter', function () {
    var parameters = [{
      in: 'query',
      name: 'theName',
      type: 'string',
      description: 'the name of the person to look up'
    }];
    var op = new Operation({}, 'http', 'test', 'get', '/path', {
      summary: 'test operation',
      parameters: parameters
    });
    var help = op.help(true);

    expect(help).toBe('test: test operation\n\n  * theName (string): the name of the person to look up');
  });

  it('prints a simple curl statement', function () {
    var op = new Operation({}, 'http', 'test', 'get', '/path', {summary: 'test operation'}, {}, {},
                                   new auth.SwaggerAuthorizations());
    var curl = op.asCurl({});

    expect(curl).toBe('curl -X GET --header "Accept: application/json" "http://localhost/path"');
  });

  it('prints a curl statement with headers', function () {
    var parameters = [{
      in: 'header',
      name: 'name',
      type: 'string'
    },{
      in: 'header',
      name: 'age',
      type: 'integer',
      format: 'int32'
    }];
    var op = new Operation({}, 'http', 'test', 'get', '/path', {
      summary: 'test operation',
      parameters: parameters
    }, {}, {}, new auth.SwaggerAuthorizations());
    var curl = op.asCurl({
      name: 'tony',
      age: 42
    });

    expect(curl).toBe('curl -X GET --header "Accept: application/json" --header "name: tony" --header "age: 42" "http://localhost/path"');
  });

  it('prints a curl statement with custom content-type', function () {
    var op = new Operation({}, 'http', 'test', 'get', '/path', {summary: 'test operation'}, {}, {},
        new auth.SwaggerAuthorizations());
    var curl = op.asCurl({}, {
      responseContentType: 'application/xml'
    });

    expect(curl).toBe('curl -X GET --header "Accept: application/xml" "http://localhost/path"');
  });
});
