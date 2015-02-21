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
    };
    var model = new swagger.Model('Tag', definition);
    expect(model.createJSONSample()).toEqual({ id: 0, name: 'string' });
  });

  it('should verify the JSON sample for a primitive array', function() {
    var definition = {
      type: "array",
      items: {
        type: "string"
      }
    };
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
    };
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
    };
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
    };
    var model = new swagger.Model('Sample', definition);
    var property = model.properties[0];
    // TODO: verify that enums are represented in the mock signature
    // console.log(model.createJSONSample());
  });

  it('should not get infinite for sample JSON recursion', function() {
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
    };
    var model = new swagger.Model('Component', definition);
    swagger.addModel('Component', model);
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

  it('should not get infinite recursion for sample JSON case 2', function() {
    var definition = {
      type: "array",
      items: {
        $ref: "ListOfSelf"
      }
    };
    var model = new swagger.Model('ListOfSelf', definition);
    swagger.addModel('ListOfSelf', model);
    expect(model.createJSONSample()).toEqual(
      [ 'ListOfSelf' ]
    );
  });

  it('should not get infinite recursion for sample JSON case 3', function() {
    definition = {
      type: 'object',
      additionalProperties: {
        $ref: 'DictionaryOfSelf'
      }
    };

    var model = new swagger.Model('DictionaryOfSelf', definition);
    swagger.addModel.DictionaryOfSelf = model;
    // console.log(model.createJSONSample());
    // TODO add support for this
  });


  it('should not get infinite for mock signature recursion', function() {
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
    };
    var model = new swagger.Model('Component', definition);
    swagger.addModel('Component', model);
    var sig = model.getMockSignature();
  });

  it('should not get infinite recursion for mock signature case 2', function() {
    var definition = {
      type: "array",
      items: {
        $ref: "ListOfSelf"
      }
    };
    var model = new swagger.Model('ListOfSelf', definition);
    swagger.addModel('ListOfSelf', model);
    var sig = model.getMockSignature();
    expect(sig).toEqual('<span class="strong">array {</span><div></div><span class="strong">}</span>');
  });

  it('should show the correct models', function() {
    var test1 = {
      "required": [ "test1" ],
      "properties": {
        "test1": {
          "$ref": "#/definitions/badgerfishstring"
        },
        "test2": {
          "$ref": "#/definitions/badgerfishstring"
        },
        "test3": {
          "$ref": "#/definitions/badgerfishstring"
        }
      }
    };

    var badgerfishstring = {
      "required": [ "$" ],
      "properties": {
        "$": { "type": "string" }
      }
    };

    var test1Model = new swagger.Model('test1', test1);
    swagger.addModel('test1', test1Model);
    var badgerfishstringModel = new swagger.Model('badgerfishstring', badgerfishstring);
    swagger.addModel('badgerfishstring', badgerfishstringModel);

    expect(test1Model.createJSONSample()).toEqual({
      test1: { '$': 'string' },
      test2: { '$': 'string' },
      test3: { '$': 'string' }
    });
  });
});
