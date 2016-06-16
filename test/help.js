/* global describe, it */

'use strict';

var auth = require('../lib/auth');
var expect = require('expect');
var SwaggerClient = require('..');
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
    var op = new Operation({},
        'http',
        'test',
        'get',
        '/path',
        {summary: 'test operation'}, {}, {}, new auth.SwaggerAuthorizations());
    var curl = op.asCurl({});

    expect(curl).toBe('curl -X GET --header \'Accept: application/json\' \'http://localhost/path\'');
  });

  it('does not duplicate api_key in query param per #624', function () {
    var apiKey = new auth.ApiKeyAuthorization('api_key', 'abc123', 'query');
    var auths = new auth.SwaggerAuthorizations({'api_key': apiKey});

    var op = new Operation({},
        'http',
        'test',
        'get',
        '/path',
        {summary: 'test operation'}, {}, {}, auths);
    var curl = op.asCurl({});
    // repeat to ensure no change
    curl = op.asCurl({});

    expect(curl).toBe('curl -X GET --header \'Accept: application/json\' \'http://localhost/path?api_key=abc123\'');
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
    },
    {
      in: 'header',
      name: 'Authorization',
      type: 'string'
    }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', {
      summary: 'test operation',
      parameters: parameters
    }, {}, {}, new auth.SwaggerAuthorizations());
    var curl = op.asCurl({
      name: 'tony',
      age: 42,
      Authorization: 'Oauth:"test"'
    });

    expect(curl).toBe('curl -X GET --header \'Accept: application/json\' --header \'name: tony\' --header \'age: 42\' --header \'Authorization: Oauth:"test"\' \'http://localhost/path\'');
  });

  it('prints a curl statement with custom content-type', function () {
    var op = new Operation({}, 'http', 'test', 'get', '/path', {summary: 'test operation'}, {}, {},
        new auth.SwaggerAuthorizations());
    var curl = op.asCurl({}, {
      responseContentType: 'application/xml'
    });

    expect(curl).toBe('curl -X GET --header \'Accept: application/xml\' \'http://localhost/path\'');
  });

  it('prints a curl statement with an array of query params', function (done) {
    var spec = {
      paths: {
        '/foo': {
          get: {
            operationId: 'sample',
            tags: [ 'test' ],
            parameters: [
              {
                in: 'query',
                name: 'name',
                type: 'array',
                items: {
                  type: 'string'
                },
                collectionFormat: 'pipes'
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({name: ['tony', 'tam']});
        expect(msg).toBe('curl -X GET --header \'Accept: application/json\' \'http://localhost:8080/foo?name=tony|tam\'');
        done();
      }
    });
  });

  it('prints a curl statement with an array of query params and auth', function (done) {
    var spec = {
      paths: {
        '/foo': {
          get: {
            operationId: 'sample',
            tags: [ 'test' ],
            parameters: [
              {
                in: 'query',
                name: 'name',
                type: 'array',
                items: {
                  type: 'string'
                },
                collectionFormat: 'pipes'
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      authorizations: {
        authMe: new auth.PasswordAuthorization('foo', 'bar')
      },
      success: function () {
        var msg = client.test.sample.asCurl({name: ['tony', 'tam']});
        expect(msg).toBe("curl -X GET --header 'Accept: application/json' --header 'Authorization: Basic Zm9vOmJhcg==' 'http://localhost:8080/foo?name=tony|tam'");
        done();
      }
    });
  });

  it('prints a curl statement with html', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            parameters: [
              {
                in: 'body',
                name: 'body',
                schema: {
                  type: 'object'
                }
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({body: {
          description: '<b>Test</b>'
        }});
        expect(msg).toBe("curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{\"description\":\"<b>Test</b>\"}' 'http://localhost:8080/foo'");
        done();
      }
    });
  });

  it('handles post body with html', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            parameters: [
              {
                in: 'body',
                name: 'body',
                schema: {
                  type: 'object'
                }
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({body: {
          description: "<h1>hello world<script>alert('test')</script></h1>"
        }});
        expect(msg).toBe("curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{\"description\":\"<h1>hello world<script>alert(%27test%27)</script></h1>\"}' 'http://localhost:8080/foo'");
        done();
      }
    });
  });

  it('handles post with no body', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample'
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({});
        expect(msg).toBe("curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' 'http://localhost:8080/foo'");
        done();
      }
    });
  });
});
