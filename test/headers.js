var test = require('unit.js');
var should = require('should');
var swagger = require('../lib/swagger-client');

describe('header extraction', function() {
  it('should extract header params', function() {
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'string'
      }
    ];
    var op = new swagger.Operation({}, 'test', 'get', '/path', { parameters: parameters });
    var args = {
      myHeader: 'tony'
    };

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    should(url).equal('http://localhost/path');
    should(headers['myHeader']).equal('tony');  // jshint ignore:line
  });

  it('should extract header params with string array with default collectionFormat', function() {
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'array',
        items: {
          type: 'string'
        }
      }
    ];
    var op = new swagger.Operation({}, 'test', 'get', '/path', { parameters: parameters });
    var args = {
      myHeader: ['tony', 'tam']
    };

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    should(url).equal('http://localhost/path');
    should(headers['myHeader']).equal('tony,tam');  // jshint ignore:line
  });
});
