/* global describe, it */

'use strict';

var expect = require('expect');
var Model = require('../lib/types/model');

describe('models', function () {
  it('should verify the JSON sample for a simple object model', function () {
    var definition = {
      properties: {
        id: {
          type: 'integer',
          format: 'int64'
        },
        name: {
          type: 'string'
        }
      }
    };
    var model = new Model('Tag', definition);

    expect(model.createJSONSample()).toEqual({ id: 0, name: 'string' });
  });

  it('should verify the JSON sample for a primitive array', function () {
    var definition = {
      type: 'array',
      items: {
        type: 'string'
      }
    };
    var model = new Model('Tag', definition);

    expect(model.createJSONSample()).toEqual(['string']);
  });

  it('should not fail to load an underspecified array', function () {
    var definition = {
      type: 'object',
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
    var model = new Model('Sample', definition);

    expect(model.createJSONSample()).toEqual({ id: 0, name: 'string', photos: [ {} ] });
  });

  it('should build a model signature', function () {
    var definition = {
      type: 'object',
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
    var model = new Model('Sample', definition);

    expect(model.getMockSignature()).toEqual('<span class="strong">Sample {</span><div><span class="propName false">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName false">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName false">photos</span> (<span class="propType">Array[object]</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span>');
  });

  it('should build a model with an array and enum values', function () {
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
    // var model = new Model('Sample', definition);
    // var property = model.properties[0];

    new Model('Sample', definition);

    // TODO: verify that enums are represented in the mock signature
    // console.log(model.createJSONSample());
  });

  it('should not get infinite for sample JSON recursion', function () {
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
    var model = new Model('Component', definition);

    model.models = {
      Component: model
    };

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

  it('should not get infinite recursion for sample JSON case 2', function () {
    var definition = {
      type: 'array',
      items: {
        $ref: 'ListOfSelf'
      }
    };
    var model = new Model('ListOfSelf', definition);

    model.models = {
      ListOfSelf: model
    };

    expect(model.createJSONSample()).toEqual(
      [ 'ListOfSelf' ]
    );
  });

  it('should not get infinite recursion for sample JSON case 3', function () {
    var definition = {
      type: 'object',
      additionalProperties: {
        $ref: 'DictionaryOfSelf'
      }
    };
    var model = new Model('DictionaryOfSelf', definition);

    model.models = {
      DictionaryOfSelf: model
    };

    // console.log(model.createJSONSample());
    // TODO add support for this
  });


  it('should not get infinite for mock signature recursion', function () {
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
    var model = new Model('Component', definition);

    model.models = {
      Component: model
    };

    model.getMockSignature();
  });

  it('should not get infinite recursion for mock signature case 2', function () {
    var definition = {
      type: 'array',
      items: {
        $ref: 'ListOfSelf'
      }
    };
    var model = new Model('ListOfSelf', definition);

    model.models = {
      ListOfSelf: model
    };

    var sig = model.getMockSignature();

    expect(sig).toEqual('<span class="strong">array {</span><div></div><span class="strong">}</span>');
  });

  it('should show the correct models', function () {
    var test1 = {
      required: [ 'test1' ],
      properties: {
        test1: {
          $ref: '#/definitions/badgerfishstring'
        },
        test2: {
          $ref: '#/definitions/badgerfishstring'
        },
        test3: {
          $ref: '#/definitions/badgerfishstring'
        }
      }
    };
    var badgerfishstring = {
      'required': [ '$' ],
      'properties': {
        '$': { 'type': 'string' }
      }
    };
    var test1Model = new Model('test1', test1);

    test1Model.models.test1 = test1Model;

    var badgerfishstringModel = new Model('badgerfishstring', badgerfishstring);

    test1Model.models.badgerfishstring = badgerfishstringModel;

    expect(test1Model.createJSONSample()).toEqual({
      test1: { '$': 'string' },
      test2: { '$': 'string' },
      test3: { '$': 'string' }
    });
  });

  it('should handle object properties (Issue 230)', function () {
    var definition = {
      type: 'object',
      properties: {
        details: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            age: {
              type: 'integer'
            },
            social: {
              type: 'object',
              properties: {
                github: {
                  type: 'string'
                },
                twitter: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    };
    var model = new Model('Person', definition);

    expect(model.createJSONSample()).toEqual({
      details: {
        age: 0,
        name: 'string',
        social: {
          github: 'string',
          twitter: 'string'
        }
      }
    });

    expect(model.getMockSignature()).toEqual('<span class="strong">Person {</span><div><span class="strong">details {</span><div><span class="propName false">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName false">age</span> (<span class="propType">long</span>, <span class="propOptKey">optional</span>),</div><div><span class="strong">social {</span><div><span class="propName false">github</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName false">twitter</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span></div><span class="strong">}</span></div><span class="strong">}</span>');
  });
});
