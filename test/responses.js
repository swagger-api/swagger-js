var test = require('unit.js');
var expect = require('expect');
var swagger = require('../lib/swagger-client');

var MonsterResponse = { schema: { $ref: '#/definitions/Monster' }};
var StringResponse = { schema: { type: 'string'} };
var BasicResponseModel = { schema: { $ref: '#/definitions/ResponseModel'}};

var MonsterModel = {
  properties: {
    id: { type: 'integer', format: 'int64' },
    name: { type: 'string' }
  }
};
var ResponseModel = {
  properties: {
    code: { type: 'integer', format: 'int32' },
    message: { type: 'string' }
  }
};

describe('response types', function() {
  it('should return a 200 response definition', function() {
    var responses = {
      200:       MonsterResponse,
      201:       StringResponse,
      'default': BasicResponseModel
    };
    var definitions = {
      Monster: MonsterModel,
      ResponseModel: ResponseModel
    };

    var op = new swagger.Operation(
      {},
      'http',
      'operationId',
      'get',
      '/path',
      {responses: responses}, // args
      definitions); // definitions

    expect(typeof op.successResponse).toBe('object');
    var responseModel = op.successResponse['200'];
    expect(op.successResponse['200'].createJSONSample()).toEqual({ id: 0, name: 'string' });

    responses = op.responses;
    expect(typeof responses['201']).toBe('object');
    expect(typeof responses['default']).toBe('object');
  });
});
