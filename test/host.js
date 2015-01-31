var test = require('unit.js');
var expect = require('expect');
var swagger = require('../lib/swagger-client');

describe('host configuration', function() {
  it('urlify to the default host, port, scheme', function() {
    var parameters = [];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', {});
    var url = op.urlify({});
    expect(url).toBe('http://localhost/path');
  });

  it('use the specified scheme', function() {
    var parameters = [];
    var op = new swagger.Operation({}, 'https', 'test', 'get', '/path', {});
    var url = op.urlify({});
    expect(url).toBe('https://localhost/path');    
  });

  it('use the specified host + port', function() {
    var parameters = [];
    var op = new swagger.Operation({host: 'foo.com:8081'}, 'http', 'test', 'get', '/path', {});
    var url = op.urlify({});
    expect(url).toBe('http://foo.com:8081/path');    
  });

  it('use the specified basePath', function() {
    var parameters = [];
    var op = new swagger.Operation({basePath: '/my/api'}, 'http', 'test', 'get', '/path', {});
    var url = op.urlify({});
    expect(url).toBe('http://localhost/my/api/path');    
  });
});