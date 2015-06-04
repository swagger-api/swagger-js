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
          } ]
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
          allOf : [
            {
              $ref: '#/definitions/Animal'
            }, {
              $ref: '#/definitions/Ghoul'
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
      test.object(properties.firstName);
      expect(properties.firstName['x-resolved-from']).toBe('#/definitions/Animal');
      test.object(properties.lastName);
      expect(properties.lastName['x-resolved-from']).toBe('#/definitions/Animal');
      test.object(properties.isDomestic);
      expect(properties.isDomestic['x-resolved-from']).toBe('#/definitions/Animal');
      test.object(properties.fangs);
      expect(properties.fangs['x-resolved-from']).toBe('#/definitions/Ghoul');
      test.object(properties.hasScales);
      expect(properties.hasScales['x-resolved-from']).toBe('self');
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

});
