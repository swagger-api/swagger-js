var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
var swagger = require('../lib/swagger');
var sample;

exports.petstore = function(done, callback, macros) {
  var instance = http.createServer(function(req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join('test/spec', uri);
    // for testing redirects
    if(filename === 'test/spec/api/redirect') {
      res.writeHead(302, {
        'Location': 'http://localhost:8000/api/pet/1'
      });
      res.end();
    }
    else {
      fs.exists(filename, function(exists) {
        if(exists) {
          var accept = req.headers['accept'];
          if(typeof accept !== 'undefined') {
            if(accept.indexOf('application/json') !== -1) {
              res.setHeader("Content-Type", "application/json");
            }
          }
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
    }
  }).listen(8000);

  instance.on("listening", function() {
    var self = {}; self.stop = done;

    if(macros) {
      if(macros.parameter) {
        console.log('    warn: set parameter macro');
        swagger.parameterMacro = macros.parameter;
      }
      if(macros.modelProperty) {
        console.log('    warn: set model property macro');
        swagger.modelPropertyMacro = macros.modelProperty;
      }
    }

    var sample = new swagger.SwaggerApi('http://localhost:8000/api-docs.json');
    sample.build();
    var count = 0, isDone = false;
    var f = function () {
      if(!isDone) {
        isDone = true;
        self.stop();
      }
      callback(sample, instance);
      return;
    };
    setTimeout(f, 50);
  });
}