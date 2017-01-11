/* global describe, it */

'use strict';

var auth = require('../lib/auth');
var expect = require('expect');
var Operation = require('../lib/types/operation');

var quantityQP = {
  in: 'query',
  name: 'quantity',
  type: 'integer',
  format: 'int32'
};
var weightQP = {
  in: 'query',
  name: 'weight',
  type: 'number',
  format: 'double'
};
var intArrayQP = {
  in: 'query',
  name: 'intArray',
  type: 'array',
  items: {
    type: 'integer',
    format: 'int32'
  },
  collectionFormat: 'csv'
};
var quantityFD = {
  in: 'formData',
  name: 'quantity',
  type: 'integer',
  format: 'int32'
};
var nameFD = {
  in: 'formData',
  name: 'name',
  type: 'string'
};
var langFD = {
  in: 'formData',
  name: 'lang',
  type: 'array',
  collectionFormat: 'csv'
};
var countryFD = {
  in: 'formData',
  name: 'country',
  type: 'array',
  collectionFormat: 'multi'
};


describe('operations', function () {
  it('should generate a url', function () {
    var parameters = [
      quantityQP
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      quantity: 3
    });

    expect(url).toBe('http://localhost/path?quantity=3');
  });

  it('should generate a url with two params', function () {
    var parameters = [
      quantityQP, weightQP
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      quantity: 3,
      weight: 100.3
    });

    expect(url).toBe('http://localhost/path?quantity=3&weight=100.3');
  });

  it('should generate a url with queryparams array, csv', function () {
    var parameters = [
      intArrayQP
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      intArray: [3,4,5]
    });

    expect(url).toBe('http://localhost/path?intArray=3,4,5');
  });

  it('should generate a url with queryparams array, pipes', function () {
    var parameters = [
      {
        in: 'query',
        name: 'intArray',
        type: 'array',
        items: {
          type: 'integer',
          format: 'int32'
        },
        collectionFormat: 'pipes'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      intArray: [3,4,5]
    });

    expect(url).toBe('http://localhost/path?intArray=3|4|5');
  });

  it('should generate a url with queryparams array, tabs', function () {
    var parameters = [
      {
        in: 'query',
        name: 'intArray',
        type: 'array',
        items: {
          type: 'integer',
          format: 'int32'
        },
        collectionFormat: 'tsv'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      intArray: [3,4,5]
    });

    expect(url).toBe('http://localhost/path?intArray=3%094%095');
  });

  it('should generate a url with queryparams array, spaces', function () {
    var parameters = [
      {
        in: 'query',
        name: 'intArray',
        type: 'array',
        items: {
          type: 'integer',
          format: 'int32'
        },
        collectionFormat: 'ssv'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      intArray: [3,4,5]
    });

    expect(url).toBe('http://localhost/path?intArray=3%204%205');
  });

  it('should generate a url with queryparams array, multi', function () {
    var parameters = [
      {
        in: 'query',
        name: 'intArray',
        type: 'array',
        items: {
          type: 'integer',
          format: 'int32'
        },
        collectionFormat: 'multi'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      intArray: [3,4,5]
    });

    expect(url).toBe('http://localhost/path?intArray=3&intArray=4&intArray=5');
  });

  it('should generate a url with queryparams array, brackets', function () {
    var parameters = [
      {
        in: 'query',
        name: 'intArray',
        type: 'array',
        items: {
          type: 'integer',
          format: 'int32'
        },
        collectionFormat: 'brackets'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      intArray: [3,4,5]
    });

    expect(url).toBe('http://localhost/path?intArray[]=3&intArray[]=4&intArray[]=5');
  });

  it('should generate a url with path param at end of path', function () {
    var parameters = [
      {
        in: 'path',
        name: 'name',
        type: 'string'
      },
      {
        in: 'query',
        name: 'age',
        type: 'integer',
        format: 'int32'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{name}', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      name: 'tony',
      age: 42
    });

    expect(url).toBe('http://localhost/foo/tony?age=42');
  });

  it('should generate a url with path param at middle of path', function () {
    var parameters = [
      {
        in: 'path',
        name: 'name',
        type: 'string'
      },
      {
        in: 'query',
        name: 'age',
        type: 'integer',
        format: 'int32'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{name}/bar', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      name: 'tony',
      age: 42
    });

    expect(url).toBe('http://localhost/foo/tony/bar?age=42');
  });

  it('should generate a url with path param with proper escaping', function () {
    var parameters = [
      {
        in: 'path',
        name: 'name',
        type: 'string'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{name}/bar', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      name: 'tony tam'
    });

    expect(url).toBe('http://localhost/foo/tony%20tam/bar');
  });

  it('should generate a url with path param with proper escaping, ignoring slashes if told to do so', function () {
    var parameters = [
      {
        in: 'path',
        name: 'location',
        type: 'string',
        'x-escape': false
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{location}', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      location: 'qux/baz.txt'
    });

    expect(url).toBe('http://localhost/foo/qux/baz.txt');
  });

  it('should generate a url with path param with proper escaping, ignoring slashes if told to do so, with multiple slashes', function () {
    var parameters = [
      {
        in: 'path',
        name: 'type',
        type: 'string',
        'x-escape': false
      },
      {
        in: 'path',
        name: 'location',
        type: 'string',
        'x-escape': false
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{type}/{location}', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      type: 'bar/bar',
      location: 'qux/baz.txt'
    });

    expect(url).toBe('http://localhost/foo/bar/bar/qux/baz.txt');
  });


  it('should generate a url with path param string array', function () {
    var parameters = [
      {
        in: 'path',
        name: 'names',
        type: 'array',
        items: {
          type: 'string'
        },
        collectionFormat: 'csv'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{names}/bar', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      names: ['fred', 'bob', 'mary']
    });

    expect(url).toBe('http://localhost/foo/fred,bob,mary/bar');
  });

  it('should correctly replace path params', function () {
    var parameters = [
      { in: 'path', name: 'a0', type: 'string' },
      { in: 'path', name: 'a01', type: 'string' },
      { in: 'path', name: 'a02', type: 'string' },
      { in: 'path', name: 'a03', type: 'string' }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path/{a0}/{a01}/{a02}/{a03}', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify(
      {a0: 'foo', a01: 'bar', a02: 'bat', a03: 'baz'}
    );

    expect(url).toBe('http://localhost/path/foo/bar/bat/baz');
  });

  it('should correctly replace path params with hyphens', function () {
    var parameters = [
      { in: 'path', name: 'a-0', type: 'string' }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path/{a-0}/', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify(
      {'a-0': 'foo'}
    );

    expect(url).toBe('http://localhost/path/foo/');
  });

  it('should correctly replace path params with hyphens', function () {
    var parameters = [
      { in: 'path', name: 'year', type: 'string' },
      { in: 'path', name: 'month', type: 'string' },
      { in: 'path', name: 'day', type: 'string' }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/{year}-{month}-{day}', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify(
      { year: 2015, month: '01', day: '30'}
    );

    expect(url).toBe('http://localhost/2015-01-30');
  });

  it('should generate a url with empty-fragment removed from path', function () {
    var parameters = [];
    var op = new Operation({}, 'http', 'test', 'get', '/foo#', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify();

    expect(url).toBe('http://localhost/foo');
  });

  it('should generate a url with fragment removed from path', function () {
    var parameters = [
      {
        in: 'path',
        name: 'name',
        type: 'string'
      },
      {
        in: 'query',
        name: 'age',
        type: 'integer',
        format: 'int32'
      }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/foo/{name}#fragment', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    var url = op.urlify({
      name: 'tony',
      age: 42
    });

    expect(url).toBe('http://localhost/foo/tony?age=42');
  });

  it('should get a string array signature', function () {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string'} }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());

    expect(op.parameters[0].signature).toEqual('Array[string]');
  });

  it('should get the inline schema signature, as a rendered model', function () {
    var parameters = [{
      name: 'test',
      in: 'body',
      schema: {
        type: 'object',
        properties: { foo:  { type: 'string' }
        }
      }
    }];


    var op = new Operation({}, 'http', 'test', 'get', '/fantastic',
                           { parameters: parameters }, {},{}, new auth.SwaggerAuthorizations());

    // Test raw html string
    expect(op.parameters[0].signature).toBe('<span class=\"strong\">Inline Model {</span><div><span class=\"propName \">foo</span> (<span class=\"propType\">string</span>, <span class=\"propOptKey\">optional</span>)</div><span class=\"strong\">}</span>');

  });

  // only testing for swagger-ui#1133...pending more logic clarification
  it('should return some object like string for inline objects.',function() {

    var parameters = [{
      name: 'test',
      in: 'body',
      schema: {
        type: 'object',
        properties: {
          josh: {
            type: 'string'
          }
        }
      }
    }];

    var op = new Operation({}, 'http', 'test', 'get', '/fantastic',
                           { parameters: parameters }, {},{}, new auth.SwaggerAuthorizations());
    var param = op.parameters[0];

    expect(param.sampleJSON).toEqual('{\n  \"josh\": \"string\"\n}');
  });

  // only testing for swagger-ui#1037, should correctly render parameter models wrapped with Array
  it('parameters models wrapped in Array, should have #sampleJSON',function() {

    var parameters = [{
      name: 'test',
      in: 'body',
      schema: {
        type: 'array',
        items: {
          '$ref': '#/definitions/TestModel'
        }
      }
    }];

    var definitions = {
      TestModel: {
        type: 'object',
        properties: {
          foo:  {
            type: 'string'
          }
        }
      }
    };

    var op = new Operation({}, 'http', 'test', 'get', '/fantastic',
                           { parameters: parameters }, definitions, {}, new auth.SwaggerAuthorizations());
    var param = op.parameters[0];

    expect(param.sampleJSON).toEqual('[\n  {\n    \"foo\": \"string\"\n  }\n]');
  });

  it('should get a date array signature', function () {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());

    expect(op.parameters[0].signature).toEqual('Array[date-time]');
  });

  it('should process the deprecated flag as boolean true', function () {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: true },
                                   {}, {}, new auth.SwaggerAuthorizations());

    expect(op.deprecated).toEqual(true);
  });

  it('should process the deprecated flag as boolean false', function () {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: false },
                                   {}, {}, new auth.SwaggerAuthorizations());

    expect(op.deprecated).toEqual(false);
  });

  it('should process the deprecated flag as string true', function () {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: 'true' },
                                   {}, {}, new auth.SwaggerAuthorizations());

    expect(op.deprecated).toEqual(true);
  });

  it('should process the deprecated flag as string false', function () {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: 'false' },
                                   {}, {}, new auth.SwaggerAuthorizations());

    expect(op.deprecated).toEqual(false);
  });

  it('should not encode parameters of type header', function () {
    var parameters = [
      { in: 'header', name: 'user name', type: 'string' }
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic', {parameters: parameters, deprecated: 'false'},
                                   {}, {}, new auth.SwaggerAuthorizations());
    var args = {'user name': 'Tony Tam'};
    var opts = {mock: true};
    var obj = op.execute(args, opts);

    expect(typeof obj.headers['user name'] === 'string').toBe(true);
    expect(obj.headers['user name']).toEqual('Tony Tam');
  });

  it('should handle a path with @ sign', function () {
    var op = new Operation({}, 'http', 'test', 'get', '/fantastic/@me', {parameters: {}, deprecated: 'false'},
                                   {}, {}, new auth.SwaggerAuthorizations());
    var opts = {mock: true};

    op.execute({}, opts);
  });

  it('should set the content-accept header, from opts#responseContentType in operation#execute',function() {
    var mimeTest = 'application/test';
    var opts = {
      mock: true,
      responseContentType: mimeTest
    };

    var op = new Operation({}, 'http', 'test', 'get', '/path', {},
                                   {}, {}, new auth.SwaggerAuthorizations());
    var obj = op.execute({}, opts);

    expect(obj.headers.Accept).toBe(mimeTest);
  });

  // issue#1166
  it('should default the content-accept header to one found in operation#produces',function() {
    var mimeTest = 'application/test';

    var args = {
      produces: [mimeTest]
    };

    var op = new Operation({}, 'http', 'test', 'get', '/path', args,
                                   {}, {}, new auth.SwaggerAuthorizations());

    var obj = op.execute({}, {mock: true});

    expect(obj.headers.Accept).toBe(mimeTest);
  });

  it('should default to a global "consumes/produces" if none found in the "operation"', function() {

    var parent = {
      produces: [
        'application/produces'
      ],
      consumes: [
        'application/consumes'
      ]
    };

    // I need a body for Content-Type header to be set (which is how I know that 'consumes' is working)
    var parameters = [
      { in: 'body', name: 'josh', type: 'string' }
    ];
    // No produces/consumes on operation...
    var args = {
      'parameters': parameters
    };

    // make sure we have method that has a body payload
    var op = new Operation(parent, 'http', 'test', 'post', '/path', args,
                                   {}, {}, new auth.SwaggerAuthorizations());

    // my happy payload...
    args = {'josh': 'hello'};
    var opts = {mock: true};
    var obj = op.execute(args, opts);

    // Check end result of "produces"/"consumes"
    expect(obj.headers.Accept).toBe('application/produces');
    expect(obj.headers['Content-Type']).toBe('application/consumes');

  });

  it('should default to application/json if it can', function(){

    // A parent with two consumes and consumes
    var parent = {
      produces: [
        'application/produces',
        'application/json' // note that application/json /isn't/ the first item
      ],
      consumes: [
        'application/consumes',
        'application/json'
      ]
    };

    var parameters = [ { in: 'body', name: 'josh', type: 'string' } ];
    var args = { 'parameters': parameters };

    // make sure we have method that has a body payload
    var op = new Operation(parent, 'http', 'test', 'post', '/path', args,
                                   {}, {}, new auth.SwaggerAuthorizations());

    // my happy payload...
    args = {'josh': 'hello'};
    var opts = {mock: true};
    var obj = op.execute(args, opts);

    // Check end result of "produces"/"consumes"
    expect(obj.headers.Accept).toBe('application/json');
    expect(obj.headers['Content-Type']).toBe('application/json');

  });

  it('should default the content-accept header to application/json, as last resort',function() {
    var op = new Operation({}, 'http', 'test', 'get', '/path', {},
                                   {}, {}, new auth.SwaggerAuthorizations());
    var obj = op.execute({}, {mock: true});
    expect(obj.headers.Accept).toBe('application/json');
  });

  it('booleans can have a flexible default value, "false" or false are valid', function() {

    var parameters = [
      { in: 'query', name: 'strTrue', type: 'boolean', default: 'true' },
      { in: 'query', name: 'True', type: 'boolean', default: true },
      { in: 'query', name: 'strFalse', type: 'boolean', default: 'false' },
      { in: 'query', name: 'False', type: 'boolean', default: false },
      { in: 'query', name: 'None', type: 'boolean'},
    ];

    // make sure we have method that has a body payload
    var op = new Operation({}, 'http', 'test', 'post', '/path', {parameters: parameters}, {}, {}, new auth.SwaggerAuthorizations());

    // default = 'true'
    var p = op.parameters[0];
    expect(p.allowableValues.descriptiveValues[0].value).toBe('true'); // make sure we have the right order
    expect(p.allowableValues.descriptiveValues[0].isDefault).toBe(true);  // true is the default
    expect(p.allowableValues.descriptiveValues[1].isDefault).toBe(false);

    // default = true
    p = op.parameters[1];
    expect(p.allowableValues.descriptiveValues[0].isDefault).toBe(true);  // true is the default
    expect(p.allowableValues.descriptiveValues[1].isDefault).toBe(false);

    // default = 'false'
    p = op.parameters[2];
    expect(p.allowableValues.descriptiveValues[0].isDefault).toBe(false);
    expect(p.allowableValues.descriptiveValues[1].isDefault).toBe(true); // false is the default

    // default = false
    p = op.parameters[3];
    expect(p.allowableValues.descriptiveValues[0].isDefault).toBe(false);
    expect(p.allowableValues.descriptiveValues[1].isDefault).toBe(true); // false is the default
  });

  it('should omit */* warnings', function() {
    var parameters = [
      quantityQP
    ];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    expect(op.matchesAccept('application/json')).toEqual(true);

    expect(op.matchesAccept('text/html')).toEqual(false);

    op.produces.push('*/*');
    expect(op.matchesAccept('text/html')).toEqual(true);
    expect(op.matchesAccept('application/json')).toEqual(true);

    op.produces = ['*/*'];
    expect(op.matchesAccept('text/html')).toEqual(true);
    expect(op.matchesAccept('application/json')).toEqual(true);

    // no accepts, no produces, no problem!
    expect(op.matchesAccept()).toEqual(true);

    op.produces = undefined;
    expect(op.matchesAccept()).toEqual(true);
    expect(op.matchesAccept('application/json')).toEqual(true);
  });

  it('should generate a x-www-form-urlencoded body', function() {
    var parameters = [quantityFD, nameFD];
    var op = new Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters },
                                   {}, {}, new auth.SwaggerAuthorizations());
    expect(op.getBody({}, {name: 'Douglas Adams', quantity: 42}, {})).toEqual('quantity=42&name=Douglas%20Adams');
  });

  it('should generate a multipart/form-data body with correct strings for array-like values', function () {
    var parameters = [langFD, countryFD, nameFD];
    var op = new Operation({}, 'http', 'test', 'post', '/path', { parameters: parameters}, {}, {}, new auth.SwaggerAuthorizations());

    var body = op.getBody({'Content-Type': 'multipart/form-data'}, {lang: ['en', 'de'], country: ['US', 'DE'], name: 'Douglas Adams'}, {});

    expect(body.lang[0]).toBe('en');
    expect(body.lang[1]).toBe('de');

    console.log(body);
  });

  // options.timeout
  it('should use timeout specified on client by default', function () {
    var parent = {
      timeout: 1
    };

    var op = new Operation(parent, 'http', 'test', 'get', '/path', {},
                                   {}, {}, new auth.SwaggerAuthorizations());
    var result = op.execute({}, {mock: true});

    expect(result.timeout).toBe(1, 'Operation.execute timeout was not applied from client');
  });
  //
  it('should prefer timeout passed in execute options over client', function () {
    var parent = {
      timeout: 1
    };

    var op = new Operation(parent, 'http', 'test', 'get', '/path', {},
                                   {}, {}, new auth.SwaggerAuthorizations());
    var result = op.execute({}, {
      mock: true,
      timeout: 2
    });

    expect(result.timeout).toBe(2, 'Operation.execute timeout was not applied from options');
  });
});
