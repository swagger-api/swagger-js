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
});
