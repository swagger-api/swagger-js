/* global describe, it */

'use strict';

var expect = require('expect');
var Operation = require('../lib/types/operation');

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

describe('response types', function () {
  it('should return a 200 response definition', function () {
    var responses = {
      200:       MonsterResponse,
      201:       StringResponse,
      'default': BasicResponseModel
    };
    var definitions = {
      Monster: MonsterModel,
      ResponseModel: ResponseModel
    };
    var op = new Operation(
      {},
      'http',
      'operationId',
      'get',
      '/path',
      {responses: responses}, // args
      definitions); // definitions

    expect(typeof op.successResponse).toBe('object');
    expect(op.successResponse['200'].createJSONSample()).toEqual({ id: 0, name: 'string' });

    responses = op.responses;

    expect(typeof responses['201']).toBe('object');
    expect(typeof responses['default']).toBe('object');
  });

  it('should contain expected response properties (Issue 277)', function () {
    var description = 'Test description';
    var examples = {
      'application/json': {
        name: 'Anonymous'
      }
    };
    var headers = {
      'X-Testing': {
        type: 'string'
      }
    };
    var schema = {
      properties: {
        name: {
          type: 'string'
        }
      }
    };
    var responses = {
      '200': {
        description: description,
        examples: examples,
        headers: headers,
        schema: schema
      },
      'default': {
        description: description,
        examples: {
          'application/json': {
            id: 1,
            name: 'Test Monster'
          }
        },
        headers: headers,
        schema: {
          $ref: '#/definitions/Monster'
        }
      }
    };
    var definitions = {
      Monster: MonsterModel
    };

    responses['default'].schema = {
      $ref: '#/definitions/Monster'
    };
    
    var op = new Operation(
      {},
      'http',
      'operationId',
      'get',
      '/path',
      {responses: responses},
      definitions);

    // responses['200'] seems to be deleted by the Operation so we have to test differently
    expect(op.successResponse['200'].definition).toEqual(schema);
    expect(op.successResponse['200'].description).toBe(description);
    expect(op.successResponse['200'].examples).toEqual(examples);
    expect(op.successResponse['200'].headers).toEqual(headers);

    expect(op.responses['default'].description).toBe(responses['default'].description);
    expect(op.responses['default'].examples).toEqual(responses['default'].examples);
    expect(op.responses['default'].headers).toEqual(responses['default'].headers);
    expect(op.responses['default'].schema).toEqual(responses['default'].schema);
  });
});
