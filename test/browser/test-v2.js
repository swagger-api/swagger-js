'use strict';

var expect = require('expect');
var driver = require('./driver');
var servers = require('./servers');

describe('swagger-js browser tests', function () {
  this.timeout(10 * 1000);

  before(function (done) {
    this.timeout(25 * 1000);
    servers.start('/v2/petstore.json', done);
  });

  afterEach(function(){
    it('should not have any console errors', function (done) {
      driver.manage().logs().get('browser').then(function(browserLogs) {
        var errors = [];
        browserLogs.forEach(function(log){
          // 900 and above is "error" level. Console should not have any errors
          if (log.level.value > 900) {
            console.log('browser error message:', log.message); errors.push(log);
          }
        });
        expect(errors).to.be.empty;
        done();
      });
    });
  });

  it('should create body when file parameter present', function (done) {
    driver.manage().timeouts().setScriptTimeout(5000);
    driver.executeAsyncScript(function() {
      var callback = arguments[arguments.length - 1];
      var client = new SwaggerClient({
        url: 'http://localhost:8081/v2/petstore.json',
        useJQuery: true,
        success: function() {
          var req = client.pet.uploadFile({petId: 1, file: new Blob(['Hello World'], {type: 'text/plain'})}, {mock: true});
          callback(req)
        },
        failure: function() {
          throw 'unable to create SwaggerClient';
        }
      });
    }).then(function(req) {
      expect(req.useJQuery).toBe(true);
      expect(req.method).toBe('POST');
      expect(req.headers['Content-Type']).toBe('multipart/form-data');
      expect(req.body).toNotBe(null);
      expect(req.body).toNotBe(undefined);
      expect(req.body.type).toBe('formData');
      done();
    }, function(err) {
      throw err;
    });
  });

  after(function() {
    servers.close();
  });
});
