var test = require('unit.js');
var should = require('should');
var swagger = require('../lib/swagger-client');

describe('help options', function() {
  it('verify help options with no parameters', function() {
    var parameters = [];
    var op = new swagger.Operation({}, 'test', 'get', '/path', {summary: 'test operation'});
    var help = op.help(true);
    should(help).equal('test: test operation\n');
  });

  it('verify help options with single parameter', function() {
    var parameters = [{
      in: 'query',
      name: 'theName',
      type: 'string',
      description: 'the name of the person to look up'
    }];
    var op = new swagger.Operation({}, 'test', 'get', '/path', {
      summary: 'test operation',
      parameters: parameters
    });
    var help = op.help(true);
    should(help).equal('test: test operation\n\n  * theName (string): the name of the person to look up');
  });

  it('prints a simple curl statement', function() {
    var parameters = [];
    var op = new swagger.Operation({}, 'test', 'get', '/path', {summary: 'test operation'});
    var curl = op.asCurl({});
    should(curl).equal('curl --header "Accept: application/json" http://localhost/path');
  });

  it('prints a curl statement with headers', function() {
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
    var op = new swagger.Operation({}, 'test', 'get', '/path', {
      summary: 'test operation',
      parameters: parameters
    });
    var curl = op.asCurl({
      name: 'tony',
      age: 42
    });
    should(curl).equal('curl --header "Accept: application/json" --header "name: tony" --header "age: 42" http://localhost/path');
  });
});
