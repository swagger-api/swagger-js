var test = require('unit.js');
var expect = require('expect');
var petstore = require('../test/spec/v2/petstore');
var swagger = require('../lib/swagger-client');
var sample, instance;

describe('swagger request functions', function() {
  it('resolves remote model references', function() {
    var api = new swagger.SwaggerClient();
    var spec = petstore.spec;
    api.resolve(spec);
  });

});