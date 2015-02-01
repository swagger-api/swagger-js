var test = require('unit.js');
var expect = require('expect');
var swagger = require('../lib/swagger-client');

describe('models', function() {
  it('should verify the JSON sample for a simple object model', function() {
    var definition = {
      properties: {
        id: {
          type: "integer",
          format: "int64"
        },
        name: {
          type: "string"
        }
      }
    }
    var model = new swagger.Model('Tag', definition);
    expect(model.createJSONSample()).toEqual({ id: 0, name: 'string' })
  });

  it('should verify the JSON sample for a primitive array', function() {
    var definition = {
      type: "array",
      items: {
        type: "string"
      }
    }
    var model = new swagger.Model('Tag', definition);
    expect(model.createJSONSample()).toEqual(['string']);
  });

  it('should not fail to load an underspecified array', function() {
    var definition = {
      type: "object",
      properties: {
        id: {
          type: 'integer',
          format: 'int32'
        },
        name: {
          type: 'string'
        },
        photos: {
          type: 'array'
        }
      }
    }
    var model = new swagger.Model('Sample', definition);
    expect(model.createJSONSample()).toEqual({ id: 0, name: 'string', photos: [ {} ] });
  });

  it('should build a model signature', function() {
    var definition = {
      type: "object",
      properties: {
        id: {
          type: 'integer',
          format: 'int32'
        },
        name: {
          type: 'string'
        },
        photos: {
          type: 'array'
        }
      }
    }
    var model = new swagger.Model('Sample', definition);
    expect(model.getMockSignature()).toEqual('<span class="strong">Sample {</span><div><span class="propName false">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName false">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName false">photos</span> (<span class="propType">Array[object]</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span>');
  });
});