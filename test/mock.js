'use strict';

//var expect = require('expect');
var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var SwaggerClient = require('..');

exports.petstore = function (arg1, arg2, arg3, arg4) {
  var done = arg1, opts = arg2, callback = arg3, macros = arg4;

  if (typeof arg2 === 'function') {
    opts = {};
    callback = arg2;
    macros = arg3;
  }

  var instance = http.createServer(function (req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join('test/spec', uri);

    // for testing blobs
    if(filename === 'test/spec/v2/blob/image.png') {
      var readStream = fs.createReadStream(filename);
      var headers = {
        'Content-Type': 'image/png'
      };

      res.writeHead(200, headers);
      readStream.pipe(res);
    }
    // for testing redirects
    else if(filename === 'test/spec/v2/api/pet/666' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(400, 'application/json');
      res.write(JSON.stringify({
        code: 400,
        type: 'bad input',
        message: 'sorry!'
      }));

      res.end();
    }
    else if (filename === 'test/spec/api/redirect') {
      res.writeHead(302, {
        'Location': 'http://localhost:8000/api/pet/1'
      });
      res.end();
    } else {
      fs.exists(filename, function (exists) {
        if (exists) {
          if (req.method === 'POST') {
            var body = '';

            req.on('data', function (data) {
              body += data.toString();
            });
            req.on('end', function () {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Content-Type', 'application/json');
              res.writeHead(200, 'application/json');
              res.write(body);
              res.end();
            });

            return;
          }
          var accept = req.headers.accept;
          var contentType;
          if(filename.indexOf('.yaml') > 0) {
            contentType = 'application/yaml';
          }
          else {
            contentType = 'application/json';
          }

          if (typeof accept !== 'undefined') {
            if (accept === 'invalid') {
              res.writeHead(500);
              res.end();
              return;
            }

            if (accept.indexOf('application/json') >= 0) {
              contentType = accept;
              res.setHeader('Content-Type', contentType);
            }
            if (filename.indexOf('.yaml') > 0) {
              res.setHeader('Content-Type', 'application/yaml');
            }
          }

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.writeHead(200, contentType);

          var fileStream = fs.createReadStream(filename);
          fileStream.pipe(res);
        } else if (filename === 'test/compat/spec/api/pet/0') {
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
  }).listen(8000);

  instance.on('listening', function () {
    var sample;

    opts = opts || {};
    opts.url = opts.url || 'http://localhost:8000/v2/petstore.json';
    opts.success = function () {
      done();
      callback(sample, instance);
      return;
    };

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