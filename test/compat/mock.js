'use strict';

var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');
var SwaggerClient = require('../..');

exports.petstore = function (arg1, arg2, arg3, arg4) {
  var done = arg1, opts = arg2 || {}, callback = arg3, macros = arg4;

  if (typeof arg2 === 'function') {
    opts = {};
    callback = arg2;
    macros = arg3;
  }

  var instance = http.createServer(function (req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join('test/spec', uri);

    // for testing redirects
    if (filename === 'test/spec/v1/api/redirect') {
      res.writeHead(302, {
        'Location': 'http://localhost:8001/v1/api/pet/1'
      });
      res.end();
    } else {
      fs.exists(filename, function (exists) {
        if (exists) {
          var accept = req.headers.accept;

          if (typeof accept !== 'undefined') {
            if (accept === 'invalid') {
              res.writeHead(500);
              res.end();
              return;
            }

            if (accept.indexOf('application/json') !== -1) {
              res.setHeader('Content-Type', 'application/json');
            }
          }

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.writeHead(200, 'application/json');

          var fileStream = fs.createReadStream(filename);

          fileStream.pipe(res);
        } else if (filename === 'test/spec/v1/api/pet/0') {
          res.writeHead(500);
          res.end();

          return;          
        } else {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.write('404 Not Found\n');
          res.end();
        }
      });
    }
  }).listen(8001);

  instance.on('listening', function () {
    var sample;
    opts.success = function () {
      done();
      callback(sample, instance);
      return;
    };

    opts.url = 'http://localhost:8001/v1/api-docs.json';
    sample = new SwaggerClient(opts);

    if (macros) {
      if (macros.parameter) {
        sample.parameterMacro = macros.parameter;
      }

      if (macros.modelProperty) {
        sample.modelPropertyMacro = macros.modelProperty;
      }
    }
  });
};
