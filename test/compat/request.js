var test = require('unit.js');
var expect = require('expect');
var mock = require('../../test/compat/mock');
var swagger = require('../../lib/swagger-client');
var sample, instance;

describe('1.2 request operations', function() {
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
    var help = petApi.getPetById.help(true);
    expect(help.indexOf('getPetById: Find pet by ID')).toBe(0);
  });

  it('shows curl syntax', function() {
    var help = sample.pet.getPetById.help(true);
    var curl = sample.pet.getPetById.asCurl({petId: 1});
    expect(curl).toBe('curl --header "Accept: application/json" http://localhost:8000/v1/api/pet/1');
  });

  it('generate a get request', function() {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {mock: true});

    test.object(req);
    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/1');
  });

  it('generate a get request', function() {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {mock: true});
    expect(petApi.operations.getPetById.deprecated).toBe(true);
  });

  it('verifies the http request object for a GET with query params', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      status: 'available'
    };
    var opts = { mock: true };

    var req = petApi.findPetsByStatus(params, opts);

    expect(req.method).toBe("GET");
    expect(req.headers.Accept).toBe("application/json");
    expect(req.url).toBe("http://localhost:8000/v1/api/pet/findByStatus?status=available");
  });

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

    expect(req.method).toBe("POST");
    expect(req.headers.Accept).toBe("application/json");
    expect(req.headers["Content-Type"]).toBe("application/json");
    expect(req.body).toBe('{"id":100,"name":"monster","status":"dead"}');
    expect(req.url).toBe("http://localhost:8000/v1/api/pet");
  });

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

    expect(req.method).toBe('POST');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(req.body).toBe('name=dog&status=very%20happy');
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/1');
  });

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

    expect(req.method).toBe('PUT');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.body).toBe('{\"id\":100,\"name\":\"monster\",\"status\":\"dead\"}');
    expect(req.url).toBe('http://localhost:8000/v1/api/pet');
  });

  it('execute delete operations', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      petId: 100
    };
    var opts = { mock: true };

    var req = petApi.deletePet(params, opts);

    expect(req.method).toBe('DELETE');
    expect(req.headers.Accept).toBe('application/json');
    expect(req.headers['Content-Type']).toBe('application/json');
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/100');
  });

  it('query params expect be single encoded', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      status: "a b c d e"
    };
    var opts = { mock: true };

    var req = petApi.findPetsByStatus(params, opts);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    test.value(req.headers['Content-Type']).isUndefined();
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/findByStatus?status=a%20b%20c%20d%20e');
  });

  it('path params expect be properly checked', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      petId: false
    };
    var opts = { mock: true };

    var req = petApi.getPetById(params, opts);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    test.value(req.headers['Content-Type']).isUndefined();
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/false');
  });

  it('tests the urlify function', function() {
    var op = sample.apis.pet.operations.getPetById;
    op.pathJson = function() {
      return "/entities/{id:([a-z0-9-]{36})}";
    };
    // console.log(op.urlify({petId: 1, 'id:\(\[a\-z0\-9\-\]\{36\}\)': 'ok'}));
  });

  it('tests the body param', function() {
    var params = {
      body: {id: 1}
    };
    var opts = { mock: true };
    var req = sample.pet.addPet(params, opts);
    test.object(req.body);
    expect(req.body.id).toBe(1);
  });

  it('tests the body param when name is not `body`, per #168', function() {
    var op = sample.apis.pet.operations.addPet;
    op.parameters[0].name = 'pet';

    var params = {
      body: {id: 1}
    };
    var opts = { mock: true };
    var req = sample.pet.addPet(params, opts);
    test.object(req.body);
    expect(req.body.id).toBe(1);
  });

  it('verifies headers when fetching the swagger specification', function() {
    var sample = new swagger.SwaggerClient('http://localhost:8000/api-docs.json');
    var req = sample.build(true);
    expect(req.headers.accept).toBe('application/json;charset=utf-8,*/*');
  });

  it('allows override of headers when fetching the swagger specification', function() {
    var opts = {
      swaggerRequestHeaders: 'foo/bar'
    };
    var sample = new swagger.SwaggerClient('http://localhost:8000/api-docs.json', opts);
    var req = sample.build(true);
    expect(req.headers.accept).toBe('foo/bar');
  });

  it('verifies the http request object for a GET with email address query params per https://github.com/swagger-api/swagger-ui/issues/814', function() {
    var petApi = sample.pet;
    var params = {
      headers: {},
      status: 'fehguy@gmail.com'
    };
    var opts = { mock: true };

    var req = petApi.findPetsByStatus(params, opts);

    expect(req.method).toBe("GET");
    expect(req.headers.Accept).toBe("application/json");
    expect(req.url).toBe("http://localhost:8000/v1/api/pet/findByStatus?status=fehguy%40gmail.com");
  });

  it('does not add a query param if not set', function() {
    var petApi = sample.pet;
    var params = {};
    var opts = { mock: true };

    var req = petApi.findPetsByTags(params, opts);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    test.value(req.headers['Content-Type']).isUndefined();
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/findByTags');
  });

  it('does not add a query param if undefined', function() {
    var petApi = sample.pet;
    var params = {status: undefined};
    var opts = { mock: true };

    var req = petApi.findPetsByTags(params, opts);

    expect(req.method).toBe('GET');
    expect(req.headers.Accept).toBe('application/json');
    test.value(req.headers['Content-Type']).isUndefined();
    expect(req.url).toBe('http://localhost:8000/v1/api/pet/findByTags');
  });
});
