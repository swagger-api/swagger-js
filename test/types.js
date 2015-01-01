var test = require('unit.js');
var should = require('should');
var swagger = require('../lib/swagger-client');

describe('type conversions', function() {
  it('convert to integer', function() {
    var op = new swagger.Operation();
    var type = op.getType({type: 'integer', format: 'int32'});
    should(type).equal('integer');
  });
});
