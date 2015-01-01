var test = require('unit.js')
var should = require('should')
var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
var swagger = require('../lib/swagger')
var sample;

describe('operations', function() {
  before(function(done) {
    instance = http.createServer(function(req, res) {
      var uri = url.parse(req.url).pathname;
      var filename = path.join('test/spec', uri);

      fs.exists(filename, function(exists) {
        if(exists) {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.writeHead(200, "application/json");
          var fileStream = fs.createReadStream(filename);
          fileStream.pipe(res);
        }
        else {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.write('404 Not Found\n');
          res.end();
        }
      });
    }).listen(8000);

    instance.on("listening", function() {
      var self = {}; self.stop = done;
      console.log("started http server");

      sample = new swagger.SwaggerApi('http://localhost:8000/api-docs.json');
      sample.build();
      var count = 0, isDone = false;
      var f = function () {
        if(!isDone) {
          isDone = true;
          self.stop();
        }
        return;
      };
      setTimeout(f, 50);
    });
  });

  after(function(done){
    instance.close();
    console.log("stopped");
    done();
  });

  it('verify the help function', function() {
    var petApi = sample.pet;
    test.object(petApi);
    var help = petApi.getPetById.help();
    should(help).equal('* petId (required) - ID of pet that needs to be fetched');
  })

  it('generate a get request', function() {
    var petApi = sample.pet;
    var req = petApi.getPetById({petId: 1}, {mock: true});

    test.object(req);
    should(req.method).equal('GET');
    should(req.headers['Accept']).equal('application/json');
    should(req.url).equal('http://petstore.swagger.wordnik.com/api/pet/1');
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
    should(req.url).equal("http://petstore.swagger.wordnik.com/api/pet/findByStatus?status=available");
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
    should(req.url).equal("http://petstore.swagger.wordnik.com/api/pet");
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
    should(req.url).equal('http://petstore.swagger.wordnik.com/api/pet/1');
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
    should(req.url).equal('http://petstore.swagger.wordnik.com/api/pet');
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
    should(req.url).equal('http://petstore.swagger.wordnik.com/api/pet/100');
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
    should(req.url).equal('http://petstore.swagger.wordnik.com/api/pet/findByStatus?status=a%20b%20c%20d%20e');
  })
})