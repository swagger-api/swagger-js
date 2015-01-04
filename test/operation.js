var test = require('unit.js')
var should = require('should')
var mock = require('../test/mock');
var sample, instance;

describe('verifies the nickname is sanitized', function() {
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
    should(pet.sanitize('getSomething')).equal('getSomething');
  })

  it('strips spaces in the nickname', function() {
    pet = sample.pet;
    should(pet.sanitize('get something')).equal('get_something');
  })

  it('strips dots in the nickname', function() {
    pet = sample.pet;
    should(pet.sanitize('get.something')).equal('get_something');
  })

  it('strips $ in the nickname', function() {
    pet = sample.pet;
    should(pet.sanitize('get$something')).equal('get_something');
  })

  it('strips punctuation in the nickname', function() {
    pet = sample.pet;
    should(pet.sanitize('get[something]')).equal('get_something');
  })

  it('strips curlies in the nickname', function() {
    pet = sample.pet;
    should(pet.sanitize('get{something}')).equal('get_something');
  })

  it('strips punctuation in the nickname', function() {
    pet = sample.pet;
    should(pet.sanitize('  \\]}{Get$$_./\[something]')).equal('Get_something');
  })
})

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
    should(responseMessages.length).equal(2);
    should(responseMessages[0].code).equal(400);
    should(responseMessages[1].code).equal(404);
  })

  it('gets help() from the get pet operation', function() {
    operation = sample.pet.operations.getPetById;
    should(operation.help()).equal('* petId (required) - ID of pet that needs to be fetched');
  })

////////
  it('verifies the get pet operation', function() {
    operation = sample.pet.operations.getPetById
    should(operation.method).equal('get');

    parameters = operation.parameters;

    test.object(parameters);
    should(parameters.length).equal(1);

    param = parameters[0]
    should(param.name).equal('petId');
    should(param.type).equal('integer');
    should(param.paramType).equal('path');
    test.value(param.description);
  })

  it('verifies the post pet operation', function() {
    operation = sample.pet.operations.addPet
    should(operation.method).equal('post');

    parameters = operation.parameters

    test.object(parameters);
    should(parameters.length).equal(1);

    param = parameters[0]
    should(param.name).equal('body');
    should(param.type).equal('Pet');
    should(param.paramType).equal('body');
    test.value(param.description);
  })

  it('verifies the put pet operation', function() {
    operation = sample.pet.operations.updatePet
    should(operation.method).equal('put');

    parameters = operation.parameters

    test.object(parameters);
    should(parameters.length).equal(1);

    param = parameters[0]
    should(param.name).equal('body');
    should(param.type).equal('Pet');
    should(param.paramType).equal('body');
    test.value(param.description);
  })

  it('verifies the findByTags operation', function() {
    operation = sample.pet.operations.findPetsByTags
    should(operation.method).equal('get');

    parameters = operation.parameters

    test.object(parameters);
    should(parameters.length).equal(1);

    param = parameters[0]

    should(param.name).equal('tags');
    should(param.type).equal('string');
    should(param.paramType).equal('query');
    test.value(param.description);
  })

  it('verifies the patch pet operation', function() {
    operation = sample.pet.operations.partialUpdate
    should(operation.method).equal('patch');

    produces = operation.produces
    should(produces.length).equal(2);
    should(produces[0]).equal('application/json');
    should(produces[1]).equal('application/xml');

    parameters = operation.parameters
    test.object(parameters);
    should(parameters.length).equal(2);

    param = parameters[0]
    should(param.name).equal('petId');
    should(param.type).equal('string');
    should(param.paramType).equal('path');
    test.value(param.description);

    param = parameters[1]
    should(param.name).equal('body');
    should(param.type).equal('Pet');
    should(param.paramType).equal('body');
    test.value(param.description);
  })

  it('verifies the post pet operation with form', function() {
    operation = sample.pet.operations.updatePetWithForm
    should(operation.method).equal('post');

    consumes = operation.consumes
    should(consumes.length).equal(1);
    should(consumes[0]).equal('application/x-www-form-urlencoded');

    parameters = operation.parameters
    test.object(parameters);
    should(parameters.length).equal(3);

    param = parameters[0]
    should(param.name).equal('petId');
    should(param.type).equal('string');
    should(param.paramType).equal('path');
    test.value(param.description);

    param = parameters[1]
    should(param.name).equal('name');
    should(param.type).equal('string');
    should(param.paramType).equal('form');
    test.value(param.description);
    should(param.required).equal(false);

    param = parameters[2]
    should(param.name).equal('status');
    should(param.type).equal('string');
    should(param.paramType).equal('form');
    test.value(param.description);
    should(param.required).equal(false);
  })

  it('verifies a file upload', function() {
    operation = sample.pet.operations.uploadFile
    should(operation.method).equal('post');

    consumes = operation.consumes
    should(consumes.length).equal(1);
    should(consumes[0]).equal('multipart/form-data');

    parameters = operation.parameters
    test.object(parameters);
    should(parameters.length).equal(2);

    param = parameters[0]
    should(param.name).equal('additionalMetadata');
    should(param.type).equal('string');
    should(param.paramType).equal('form');
    should(param.required).equal(false);
    test.value(param.description);

    param = parameters[1]
    should(param.name).equal('file');
    should(param.type).equal('File');
    should(param.paramType).equal('body');
    test.value(param.description);
    should(param.required).equal(false);
  })

  it('gets operations for the pet api', function() {
    ops = sample.pet.operations
    test.object(ops);
  })

  it('gets help() from the file upload operation', function() {
    operation = sample.pet.operations.uploadFile
    should(operation.help()).equal('* additionalMetadata - Additional data to pass to server\n* file - file to upload');
  })
})