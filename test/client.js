/* global beforeEach, describe, it */

'use strict';

var expect = require('expect');
var petstoreRaw = require('./spec/v2/petstore');
var SwaggerClient = require('..');
var client;

describe('SwaggerClient', function () {
  beforeEach(function () {
    client = new SwaggerClient({
      spec: petstoreRaw
    });
  });

  it('ensure externalDocs is attached to the client when available (Issue 276)', function () {
    expect(client.externalDocs).toEqual(petstoreRaw.externalDocs);
  });
});
