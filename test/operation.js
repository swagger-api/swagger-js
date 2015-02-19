var test = require('unit.js');
var expect = require('expect');
var swagger = require('../lib/swagger-client');

describe('operations', function() {
  it('should generate a url', function() {
    var parameters = [
      quantityQP
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var url = op.urlify({
      quantity: 3
    });
    expect(url).toBe('http://localhost/path?quantity=3');
  });

  it('should generate a url with two params', function() {
    var parameters = [
      quantityQP, weightQP
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var url = op.urlify({
      quantity: 3,
      weight: 100.3
    });
    expect(url).toBe('http://localhost/path?quantity=3&weight=100.3');
  });

  it('should generate a url with queryparams array, multi', function() {
    var parameters = [
      intArrayQP
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    expect(url).toBe('http://localhost/path?intArray=3,4,5');
  });

  it('should generate a url with queryparams array, pipes', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    expect(url).toBe('http://localhost/path?intArray=3|4|5');
  });

  it('should generate a url with queryparams array, tabs', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    expect(url).toBe('http://localhost/path?intArray=3\\t4\\t5');
  });

  it('should generate a url with queryparams array, spaces', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    expect(url).toBe('http://localhost/path?intArray=3%204%205');
  });

  it('should generate a url with queryparams array, brackets', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    expect(url).toBe('http://localhost/path?intArray[]=3&intArray[]=4&intArray[]=5');
  });

  it('should generate a url with path param at end of path', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/foo/{name}', { parameters: parameters });
    var url = op.urlify({
      name: 'tony',
      age: 42
    });
    expect(url).toBe('http://localhost/foo/tony?age=42');
  });

  it('should generate a url with path param at middle of path', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/foo/{name}/bar', { parameters: parameters });
    var url = op.urlify({
      name: 'tony',
      age: 42
    });
    expect(url).toBe('http://localhost/foo/tony/bar?age=42');
  });

  it('should generate a url with path param with proper escaping', function() {
    var parameters = [
      {
        in: 'path',
        name: 'name',
        type: 'string'
      }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/foo/{name}/bar', { parameters: parameters });
    var url = op.urlify({
      name: 'tony tam'
    });
    expect(url).toBe('http://localhost/foo/tony%20tam/bar');
  });

  it('should generate a url with path param string array', function() {
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
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/foo/{names}/bar', { parameters: parameters });
    var url = op.urlify({
      names: ['fred', 'bob', 'mary']
    });
    expect(url).toBe('http://localhost/foo/fred,bob,mary/bar');
  });

  it('should correctly replace path params', function() {
    var parameters = [
      { in: 'path', name: 'a0', type: 'string' },
      { in: 'path', name: 'a01', type: 'string' },
      { in: 'path', name: 'a02', type: 'string' },
      { in: 'path', name: 'a03', type: 'string' }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path/{a0}/{a01}/{a02}/{a03}', { parameters: parameters });
    var url = op.urlify(
      {a0: 'foo', a01: 'bar', a02: 'bat', a03: 'baz'}
    );
    expect(url).toBe('http://localhost/path/foo/bar/bat/baz');
  });

  it('should correctly replace path params with hyphens', function() {
    var parameters = [
      { in: 'path', name: 'a-0', type: 'string' }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/path/{a-0}/', { parameters: parameters });
    var url = op.urlify(
      {'a-0': 'foo'}
    );
    expect(url).toBe('http://localhost/path/foo/');
  });

  it('should correctly replace path params with hyphens', function() {
    var parameters = [
      { in: 'path', name: 'year', type: 'string' },
      { in: 'path', name: 'month', type: 'string' },
      { in: 'path', name: 'day', type: 'string' }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/{year}-{month}-{day}', { parameters: parameters });
    var url = op.urlify(
      { year: 2015, month: '01', day: '30'}
    );
    expect(url).toBe('http://localhost/2015-01-30');
  });

  it('should get a string array signature', function() {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string'} }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters });
    expect(op.parameters[0].signature).toEqual('Array[string]');
  });

  it('should get a date array signature', function() {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters });
    expect(op.parameters[0].signature).toEqual('Array[date-time]');
  });

  it('should process the deprecated flag as boolean true', function() {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: true });
    expect(op.deprecated).toEqual(true);
  });

  it('should process the deprecated flag as boolean false', function() {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: false });
    expect(op.deprecated).toEqual(false);
  });

  it('should process the deprecated flag as string true', function() {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: 'true' });
    expect(op.deprecated).toEqual(true);
  });

  it('should process the deprecated flag as string false', function() {
    var parameters = [
      { in: 'query', name: 'year', type: 'array', items: {type: 'string', format: 'date-time'} }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: 'false' });
    expect(op.deprecated).toEqual(false);
  });

  it('should not encode parameters of type header', function() {
    var parameters = [
      { in: 'header', name: 'user name', type: 'string' }
    ];
    var op = new swagger.Operation({}, 'http', 'test', 'get', '/fantastic', { parameters: parameters, deprecated: 'false' });
    var args = {'user name': 'Tony Tam'};
    var opts = {mock: true};
    var obj = op.execute(args, opts);
    expect(typeof obj.headers['user name'] === 'string').toBe(true);
    expect(obj.headers['user name']).toEqual('Tony Tam');
  });
});

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
