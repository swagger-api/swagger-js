/* global describe, it */

'use strict';

var expect = require('expect');
var Operation = require('../lib/types/operation');

describe('type conversions', function () {
  it('convert to integer', function () {
    var op = new Operation();
    var type = op.getType({type: 'integer', format: 'int32'});

    expect(type).toBe('integer');
  });

  it('should return an interal ref, when inline schema',function() {

    var op = new Operation();
    var type = op.getType({
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          }
        }
      }
    });

    var type1 = op.getType({
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'string'
          }
        }
      }
    });

    expect(type).toBe('Inline Model 0');
    expect(type1).toBe('Inline Model 1');

  });
});
