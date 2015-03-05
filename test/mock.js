var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
var swagger = require('../lib/swagger-client');
var sample;

exports.petstore = function(arg1, arg2, arg3, arg4) {
  var done = arg1, opts = arg2, callback = arg3, macros = arg4;
  if(typeof arg2 === 'function') {
    opts = {};
    callback = arg2;
    macros = arg3;
  }
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
          if(req.method === 'POST') {
            var body = '';
            req.on('data', function (data) {
              body += data.toString();
            });
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Content-Type", "application/json");
            res.writeHead(200, "application/json");
            res.write(body);
            res.end();
            return;
          }
          var accept = req.headers.accept;
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
        else if(filename === 'test/compat/spec/api/pet/0') {
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
    opts.url = 'http://localhost:8000/v2/petstore.json';
    opts.success = function() {
      done();
      callback(sample, instance);
      return;
    };
    var sample = new swagger.SwaggerClient(opts);
  });
};