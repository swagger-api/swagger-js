var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
var swagger = require('../lib/swagger');
var sample;

exports.petstore = function(done, callback) {
  var instance = http.createServer(function(req, res) {
    var uri = url.parse(req.url).pathname;
    var filename = path.join('test/spec', uri);

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
  }).listen(8000);

  instance.on("listening", function() {
    var self = {}; self.stop = done;
    console.log("started http server");

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