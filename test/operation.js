var test = require('unit.js')
var should = require('should')
var swagger = require('../lib/swagger-client')

describe('url generation', function() {
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
  }

  it('should generate a url', function() {
    var parameters = [
      quantityQP
    ];
    var op = new swagger.Operation({}, 'test', 'get', 'path', { parameters: parameters });
    var url = op.urlify({
      quantity: 3
    });
    should(url).equal('path?quantity=3');
  })

  it('should generate a url with two params', function() {
    var parameters = [
      quantityQP, weightQP
    ];
    var op = new swagger.Operation({}, 'test', 'get', 'path', { parameters: parameters });
    var url = op.urlify({
      quantity: 3,
      weight: 100.3
    });
    should(url).equal('path?quantity=3&weight=100.3');
  })

  it('should generate a url with queryparams array, multi', function() {
    var parameters = [
      intArrayQP
    ];
    var op = new swagger.Operation({}, 'test', 'get', 'path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    should(url).equal('path?intArray=3,4,5');
  })

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
    var op = new swagger.Operation({}, 'test', 'get', 'path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    should(url).equal('path?intArray=3|4|5');
  })

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
    var op = new swagger.Operation({}, 'test', 'get', 'path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    should(url).equal('path?intArray=3\\t4\\t5');
  })

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
    var op = new swagger.Operation({}, 'test', 'get', 'path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    should(url).equal('path?intArray=3%204%205');
  })

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
    var op = new swagger.Operation({}, 'test', 'get', 'path', { parameters: parameters });
    var url = op.urlify({
      intArray: [3,4,5]
    });
    should(url).equal('path?intArray[]=3&intArray[]=4&intArray[]=5');
  })

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
    var op = new swagger.Operation({}, 'test', 'get', '/foo/{name}', { parameters: parameters });
    var url = op.urlify({
      name: 'tony',
      age: 42
    });
    should(url).equal('/foo/tony?age=42');
  })

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
    var op = new swagger.Operation({}, 'test', 'get', '/foo/{name}/bar', { parameters: parameters });
    var url = op.urlify({
      name: 'tony',
      age: 42
    });
    should(url).equal('/foo/tony/bar?age=42');
  })

  it('should generate a url with path param with proper escaping', function() {
    var parameters = [
      {
        in: 'path',
        name: 'name',
        type: 'string'
      }
    ];
    var op = new swagger.Operation({}, 'test', 'get', '/foo/{name}/bar', { parameters: parameters });
    var url = op.urlify({
      name: 'tony tam'
    });
    should(url).equal('/foo/tony%20tam/bar');
  })

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
    var op = new swagger.Operation({}, 'test', 'get', '/foo/{names}/bar', { parameters: parameters });
    var url = op.urlify({
      names: ['fred', 'bob', 'mary']
    });
    should(url).equal('/foo/fred,bob,mary/bar');
  })
})