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
          type: "object",
          properties : {
            name : {
              type : "string"
            },
            type : {
              type : "string"
            }
          },
          discriminator : "type"
        },
        Human : {
          allOf : [ {
            $ref : "#/definitions/Animal"
          }, {
            type: "object",
            properties : {
              name : {
                type : "string"
              },
              type : {
                type : "string"
              },
              firstName : {
                type : "string"
              },
              lastName : {
                type : "string"
              }
            }
          } ]
        },
        Pet : {
          allOf : [ {
            $ref : "#/definitions/Animal"
          }, {
            type: "object",
            required : [ "isDomestic", "name", "type" ],
            properties : {
              type : {
                type : "string",
                position : 1,
                description : "The pet type"
              },
              name : {
                type : "string",
                position : 2,
                description : "The name of the pet"
              },
              isDomestic : {
                type : "boolean",
                position : 3,
                default : false
              }
            }
          } ]
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec) {
      console.log(spec);
      done();
    });
  });

  it('resolves a model with composition 2', function (done) {
    var api = new Resolver();
    var spec = {
      definitions: {
        Pet: {
          discriminator: "petType",
          properties: {
            name: {
              type: "string"
            },
            petType: {
              type: "string"
            }
          },
          required: [
            "name",
            "petType"
          ]
        },
        Cat: {
          description: "A representation of a cat",
          allOf: [
            {
              $ref: "#/definitions/Pet"
            },
            {
              properties: {
                huntingSkill: {
                  type: "string",
                  description: "The measured skill for hunting",
                  default: "lazy",
                  enum: [
                    "clueless",
                    "lazy",
                    "adventurous",
                    "aggressive"
                  ]
                }
              },
              required: [
                "huntingSkill"
              ]
            }
          ]
        },
        Dog: {
          description: "A representation of a dog",
          allOf: [
            {
              $ref: "#/definitions/Pet"
            },
            {
              properties: {
                packSize: {
                  type: "integer",
                  format: "int32",
                  description: "the size of the pack the dog is from",
                  default: 0,
                  minimum: 0
                }
              },
              required: [
                "packSize"
              ]
            }
          ]
        },
        Fish: {
          description: "A representation of a fish",
          allOf: [
            {
              $ref: "#/definitions/Pet"
            },
            {
              properties: {
                fins: {
                  type: "integer",
                  format: "int32",
                  description: "count of fins",
                  minimum: 0
                }
              },
              required: [
                "fins"
              ]
            }
          ]
        }
      }
    };

    api.resolve(spec, 'http://localhost:8000/v2/petstore.json', function (spec) {
      console.log(spec);
      done();
    });
  });


});
