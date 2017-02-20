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
        expect(msg).toBe('curl -X GET --header \'Accept: application/json\' --header \'Authorization: Basic Zm9vOmJhcg==\' \'http://localhost:8080/foo?name=tony|tam\'');
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
        expect(msg).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' --data-raw \'{"description":"<b>Test</b>"}\' \'http://localhost:8080/foo\'');
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
          description: '<h1>hello world<script>alert(\'test\')</script></h1>'
        }});
        expect(msg).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' --data-raw \'{"description":"<h1>hello world<script>alert(\\u0027test\\u0027)</script></h1>"}\' \'http://localhost:8080/foo\'');
        done();
      }
    });
  });

  it('handles post body with special chars', function (done) {
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

    var body = '@prefix nif:<http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#> .\n' +
      '@prefix itsrdf: <http://www.w3.org/2005/11/its/rdf#> .\n' +
      '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n' +
      '<http://example.org/document/1#char=0,21>\n' +
      'a nif:String , nif:Context, nif:RFC5147String ;\n' +
      'nif:isString "Welcome to Berlin"^^xsd:string;\n' +
      'nif:beginIndex "0"^^xsd:nonNegativeInteger;\n' +
      'nif:endIndex "21"^^xsd:nonNegativeInteger;\n' +
      'nif:sourceUrl <http://differentday.blogspot.com/2007_01_01_archive.html>.';

    var client = new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({body: body});
        expect(msg).toBe('curl -X POST --header \'Content-Type: application\/json\' --header \'Accept: application\/json\' --data-raw \'@prefix nif:<http:\/\/persistence.uni-leipzig.org\/nlp2rdf\/ontologies\/nif-core#> .\n@prefix itsrdf: <http:\/\/www.w3.org\/2005\/11\/its\/rdf#> .\n@prefix xsd: <http:\/\/www.w3.org\/2001\/XMLSchema#> .\n<http:\/\/example.org\/document\/1#char=0,21>\na nif:String , nif:Context, nif:RFC5147String ;\nnif:isString "Welcome to Berlin"^^xsd:string;\nnif:beginIndex "0"^^xsd:nonNegativeInteger;\nnif:endIndex "21"^^xsd:nonNegativeInteger;\nnif:sourceUrl <http:\/\/differentday.blogspot.com\/2007_01_01_archive.html>.\' \'http:\/\/localhost:8080\/foo\'');
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
        expect(msg).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' \'http://localhost:8080/foo\'');
        done();
      }
    });
  });

  it('handles delete form with parameters', function (done) {
    var spec = {
      paths: {
        '/foo': {
          delete: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: [ 'application/x-www-form-urlencoded' ],
            parameters: [
              {
                in: 'formData',
                name: 'name',
                type: 'string'
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
        var msg = client.test.sample.asCurl({name: 'fred'});
        expect(msg).toBe('curl -X DELETE --header \'Content-Type: application/x-www-form-urlencoded\' --header \'Accept: application/json\' --data-raw \'name=fred\' \'http://localhost:8080/foo\'');
        done();
      }
    });
  });

  it('handles delete form with no parameters', function (done) {
    var spec = {
      paths: {
        '/foo': {
          delete: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: [ 'application/x-www-form-urlencoded' ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://localhost:8080/petstore.yaml',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({});
        expect(msg).toBe('curl -X DELETE --header \'Content-Type: application/x-www-form-urlencoded\' --header \'Accept: application/json\' \'http://localhost:8080/foo\'');
        done();
      }
    });
  });

  it('handles formData with brackets', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: [ 'application/x-www-form-urlencoded' ],
            parameters: [
              {
                in: 'formData',
                name: 'names',
                type: 'array',
                items: {
                  type: 'string'
                },
                collectionFormat: 'brackets'
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
        var msg = client.test.sample.asCurl({names: ['tony', 'tam']});
        expect(msg).toBe('curl -X POST --header \'Content-Type: application/x-www-form-urlencoded\' --header \'Accept: application/json\' --data-raw \'names[]=tony&names[]=tam\' \'http://localhost:8080/foo\'');
        done();
      }
    });
  });

  it('supports extended content-types', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: [ 'application/json' ],
            produces: [ 'application/json; version=1'],
            parameters: [
              {
                in: 'body',
                name: 'complexBody',
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
        var msg = client.test.sample.asCurl({complexBody: '{"name":"tony"}'},{requestContentType: 'application/json; version=1'});
        expect(msg).toBe('curl -X POST --header \'Content-Type: application/json; version=1\' --header \'Accept: application/json; version=1\' --data-raw \'{"name":"tony"}\' \'http://localhost:8080/foo\'');
        done();
      }
    });
  });

  it('has brackets in variables', function (done) {
    var spec = {
      paths: {
        '/foo': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            parameters: [
              {
                in: 'query',
                name: 'fields',
                type: 'string'
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
        var msg = client.test.sample.asCurl({fields: '[articles]=title'});
        expect(msg).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' \'http://localhost:8080/foo?fields=%5Barticles%5D%3Dtitle\'');

        done();
      }
    });
  });

  it('shows curl for multipart/form-data with password masking', function (done) {
    var spec = {
      basePath: '/v2',
      paths: {
        '/test': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: ['multipart/form-data'],
            parameters: [
              {
                in: 'query',
                name: 'password',
                type: 'string',
                format: 'password',
                required: true
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://petstore.swagger.io/v2/swagger.json',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({password: 'hidden!'});
        expect(msg).toBe('curl -X POST --header \'Content-Type: multipart/form-data\' --header \'Accept: application/json\' {} \'http://petstore.swagger.io/v2/test?password=******\'');

        done();
      }
    });
  });

  it('masks www-form-urlencoded passwords', function (done) {
    var spec = {
      paths: {
        '/foo': {
          delete: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: [ 'application/x-www-form-urlencoded' ],
            parameters: [
              {
                in: 'formData',
                name: 'password',
                type: 'string',
                format: 'password'
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
        var msg = client.test.sample.asCurl({password: 'hidden!'});
        expect(msg).toBe('curl -X DELETE --header \'Content-Type: application/x-www-form-urlencoded\' --header \'Accept: application/json\' --data-raw \'password=******\' \'http://localhost:8080/foo\'');

        var obj = client.test.sample({password: 'hidden!'}, {mock: true});
        expect(obj.body).toBe('password=hidden!');
        done();
      }
    });
  });


  it('shows curl for multipart/form-data', function (done) {
    var spec = {
      basePath: '/v2',
      paths: {
        '/pet/{id}': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: ['multipart/form-data'],
            parameters: [
              {
                in: 'path',
                name: 'id',
                type: 'integer',
                format: 'int32',
                required: true
              },
              {
                in: 'formData',
                name: 'name',
                type: 'string'
              },
              {
                in: 'formData',
                name: 'status',
                type: 'string',
                enum: [
                    'available',
                    'dead'
                ]
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://petstore.swagger.io/v2/swagger.json',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({id: 3, name: 'tony', status: 'dead'});
        expect(msg).toBe('curl -X POST --header \'Content-Type: multipart/form-data\' --header \'Accept: application/json\' -F name=tony -F status=dead  \'http://petstore.swagger.io/v2/pet/3\'');

        done();
      }
    });
  });

  it('masks passwords in curl example', function (done) {
    var spec = {
      basePath: '/v2',
      paths: {
        '/test': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            parameters: [
              {
                in: 'query',
                name: 'password',
                type: 'string',
                format: 'password',
                required: true
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://petstore.swagger.io/v2/swagger.json',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({password: 'hidden!'});
        expect(msg).toBe('curl -X POST --header \'Content-Type: application/json\' --header \'Accept: application/json\' \'http://petstore.swagger.io/v2/test?password=******\'');

        done();
      }
    });
  });


  it('shows curl for multipart/form-data with array parameters', function (done) {
    var spec = {
      basePath: '/v2',
      paths: {
        '/pet/{id}': {
          post: {
            tags: [ 'test' ],
            operationId: 'sample',
            consumes: ['multipart/form-data'],
            parameters: [
              {
                in: 'path',
                name: 'id',
                type: 'integer',
                format: 'int32',
                required: true
              },
              {
                in: 'formData',
                name: 'name',
                type: 'string'
              },
              {
                in: 'formData',
                name: 'file',
                type: 'file'
              },
              {
                in: 'formData',
                name: 'status',
                type: 'array',
                collectionFormat: 'pipes',
                items: {
                  type: 'string',
                  enum: [
                    'available',
                    'dead'
                  ]
                }
              }
            ]
          }
        }
      }
    };

    var client = new SwaggerClient({
      url: 'http://petstore.swagger.io/v2/swagger.json',
      spec: spec,
      success: function () {
        var msg = client.test.sample.asCurl({file: {}, id: 3, name: 'tony', status: ['alive','dead']});
        expect(msg).toBe('curl -X POST --header \'Content-Type: multipart/form-data\' --header \'Accept: application/json\' -F name=tony -F status=alive|dead  \'http://petstore.swagger.io/v2/pet/3\'');

        done();
      }
    });
  });
});
