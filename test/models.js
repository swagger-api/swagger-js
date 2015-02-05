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

  it('should build a model with an array and enum values', function() {
    var definition = {
      type: 'object',
      properties: {
        name: {
          type: 'array',
          items: {
            type: 'string',
            enum: [ 'value1', 'value2', 'value3', 'value4']
          }
        }
      }
    }
    var model = new swagger.Model('Sample', definition);
    var property = model.properties[0];
    // TODO: verify that enums are represented in the mock signature
    console.log(model.createJSONSample());
  });

  it('should not get infinite recursion', function() {
    var definition = {
      type: 'object',
      properties: {
        pendingComponents: {
          type: 'array',
          items: {
            $ref: 'Component'
          }
        },
        receivedComponents: {
          type: 'array',
          items: {
            $ref: 'Component'
          }
        },
        rejectedComponents: {
          type: 'array',
          items: {
            $ref: 'Component'
          }
        }
      }
    }
    var model = new swagger.Model('Component', definition);
    swagger.models['Component'] = model;
    expect(model.createJSONSample()).toEqual(
      {
        pendingComponents: [
          'Component'
        ],
        receivedComponents: [
          'Component'
        ],
        rejectedComponents: [
          'Component'
        ]
      }
    );
  });

  it('should not get infinite recursion case 2', function() {
    var definition = {
      type: "array",
      items: {
        $ref: "ListOfSelf"
      }
    };
    var model = new swagger.Model('ListOfSelf', definition);
    swagger.models['ListOfSelf'] = model;
    expect(model.createJSONSample()).toEqual(
      [ 'ListOfSelf' ]
    );
  });

  it('should not get infinite recursion case 3', function() {
    definition = {
      type: 'object',
      additionalProperties: {
        $ref: 'DictionaryOfSelf'
      }
    };
    var model = new swagger.Model('DictionaryOfSelf', definition);
    swagger.models['DictionaryOfSelf'] = model;
    // console.log(model.createJSONSample());
    // TODO add support for this
  });
});
