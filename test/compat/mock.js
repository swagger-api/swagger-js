var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
var swagger = require('../../lib/swagger-client');
var sample;

exports.swagger = swagger;

exports.petstore = function(arg1, arg2, arg3, arg4) {
  var done = arg1, opts = arg2, callback = arg3, macros = arg4;
  if(typeof arg2 === 'function') {
    opts = null;
    callback = arg2;
    macros = arg3;
  }
  var instance = http.createServer(function(req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join('test/spec', uri);
    // for testing redirects
    if(filename === 'test/spec/v1/api/redirect') {
      console.log('redirect');
      res.writeHead(302, {
        'Location': 'http://localhost:8000/v1/api/pet/1'
      });
      res.end();
    }
    else {
      fs.exists(filename, function(exists) {
        if(exists) {
          var accept = req.headers['accept'];
          if(typeof accept !== 'undefined') {
            if(accept === 'invalid') {
              res.writeHead(500);
              res.end();
              return;
            }
            if(accept.indexOf('application/json') !== -1) {
              res.setHeader("Content-Type", "application/json");
            }
          }
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.writeHead(200, "application/json");
          var fileStream = fs.createReadStream(filename);
          fileStream.pipe(res);
        }
        else if(filename === 'test/spec/v1/api/pet/0') {
          res.writeHead(500);
          res.end();
          return;          
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
    var sample = new swagger.SwaggerClient('http://localhost:8000/v1/api-docs.json', opts);
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