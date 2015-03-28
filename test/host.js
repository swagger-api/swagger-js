/* global describe, it */

'use strict';

var expect = require('expect');
var Operation = require('../lib/types/operation');

describe('host configuration', function () {
  it('urlify to the default host, port, scheme', function () {
    var op = new Operation({}, 'http', 'test', 'get', '/path', {});
    var url = op.urlify({});

    expect(url).toBe('http://localhost/path');
  });

  it('use the specified scheme', function () {
    var op = new Operation({}, 'https', 'test', 'get', '/path', {});
    var url = op.urlify({});

    expect(url).toBe('https://localhost/path');    
  });

  it('use the specified host + port', function () {
    var op = new Operation({host: 'foo.com:8081'}, 'http', 'test', 'get', '/path', {});
    var url = op.urlify({});

    expect(url).toBe('http://foo.com:8081/path');    
  });

  it('use the specified basePath', function () {
    var op = new Operation({basePath: '/my/api'}, 'http', 'test', 'get', '/path', {});
    var url = op.urlify({});

    expect(url).toBe('http://localhost/my/api/path');    
  });
});
