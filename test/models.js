/* global describe, it */

'use strict';

var _ = require('lodash-compat');
var expect = require('expect');
var Model = require('../lib/types/model');
var petstore = require('./spec/v2/petstore.json');
var SwaggerClient = require('..');

describe('models', function () {
  it('should use model title only when needed', function () {
    var definition = {
      type: 'object',
      title: 'A very mean Sample',
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
    expect(model.name).toBe('Sample');
  });

  it('should allow an attribute named `nodeName` #546', function () {
    var definition = {
      properties: {
        nodeName: {
          type: 'string'
        }
      }
    };
    var model = new Model('Node', definition);

    expect(model.createJSONSample()).toEqual({ nodeName: 'string' });
  });

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

  it('should use the JSON sample on the object level', function () {
    var definition = {
      example: '// Manual example',
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

    expect(model.createJSONSample()).toEqual('// Manual example');
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
          format: 'int32',
          default: 0
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
    expect(model.getMockSignature()).toBe('<span class=\"strong\">Sample {</span><div><span class=\"propName \">id</span> (<span class=\"propType\">integer</span>, <span class=\"propOptKey\">optional</span>),</div><div><span class=\"propName \">name</span> (<span class=\"propType\">string</span>, <span class=\"propOptKey\">optional</span>),</div><div><span class=\"propName \">photos</span> (<span class=\"propType\">Array[object]</span>, <span class=\"propOptKey\">optional</span>)</div><span class=\"strong\">}</span>');
  });

  it('should build a model signature using inline title (Issue 1104)', function () {
    var definition = {
      type: 'object',
      title: 'Rad Object',
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
    var model = new Model(null, definition);

    expect(model.getMockSignature()).toBe('<span class=\"strong\">Rad Object {</span><div><span class=\"propName \">id</span> (<span class=\"propType\">integer</span>, <span class=\"propOptKey\">optional</span>),</div><div><span class=\"propName \">name</span> (<span class=\"propType\">string</span>, <span class=\"propOptKey\">optional</span>),</div><div><span class=\"propName \">photos</span> (<span class=\"propType\">Array[object]</span>, <span class=\"propOptKey\">optional</span>)</div><span class=\"strong\">}</span>');

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
          {}
        ],
        receivedComponents: [
          {}
        ],
        rejectedComponents: [
          {}
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

    expect(model.createJSONSample()).toEqual([[]]);
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

    model.createJSONSample();
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

    expect(sig).toEqual('<span class="strong">ListOfSelf [</span><div>ListOfSelf</div><span class="strong">]</span>');
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

    expect(model.getMockSignature()).toBe('<span class=\"strong\">Person {</span><div><span class=\"propName \">details</span> (<span class=\"propType\">Inline Model 1</span>, <span class=\"propOptKey\">optional</span>)</div><span class=\"strong\">}</span><br /><span class=\"strong\">Inline Model 1 {</span><div><span class=\"propName \">name</span> (<span class=\"propType\">string</span>, <span class=\"propOptKey\">optional</span>),</div><div><span class=\"propName \">age</span> (<span class=\"propType\">integer</span>, <span class=\"propOptKey\">optional</span>),</div><div><span class=\"propName \">social</span> (<span class=\"propType\">Inline Model 2</span>, <span class=\"propOptKey\">optional</span>)</div><span class=\"strong\">}</span><br /><span class=\"strong\">Inline Model 2 {</span><div><span class=\"propName \">github</span> (<span class=\"propType\">string</span>, <span class=\"propOptKey\">optional</span>),</div><div><span class=\"propName \">twitter</span> (<span class=\"propType\">string</span>, <span class=\"propOptKey\">optional</span>)</div><span class=\"strong\">}</span>');

  });

  it('should properly render an array of models (Issue 270)', function (done) {
    var client = new SwaggerClient({
      spec: petstore,
      success: function () {
        var expectedJson = [
          {
            id: 0,
            category: {
              id: 0,
              name: 'string'
            },
            name: 'doggie',
            photoUrls: [
              'string'
            ],
            tags: [
              {
                id: 0,
                name: 'string'
              }
            ],
            status: 'string'
          }
        ];
        var response = client.pet.operations.findPetsByStatus.successResponse['200'];

        expect(response.createJSONSample()).toEqual(expectedJson);
        expect(response.getSampleValue()).toEqual(expectedJson);
        expect(response.getMockSignature()).toBe('<span class="strong">PetArray [</span><div>Pet</div><span class="strong">]</span><br /><span class="strong">Pet {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">category</span> (<span class="propType">Category</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName required">name</span> (<span class="propType">string</span>),</div><div><span class="propName required">photoUrls</span> (<span class="propType">Array[string]</span>),</div><div><span class="propName ">tags</span> (<span class="propType">Array[Tag]</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">status</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>): <span class="propDesc">pet status in the store</span></div><span class="strong">}</span><br /><span class="strong">Category {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span><br /><span class="strong">Tag {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span>');
        done();
      }
    });
  });

  it('should properly handle enum', function (done) {
    var cloned = _.cloneDeep(petstore);

    cloned.definitions.Pet.properties.status.enum = [
      'available',
      'pending',
      'sold'
    ];

    var client = new SwaggerClient({
      spec: cloned,
      success: function () {
        var expectedJson = [
          {
            id: 0,
            category: {
              id: 0,
              name: 'string'
            },
            name: 'doggie',
            photoUrls: [
              'string'
            ],
            tags: [
              {
                id: 0,
                name: 'string'
              }
            ],
            status: 'available'
          }
        ];
        var response = client.pet.operations.findPetsByStatus.successResponse['200'];

        expect(response.createJSONSample()).toEqual(expectedJson);
        expect(response.getSampleValue()).toEqual(expectedJson);
        //expect(response.getMockSignature()).toBe('<span class="strong">PetArray [</span><div>Pet</div><span class="strong">]</span><br /><span class="strong">Pet {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">category</span> (<span class="propType">Category</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName required">name</span> (<span class="propType">string</span>),</div><div><span class="propName required">photoUrls</span> (<span class="propType">Array[string]</span>),</div><div><span class="propName ">tags</span> (<span class="propType">Array[Tag]</span>, <span class="propOptKey">optional</span>),</div><div><span class="propWrap"><span class="propName ">status</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>): <span class="propDesc">pet status in the store</span> = <span class="propVals">[\'available\', \'pending\', \'sold\']</span><table class="optionsWrapper"><tr><th colspan="2">string</th></tr><tr><td class="optionName">Enum:</td><td>"available", "pending", "sold"</td></tr></table></span></div><span class="strong">}</span><br /><span class="strong">Category {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span><br /><span class="strong">Tag {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span>');

        done();
      }
    });
  });

  it('should support an array of items with an enum (Issue 198)', function (done) {
    var cloned = _.cloneDeep(petstore);

    cloned.definitions.Statuses = {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'available',
          'pending',
          'sold'
        ]
      }
    };

    var path = cloned.paths['/pet/statuses'] = _.cloneDeep(cloned.paths['/pet/findByStatus']);

    path.get.operationId = 'listPetStatuses';
    path.get.parameters = [];
    path.get.responses['200'].schema = {
      $ref: '#/definitions/Statuses'
    };

    var client = new SwaggerClient({
      spec: cloned,
      success: function () {
        var response = client.pet.operations.listPetStatuses.successResponse['200'];

        expect(response.createJSONSample()).toEqual(['available']);
        expect(response.getSampleValue()).toEqual(['available']);
        expect(response.getMockSignature()).toEqual('<span class="strong">Statuses [</span><div><span class="propWrap">string<table class="optionsWrapper"><tr><th colspan="2">string</th></tr><tr><td class="optionName">Enum:</td><td>"available", "pending", "sold"</td></tr></table></span></div><span class="strong">]</span>');

        done();
      }
    });
  });

  it('should support an array of items with an enum in the wrong place (Issue 198)', function (done) {
    var cloned = _.cloneDeep(petstore);

    cloned.definitions.Statuses = {
      type: 'array',
      items: {
        type: 'string'
      },
      enum: [
        'available',
        'pending',
        'sold'
      ]
    };

    var path = cloned.paths['/pet/statuses'] = _.cloneDeep(cloned.paths['/pet/findByStatus']);

    path.get.operationId = 'listPetStatuses';
    path.get.parameters = [];
    path.get.responses['200'].schema = {
      $ref: '#/definitions/Statuses'
    };

    var client = new SwaggerClient({
      spec: cloned,
      success: function () {
        var response = client.pet.operations.listPetStatuses.successResponse['200'];

        expect(response.createJSONSample()).toEqual(['string']);
        expect(response.getSampleValue()).toEqual(['string']);
        expect(response.getMockSignature()).toEqual('<span class="strong">Statuses [</span><div>string</div><span class="strong">]</span>');

        done();
      }
    });
  });

  it('should handle arrays that are missing its items property (Issue 190)', function (done) {
    var cloned = _.cloneDeep(petstore);

    delete cloned.definitions.PetArray.items;

    var client = new SwaggerClient({
      spec: cloned,
      success: function () {
        var response = client.pet.operations.findPetsByStatus.successResponse['200'];

        expect(response.createJSONSample()).toEqual([{}]);
        expect(response.getSampleValue()).toEqual([{}]);
        expect(response.getMockSignature()).toEqual('<span class="strong">PetArray [</span><div>object</div><span class="strong">]</span>');

        done();
      }
    });
  });

  it('should handle references to inline primitive definitions (Issue 339)', function (done) {
    var cloned = _.cloneDeep(petstore);

    cloned.definitions.ApplicationConfigPatch = {
      type : 'object',
      properties : {
        variantManagement : {
          $ref : '#/definitions/OperationalState'
        }
      }
    };
    cloned.definitions.OperationalState = {
      type : 'string',
      enum : [
        'Enabled',
        'Disabled'
      ]
    };

    cloned.paths['/pet/findByStatus'].get.responses['200'].schema = {
      $ref: '#/definitions/ApplicationConfigPatch'
    };

    var client = new SwaggerClient({
      spec: cloned,
      success: function () {
        var response = client.pet.operations.findPetsByStatus.successResponse['200'];

        expect(response.createJSONSample()).toEqual({variantManagement: 'Enabled'});
        expect(response.getSampleValue()).toEqual({variantManagement: 'Enabled'});
        //expect(response.getMockSignature()).toBe('<span class=\"strong\">ApplicationConfigPatch {</span><div><span class=\"propWrap\"><span class=\"propName \">variantManagement</span> (<span class=\"propType\">string</span>, <span class=\"propOptKey\">optional</span>) = <span class=\"propVals\">[\'Enabled\', \'Disabled\']</span><table class=\"optionsWrapper\"><tr><th colspan=\"2\">string</th></tr><tr><td class=\"optionName\">Enum:</td><td>\"Enabled\", \"Disabled\"</td></tr></table></span></div><span class=\"strong\">}</span>');

        done();
      }
    });
  });

  it('should not fail on missing references (Issue 419)', function (done) {
    var cloned = _.cloneDeep(petstore);

    cloned.definitions.DefinitionWithMissingModel = {
      type : 'object',
      required: ['variantManagement'],
      properties : {
        variantManagement : {
          $ref : '#/definitions/YouWontFindThis'
        }
      }
    };
    cloned.definitions.OperationalState = {
      type : 'string',
      enum : [
        'Enabled',
        'Disabled'
      ]
    };

    cloned.paths['/pet/findByStatus'].get.responses['200'].schema = {
      $ref: '#/definitions/DefinitionWithMissingModel'
    };

    var client = new SwaggerClient({
      spec: cloned,
      success: function () {
        client.models.DefinitionWithMissingModel.getMockSignature();
        client.models.DefinitionWithMissingModel.createJSONSample();
        done();
      }
    });
  });

  it('should properly render optional flags (Issue https://github.com/swagger-api/swagger-ui/issues/1260)', function (done) {
    var client = new SwaggerClient({
      spec: petstore,
      success: function () {
        var response = client.pet.operations.findPetsByStatus.successResponse['200'];
        expect(response.getMockSignature()).toEqual('<span class="strong">PetArray [</span><div>Pet</div><span class="strong">]</span><br /><span class="strong">Pet {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">category</span> (<span class="propType">Category</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName required">name</span> (<span class="propType">string</span>),</div><div><span class="propName required">photoUrls</span> (<span class="propType">Array[string]</span>),</div><div><span class="propName ">tags</span> (<span class="propType">Array[Tag]</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">status</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>): <span class="propDesc">pet status in the store</span></div><span class="strong">}</span><br /><span class="strong">Category {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span><br /><span class="strong">Tag {</span><div><span class="propName ">id</span> (<span class="propType">integer</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span>');
        done();
      }
    });
  });

  it('allOf test for #843', function(done) {
    var spec = {
      swagger: '2.0',
      paths: {
        '/persons': {
          get: {
            tags: [
                'fun'
            ],
            operationId: 'test',
            responses: {
              '200': {
                schema: {
                  allOf: [
                    {$ref: '#/definitions/OkResponse'},
                    {
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            type: 'string'
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      },
      definitions: {
        OkResponse: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          }
        }
      }
    };
    var client = new SwaggerClient({
      spec: spec,
      success: function () {
        var response = client.fun.operations.test.successResponse['200'];
        expect(response.getMockSignature()).toEqual('<span class="strong">inline_model {</span><div><span class="propName ">name</span> (<span class="propType">string</span>, <span class="propOptKey">optional</span>),</div><div><span class="propName ">data</span> (<span class="propType">Array[string]</span>, <span class="propOptKey">optional</span>)</div><span class="strong">}</span>');
        done();
      }
    });
  });
});
