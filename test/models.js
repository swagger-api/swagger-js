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
});