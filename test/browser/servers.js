/*
 * Swagger UI and Specs Servers
*/
'use strict';

var path = require('path');
var createServer = require('http-server').createServer;
var dist = path.join(__dirname, '..', '..', 'browser');
var specs = path.join(__dirname, '..', '..', 'test', 'spec');
var DOCS_PORT = 8080;
var SPEC_SERVER_PORT = 8081;
var driver = require('./driver');
var swaggerBrowserClient;
var specServer;

module.exports.start = function (specsLocation, done) {
  swaggerBrowserClient = createServer({ root: dist, cors: true });
  specServer = createServer({ root: specs, cors: true });

  swaggerBrowserClient.listen(DOCS_PORT);
  specServer.listen(SPEC_SERVER_PORT);

  var swaggerSpecLocation = encodeURIComponent('http://localhost:' + SPEC_SERVER_PORT + specsLocation);
  var url = 'http://localhost:' + DOCS_PORT + '/index.html?url=' + swaggerSpecLocation;

  setTimeout(function(){
    driver.get(url);
    done();
  }, process.env.TRAVIS ? 20000 : 3000);
};

module.exports.close = function() {
  swaggerBrowserClient.close();
  specServer.close();
};
