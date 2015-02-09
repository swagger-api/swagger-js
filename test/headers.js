var test = require('unit.js');
var expect = require('expect');
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = {
      myHeader: 'tony'
    };

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('tony');
  });


  it('should not URL encode header string values', function() {
    var parameters = [
      {
        in: 'header',
        name: 'myHeader',
        type: 'string'
      }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = {
      myHeader: 'someKey=someValue'
    };

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('someKey=someValue');
  });

  it('should not URL encode header string array values', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = {
      myHeader: ['firstParam=firstValue', 'secondParam=secondValue']
    };

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('firstParam=firstValue,secondParam=secondValue');
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var args = {
      myHeader: ['tony', 'tam']
    };

    var url = op.urlify(args);
    var headers = op.getHeaderParams(args);

    expect(url).toBe('http://localhost/path');
    expect(headers.myHeader).toBe('tony,tam');
  });
});