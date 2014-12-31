var test = require('unit.js')
var should = require('should')
var swagger = require('../lib/swagger-client')

describe('host configuration', function() {
  it('urlify to the default host, port, scheme', function() {
    var parameters = [];
    var op = new swagger.Operation({}, 'test', 'get', '/path', {});
    var url = op.urlify({});
    should(url).equal('http://localhost/path');
  })

  it('use the specified scheme', function() {
    var parameters = [];
    var op = new swagger.Operation({scheme: 'https'}, 'test', 'get', '/path', {});
    var url = op.urlify({});
    should(url).equal('https://localhost/path');    
  })

  it('use the specified host + port', function() {
    var parameters = [];
    var op = new swagger.Operation({host: 'foo.com:8081'}, 'test', 'get', '/path', {});
    var url = op.urlify({});
    should(url).equal('http://foo.com:8081/path');    
  })

  it('use the specified basePath', function() {
    var parameters = [];
    var op = new swagger.Operation({basePath: '/my/api'}, 'test', 'get', '/path', {});
    var url = op.urlify({});
    should(url).equal('http://localhost/my/api/path');    
  })
})