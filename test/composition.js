/* global after, before, describe, it */

'use strict';

var expect = require('expect');
var test = require('unit.js');
var mock = require('./mock');
var Resolver = require('../lib/resolver');
var instance;

describe('swagger resolver', function () {
  before(function (done) {
    mock.petstore(done, function (petstore, server){
      instance = server;
    });
  });

  after(function (done){
    instance.close();
    done();
  });

  it('resolves a model with composition', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Animal : {
          type: 'object',
          required: [ 'name' ],
          properties : {
            name : {
              type : 'string'
            },
            type : {
              type : 'string'
            }
          },
          discriminator : 'type'
        },
        Human : {
          allOf : [ {
            type: 'object',
            properties : {
              firstName : {
                type : 'string'
              },
              lastName : {
                type : 'string'
              }
            }
          },
          {
            $ref : '#/definitions/Animal'
          } ],
          example: 'this is example'
        },
        Pet : {
          allOf : [ {
            $ref : '#/definitions/Animal'
          }, {
            type: 'object',
            required : [ 'isDomestic', 'name', 'type' ],
            properties : {
              isDomestic : {
                type : 'boolean',
                default : false
              }
            }
          } ]
        },
        Monster: {
          description: 'useful information',
          allOf : [
            {
              $ref: '#/definitions/Ghoul'
            }, {
              $ref: '#/definitions/Pet'
            }, {
              properties: {
                hasScales: {
                  type: 'boolean'
                }
              }
            }
          ]
        },
        Ghoul: {
          description: 'a ghoul',
          required: [ 'fangs' ],
          properties: {
            fangs: {
              type: 'integer',
              format: 'int32'
            }
          }
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec.definitions.Monster);
      var properties = spec.definitions.Monster.properties;
      test.object(properties.name);
      expect(properties.name['x-resolved-from']).toBe('#/definitions/Animal');
      test.object(properties.type);
      expect(properties.type['x-resolved-from']).toBe('#/definitions/Animal');
      test.undefined(properties.firstName);
      test.undefined(properties.lastName);
      test.object(properties.isDomestic);
      expect(properties.isDomestic['x-resolved-from']).toBe('#/definitions/Pet');
      test.object(properties.fangs);
      expect(properties.fangs['x-resolved-from']).toBe('#/definitions/Ghoul');
      test.object(properties.hasScales);
      expect(properties.hasScales['x-resolved-from']).toBe('self');
      test.undefined(spec.definitions.Animal.properties.firstName);
      expect(spec.definitions.Human.example).toBe('this is example');
      expect(spec.definitions.Ghoul.description).toBe('a ghoul');
      expect(spec.definitions.Monster.description).toBe('useful information');
      done();
    });
  });

  it('resolves a model with composition 2', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Pet: {
          discriminator: 'petType',
          properties: {
            name: {
              type: 'string'
            },
            petType: {
              type: 'string'
            }
          },
          required: [
            'name',
            'petType'
          ]
        },
        Cat: {
          description: 'A representation of a cat',
          allOf: [
            {
              $ref: '#/definitions/Pet'
            },
            {
              properties: {
                petType: {
                  type: 'string',
                  enum: [ 'cat' ]
                },
                huntingSkill: {
                  type: 'string',
                  description: 'The measured skill for hunting',
                  default: 'lazy',
                  enum: [
                    'clueless',
                    'lazy',
                    'adventurous',
                    'aggressive'
                  ]
                }
              },
              required: [
                'huntingSkill'
              ]
            }
          ]
        },
        Dog: {
          description: 'A representation of a dog',
          allOf: [
            {
              $ref: '#/definitions/Pet'
            },
            {
              properties: {
                petType: {
                  type: 'string',
                  enum: [ 'dog' ]
                },                
                packSize: {
                  type: 'integer',
                  format: 'int32',
                  description: 'the size of the pack the dog is from',
                  default: 0,
                  minimum: 0
                }
              },
              required: [
                'packSize'
              ]
            }
          ]
        },
        Fish: {
          description: 'A representation of a fish',
          allOf: [
            {
              $ref: '#/definitions/Pet'
            },
            {
              properties: {
                petType: {
                  type: 'string',
                  enum: [ 'fish' ]
                },                
                fins: {
                  type: 'integer',
                  format: 'int32',
                  description: 'count of fins',
                  minimum: 0
                }
              },
              required: [
                'fins'
              ]
            }
          ]
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec);
      done();
    });
  });

  it('resolves a model with a composed response array', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/test': {
          get: {
            responses: {
              200: {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/Response'
                  }
                }
              }
            }
          }
        }
      },
      definitions: {
        Request: {
        properties: {
          name: {
            type: 'string'
          }
        }
      },
      Response: {
        allOf: [
          {
            $ref: '#/definitions/Request'
          },
          {
            properties: {
              id: {
                description: 'ID of entry',
                type: 'integer',
                format: 'int32'
              }
            }
          }
        ]
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec);
      done();
    });
  });

  it('tests issue #567', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        'Pet': {
          discriminator: 'type',
          required: [
            'type'
          ],
          properties: {
            hasFur: {
              type: 'boolean'
            },
            limbCount: {
              type: 'integer',
              format: 'int32'
            },
            eatsMeat: {
              type: 'boolean'
            },
            eatsPeople: {
              type: 'boolean'
            }
          }
        },
        'Cat': {
          properties: {
            commonName: {
              type: 'string',
              example: 'Abyssinian'
            }
          }
        },
        'Dog': {
          properties: {
            barks: {
              type: 'boolean'
            },
            slobberFactor: {
              type: 'integer',
              format: 'int32'
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec);
      var pet = spec.definitions.Pet;

      expect(pet).toBeAn('object');
      expect(pet.discriminator).toBeAn('string');
      done();
    });
  });

  it('tests issue #459', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        'new_model': {
          properties: {
            subclass: {
              allOf: [
                {
                  $ref: '#/definitions/superclass'
                },
                {
                  properties: {
                    name: {
                      type: 'string'
                    }
                  }
                }
              ]
            }
          }
        },
        superclass: {
          properties: {
            id: {
              format: 'int32',
              type: 'integer'
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec);
      var schema = spec.definitions['new_model'].properties.subclass;

      expect(schema['x-composed']).toBe(true);
      expect(Array.isArray(schema['x-resolved-from'])).toBe(true);
      expect(schema['x-resolved-from'][0]).toBe('#/definitions/new_model');
      expect(schema['x-resolved-from'][1]).toBe('#/definitions/superclass');

      expect(Object.keys(schema.properties).length).toBe(2);

      var id = schema.properties.id;
      expect(id.type).toBe('integer');
      expect(id.format).toBe('int32');
      expect(id['x-resolved-from']).toBe('#/definitions/superclass');

      var name = schema.properties.name;
      expect(name.type).toBe('string');
      expect(name['x-resolved-from']).toBe('self');

      done();
    });
  });

  it('tests issue #783', function (done) {
    var api = new Resolver();
    var spec = {
      paths: {
        '/foo': {
          get: {
            parameters: [],
            responses: {
              200: {
                schema: {
                  allOf: [
                    {
                      $ref: '#/definitions/PaginationHeader'
                    }, {
                      type: 'object',
                      properties: {
                        result: {
                          type: 'array',
                          items: {
                            $ref: '#/definitions/User'
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
        'PaginationHeader': {
          properties: {
            offset: {
              type: 'integer',
              format: 'int32'
            },
            limit: {
              type: 'integer',
              format: 'int32'
            }
          }
        },
        'User': {
          properties: {
            name: {
              type: 'string'
            }
          }
        }
      }
    };
    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec, unresolved) {
      expect(Object.keys(unresolved).length).toBe(0);
      test.object(spec);
      test.object(spec.paths['/foo'].get.responses[200]);
      var schema = spec.definitions['inline_model'];

      expect(schema.properties.offset.type).toBe('integer');
      expect(schema.properties.offset.format).toBe('int32');
      expect(schema.properties.limit.type).toBe('integer');
      expect(schema.properties.limit.format).toBe('int32');
      expect(schema.properties.result.type).toBe('array');
      expect(schema.properties.result.items.$ref).toBe('#/definitions/User');
      done();
    });
  });
});
