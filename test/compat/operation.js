var test = require('unit.js');
var expect = require('expect');
var mock = require('../../test/compat/mock');
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

  it('returns the same nickname', function() {
    pet = sample.pet;
    expect(pet.sanitize('getSomething')).toBe('getSomething');
  });

  it('strips spaces in the nickname', function() {
    pet = sample.pet;
    expect(pet.sanitize('get something')).toBe('get_something');
  });

  it('strips dots in the nickname', function() {
    pet = sample.pet;
    expect(pet.sanitize('get.something')).toBe('get_something');
  });

  it('strips $ in the nickname', function() {
    pet = sample.pet;
    expect(pet.sanitize('get$something')).toBe('get_something');
  });

  it('strips punctuation in the nickname', function() {
    pet = sample.pet;
    expect(pet.sanitize('get[something]')).toBe('get_something');
  });

  it('strips curlies in the nickname', function() {
    pet = sample.pet;
    expect(pet.sanitize('get{something}')).toBe('get_something');
  });

  it('strips punctuation in the nickname', function() {
    pet = sample.pet;
    expect(pet.sanitize('  \\]}{Get$$_./\[something]')).toBe('Get_something');
  });
});

describe('verifies the get pet operation', function() {
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
    operation = sample.pet.operations.getPetById;

    responseMessages = operation.responseMessages;
    test.object(responseMessages);
    expect(responseMessages.length).toBe(2);
    expect(responseMessages[0].code).toBe(400);
    expect(responseMessages[1].code).toBe(404);
  });

  it('verifies slashes', function() {
    operation = sample.pet.operations.getPetById;
    operation.resource.basePath = 'http://foo.bar/api/';
    var url = operation.urlify({petId: 129298});
    expect(url).toBe('http://foo.bar/api/pet/129298');
  });

  it('verifies the default value from the get operation', function() {
    operation = sample.pet.operations.getPetById;
    var param = operation.parameters[0];
    expect(param.defaultValue).toBe(3);
  });

  it('gets help() from the get pet operation', function() {
    operation = sample.pet.operations.getPetById;
    expect(operation.help(true).indexOf('getPetById: Find pet by ID')).toBe(0);
  });

  it('verifies the get pet operation', function() {
    operation = sample.pet.operations.getPetById;
    expect(operation.method).toBe('get');

    parameters = operation.parameters;

    test.object(parameters);
    expect(parameters.length).toBe(1);

    param = parameters[0];
    expect(param.name).toBe('petId');
    expect(param.type).toBe('integer');
    expect(param.paramType).toBe('path');
    test.value(param.description);
  });

  it('verifies the post pet operation', function() {
    operation = sample.pet.operations.addPet;
    expect(operation.method).toBe('post');

    parameters = operation.parameters;

    test.object(parameters);
    expect(parameters.length).toBe(1);

    param = parameters[0];
    expect(param.name).toBe('body');
    expect(param.type).toBe('Pet');
    expect(param.paramType).toBe('body');
    test.value(param.description);
  });

  it('verifies the put pet operation', function() {
    operation = sample.pet.operations.updatePet;
    expect(operation.method).toBe('put');

    parameters = operation.parameters;

    test.object(parameters);
    expect(parameters.length).toBe(1);

    param = parameters[0];
    expect(param.name).toBe('body');
    expect(param.type).toBe('Pet');
    expect(param.paramType).toBe('body');
    test.value(param.description);
  });

  it('verifies the findByTags operation', function() {
    operation = sample.pet.operations.findPetsByTags;
    expect(operation.method).toBe('get');

    parameters = operation.parameters;

    test.object(parameters);
    expect(parameters.length).toBe(1);

    param = parameters[0];

    expect(param.name).toBe('tags');
    expect(param.type).toBe('string');
    expect(param.paramType).toBe('query');
    test.value(param.description);
  });

  it('verifies the patch pet operation', function() {
    operation = sample.pet.operations.partialUpdate;
    expect(operation.method).toBe('patch');

    produces = operation.produces;
    expect(produces.length).toBe(2);
    expect(produces[0]).toBe('application/json');
    expect(produces[1]).toBe('application/xml');

    parameters = operation.parameters;
    test.object(parameters);
    expect(parameters.length).toBe(2);

    param = parameters[0];
    expect(param.name).toBe('petId');
    expect(param.type).toBe('string');
    expect(param.paramType).toBe('path');
    test.value(param.description);

    param = parameters[1];
    expect(param.name).toBe('body');
    expect(param.type).toBe('Pet');
    expect(param.paramType).toBe('body');
    test.value(param.description);
  });

  it('verifies the post pet operation with form', function() {
    operation = sample.pet.operations.updatePetWithForm;
    expect(operation.method).toBe('post');

    consumes = operation.consumes;
    expect(consumes.length).toBe(1);
    expect(consumes[0]).toBe('application/x-www-form-urlencoded');

    parameters = operation.parameters;
    test.object(parameters);
    expect(parameters.length).toBe(3);

    param = parameters[0];
    expect(param.name).toBe('petId');
    expect(param.type).toBe('string');
    expect(param.paramType).toBe('path');
    test.value(param.description);

    param = parameters[1];
    expect(param.name).toBe('name');
    expect(param.type).toBe('string');
    expect(param.paramType).toBe('form');
    test.value(param.description);
    expect(param.required).toBe(false);

    param = parameters[2];
    expect(param.name).toBe('status');
    expect(param.type).toBe('string');
    expect(param.paramType).toBe('form');
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
    expect(param.paramType).toBe('form');
    expect(param.required).toBe(false);
    test.value(param.description);

    param = parameters[1];
    expect(param.name).toBe('file');
    expect(param.type).toBe('File');
    expect(param.paramType).toBe('body');
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
    operation = sample.pet.operations.uploadFile;
    expect(operation.help(true).indexOf('uploadFile: uploads an image')).toBe(0);
  });
});