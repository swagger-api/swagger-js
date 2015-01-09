var test = require('unit.js')
var should = require('should')
var mock = require('../test/mock');
var swagger = require('../lib/swagger');
var sample, instance;

describe('request operations', function() {
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

  it('verify the help function', function() {
    var petApi = sample.pet;
    test.object(petApi);
    var help = petApi.getPetById.help();
    should(help).equal('* petId (required) - ID of pet that needs to be fetched');
  })

  it('shows curl syntax', function() {
    var help = sample.pet.getPetById.help();
    console.log(help);
    var curl = sample.pet.getPetById.asCurl({petId: 1});
    should(curl).equal('curl --header "Accept: application/json" http://localhost:8000/api/pet/1');
  })

  it('generate a get request', function() {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {mock: true});

    test.object(req);
    should(req.method).equal('GET');
    should(req.headers['Accept']).equal('application/json');
    should(req.url).equal('http://localhost:8000/api/pet/1');
  })

  it('verifies the http request object for a GET with query params', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      status: 'available'
    };
    var opts = { mock: true };

    var req = petApi.findPetsByStatus(params, opts);

    should(req.method).equal("GET");
    should(req.headers["Accept"]).equal("application/json");
    should(req.url).equal("http://localhost:8000/api/pet/findByStatus?status=available");
  })

  it('verifies the http request object for a POST', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      body: JSON.stringify({
        id: 100,
        name: 'monster',
        status: 'dead'
      })
    };
    var opts = { mock: true };

    var req = petApi.addPet(params, opts);

    should(req.method).equal("POST");
    should(req.headers["Accept"]).equal("application/json");
    should(req.headers["Content-Type"]).equal("application/json");
    should(req.body).equal('{"id":100,"name":"monster","status":"dead"}');
    should(req.url).equal("http://localhost:8000/api/pet");
  })

  it('verifies the http request object for a POST with form params', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      petId: 1,
      name: 'dog',
      status: 'very happy'
    };
    var opts = { mock: true };

    var req = petApi.updatePetWithForm(params, opts);

    should(req.method).equal('POST');
    should(req.headers['Accept']).equal('application/json');
    should(req.headers['Content-Type']).equal('application/x-www-form-urlencoded');
    should(req.body).equal('name=dog&status=very%20happy');
    should(req.url).equal('http://localhost:8000/api/pet/1');
  })

  it('execute put operations', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      body: JSON.stringify({
        id: 100,
        name: 'monster',
        status: 'dead'
      })
    };
    var opts = { mock: true };

    var req = petApi.updatePet(params, opts);

    should(req.method).equal('PUT');
    should(req.headers['Accept']).equal('application/json');
    should(req.headers['Content-Type']).equal('application/json');
    should(req.body).equal('{\"id\":100,\"name\":\"monster\",\"status\":\"dead\"}');
    should(req.url).equal('http://localhost:8000/api/pet');
  })

  it('execute delete operations', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      petId: 100
    };
    var opts = { mock: true };

    var req = petApi.deletePet(params, opts);

    should(req.method).equal('DELETE');
    should(req.headers['Accept']).equal('application/json');
    should(req.headers['Content-Type']).equal('application/json');
    should(req.url).equal('http://localhost:8000/api/pet/100');
  })

  it('query params should be single encoded', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      status: "a b c d e"
    };
    var opts = { mock: true };

    var req = petApi.findPetsByStatus(params, opts);

    should(req.method).equal('GET');
    should(req.headers['Accept']).equal('application/json');
    test.value(req.headers['Content-Type']).isUndefined();
    should(req.url).equal('http://localhost:8000/api/pet/findByStatus?status=a%20b%20c%20d%20e');
  })

  it('path params should be properly checked', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      petId: false
    };
    var opts = { mock: true };

    var req = petApi.getPetById(params, opts);

    should(req.method).equal('GET');
    should(req.headers['Accept']).equal('application/json');
    test.value(req.headers['Content-Type']).isUndefined();
    should(req.url).equal('http://localhost:8000/api/pet/false');
  })

  it('tests the urlify function', function() {
    var op = sample.apis['pet'].operations.getPetById
    op.pathJson = function() {
      return "/entities/{id:([a-z0-9-]{36})}"
    }
    // console.log(op.urlify({petId: 1, 'id:\(\[a\-z0\-9\-\]\{36\}\)': 'ok'}));
  })

  it('tests the body param', function() {
    var params = {
      body: {id: 1}
    };
    var opts = { mock: true };
    var req = sample.pet.addPet(params, opts);
    test.object(req.body);
    should(req.body.id).equal(1);
  })

  it('tests the body param when name is not `body`, per #168', function() {
    var op = sample.apis['pet'].operations.addPet
    op.parameters[0].name = 'pet';

    var params = {
      body: {id: 1}
    };
    var opts = { mock: true };
    var req = sample.pet.addPet(params, opts);
    test.object(req.body);
    should(req.body.id).equal(1);
  })

  it('verifies headers when fetching the swagger specification', function() {
    var sample = new swagger.SwaggerApi('http://localhost:8000/api-docs.json');
    var req = sample.build(true);
    should(req.headers['accept']).equal('application/json,application/json;charset=utf-8,*/*');
  })

  it('allows override of headers when fetching the swagger specification', function() {
    var opts = {
      swaggerRequstHeaders: 'foo/bar'
    };
    var sample = new swagger.SwaggerApi('http://localhost:8000/api-docs.json', opts);
    var req = sample.build(true);
    should(req.headers['accept']).equal('foo/bar');
  })

  it('verifies the http request object for a GET with email address query params per https://github.com/swagger-api/swagger-ui/issues/814', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      status: 'fehguy@gmail.com'
    };
    var opts = { mock: true };

    var req = petApi.findPetsByStatus(params, opts);

    should(req.method).equal("GET");
    should(req.headers["Accept"]).equal("application/json");
    should(req.url).equal("http://localhost:8000/api/pet/findByStatus?status=fehguy%40gmail.com");
  })
})