/* global after, before, describe, it */

'use strict';

var test = require('unit.js');
var expect = require('expect');
var mock = require('./mock');
var sample, instance;

describe('1.2 verifies the nickname is sanitized', function() {
  before(function(done) {
    mock.petstore(done, function(petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function(done){
    instance.close();
    done();
  });

  it('generates an operation id', function() {
    expect(sample.idFromOp('/foo/bar', 'GET', {})).toBe('GET_foo_bar');
  });

  it('returns the same nickname', function() {
    expect(sample.idFromOp('', '', { operationId: 'getSomething' })).toBe('getSomething');
  });

  it('strips spaces in the nickname', function() {
    expect(sample.idFromOp('', '', { operationId: 'get something' })).toBe('get_something');
  });

  it('strips dots in the nickname', function() {
    expect(sample.idFromOp('', '', { operationId: 'get.something' })).toBe('get_something');
  });

  it('strips $ in the nickname', function() {
    expect(sample.idFromOp('', '', { operationId: 'get$something' })).toBe('get_something');
  });

  it('strips punctuation in the nickname', function() {
    expect(sample.idFromOp('', '', { operationId: 'get[something]' })).toBe('get_something');
  });

  it('strips curlies in the nickname', function() {
    expect(sample.idFromOp('', '', { operationId: 'get{something}' })).toBe('get_something');
  });

  it('strips punctuation in the nickname', function() {
    expect(sample.idFromOp('', '', { operationId: '  \\]}{Get$$_./\[something]' })).toBe('Get_something');
  });
});

describe('1.2 verifies the get pet operation', function() {
  before(function(done) {
    mock.petstore(done, function(petstore, server){
      sample = petstore;
      instance = server;
    });
  });

  after(function(done){
    instance.close();
    done();
  });

  it('verifies the response messages from the get operation', function() {
    var operation = sample.pet.operations.getPetById;
    var responses = operation.responses;

    test.object(responses);

    expect(Object.keys(responses).length).toBe(2);
    test.object(responses['400']);
    test.object(responses['404']);
  });

  it('verifies slashes', function() {
    var operation = sample.pet.operations.getPetById;

    operation.host = 'foo.bar/api';
    operation.basePath = '/';

    var url = operation.urlify({petId: 129298});

    expect(url).toBe('http://foo.bar/api/pet/129298');
  });


  it('does not add excessive &', function() {
    var operation = sample.pet.operations.testGetOperation;
    operation.host = 'foo.bar/api';
    operation.basePath = '/';

    var url = operation.urlify({petId: 129298});

    expect(url).toBe('http://foo.bar/api/testOp?petId=129298');
  });

  it('verifies the default value from the get operation', function() {
    var operation = sample.pet.operations.getPetById;
    var param = operation.parameters[0];

    expect(param.default).toBe(3);
  });

  it('gets help() from the get pet operation', function() {
    var operation = sample.pet.operations.getPetById;

    expect(operation.help(true).indexOf('getPetById: Find pet by ID')).toBe(0);
  });

  it('verifies the get pet operation', function() {
    var operation = sample.pet.operations.getPetById;

    expect(operation.method).toBe('get');

    var parameters = operation.parameters;

    test.object(parameters);

    expect(parameters.length).toBe(1);

    var param = parameters[0];

    expect(param.name).toBe('petId');
    expect(param.type).toBe('integer');
    expect(param.in).toBe('path');

    test.value(param.description);
  });

  it('verifies the post pet operation', function() {
    var operation = sample.pet.operations.addPet;

    expect(operation.method).toBe('post');

    var parameters = operation.parameters;

    test.object(parameters);

    expect(parameters.length).toBe(1);

    var param = parameters[0];

    expect(param.name).toBe('body');
    expect(param.schema.$ref).toBe('#/definitions/Pet');
    expect(param.in).toBe('body');
    expect(param.default).toBe('{\n  \"petId\":1234\n}');

    test.value(param.description);
  });

  it('verifies the put pet operation', function() {
    var operation = sample.pet.operations.updatePet;

    expect(operation.method).toBe('put');

    var parameters = operation.parameters;

    test.object(parameters);

    expect(parameters.length).toBe(1);

    var param = parameters[0];

    expect(param.name).toBe('body');
    expect(param.schema.$ref).toBe('#/definitions/Pet');
    expect(param.in).toBe('body');

    test.value(param.description);
  });

  it('verifies the findByTags operation', function() {
    var operation = sample.pet.operations.findPetsByTags;

    expect(operation.method).toBe('get');

    var parameters = operation.parameters;

    test.object(parameters);

    expect(parameters.length).toBe(1);

    var param = parameters[0];

    expect(param.name).toBe('tags');
    expect(param.type).toBe('string');
    expect(param.in).toBe('query');

    test.value(param.description);
  });

  it('verifies the patch pet operation', function() {
    var operation = sample.pet.operations.partialUpdate;

    expect(operation.method).toBe('patch');

    var produces = operation.produces;

    expect(produces.length).toBe(2);
    expect(produces[0]).toBe('application/json');
    expect(produces[1]).toBe('application/xml');

    var parameters = operation.parameters;

    test.object(parameters);

    expect(parameters.length).toBe(2);

    var param = parameters[0];

    expect(param.name).toBe('petId');
    expect(param.type).toBe('string');
    expect(param.in).toBe('path');

    test.value(param.description);

    param = parameters[1];
    expect(param.name).toBe('body');
    expect(param.schema.$ref).toBe('#/definitions/Pet');
    expect(param.in).toBe('body');

    test.value(param.description);
  });

  it('verifies the post pet operation with form', function() {
    var operation = sample.pet.operations.updatePetWithForm;

    expect(operation.method).toBe('post');

    var consumes = operation.consumes;

    expect(consumes.length).toBe(1);
    expect(consumes[0]).toBe('application/x-www-form-urlencoded');

    var parameters = operation.parameters;

    test.object(parameters);

    expect(parameters.length).toBe(3);

    var param = parameters[0];

    expect(param.name).toBe('petId');
    expect(param.type).toBe('string');
    expect(param.in).toBe('path');

    test.value(param.description);

    param = parameters[1];

    expect(param.name).toBe('name');
    expect(param.type).toBe('string');
    expect(param.in).toBe('formData');

    test.value(param.description);

    expect(param.required).toBe(false);

    param = parameters[2];

    expect(param.name).toBe('status');
    expect(param.type).toBe('string');
    expect(param.in).toBe('formData');

    test.value(param.description);

    expect(param.required).toBe(false);
  });

  it('verifies a file upload', function() {
    var operation = sample.pet.operations.uploadFile;

    expect(operation.method).toBe('post');

    var consumes = operation.consumes;

    expect(consumes.length).toBe(1);
    expect(consumes[0]).toBe('multipart/form-data');

    var parameters = operation.parameters;

    test.object(parameters);

    expect(parameters.length).toBe(2);

    var param = parameters[0];

    expect(param.name).toBe('additionalMetadata');
    expect(param.type).toBe('string');
    expect(param.in).toBe('formData');
    expect(param.required).toBe(false);

    test.value(param.description);

    param = parameters[1];

    expect(param.name).toBe('body');
    expect(param.type).toBe('file');

    test.value(param.description);

    expect(param.required).toBe(false);
  });

  it('gets the contact info', function() {
    var info = sample.info;

    expect(info.title).toBe('Swagger Sample App');
  });

  it('gets operations for the pet api', function() {
    var ops = sample.pet.operations;

    test.object(ops);
  });

  it('gets help() from the file upload operation', function() {
    var operation = sample.pet.operations.uploadFile;

    expect(operation.help(true).indexOf('uploadFile: uploads an image')).toBe(0);
  });
});
