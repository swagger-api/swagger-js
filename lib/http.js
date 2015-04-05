'use strict';

var helpers = require('./helpers');
var request = require('superagent');

/*
 * SuperagentHttpClient is a light-weight, node or browser HTTP client
 */
var SuperagentHttpClient = function () {};

/**
 * SwaggerHttp is a wrapper for executing requests
 */
var SwaggerHttp = module.exports = function () {};

SwaggerHttp.prototype.execute = function (obj, opts) {

  if (obj && typeof obj.body === 'object') {
    // special processing for file uploads via jquery
    // TODO: not sure this is still needed
    if (obj.body.type && obj.body.type === 'formData'){
      obj.contentType = false;
      obj.processData = false;

      delete obj.headers['Content-Type'];
    } else {
      obj.body = JSON.stringify(obj.body);
    }
  }

  return new SuperagentHttpClient().execute(obj);
};

SuperagentHttpClient.prototype.execute = function (obj) {
  var method = obj.method.toLowerCase();

  if (method === 'delete') {
    method = 'del';
  }

  var headers = obj.headers || {};
  var r = request[method](obj.url);
  var name;

  for (name in headers) {
    r.set(name, headers[name]);
  }

  if (obj.body) {
    r.send(obj.body);
  }

  r.end(function (err, res) {
    res = res || {
      status: 0,
      headers: {error: 'no response from server'}
    };
    var response = {
      url: obj.url,
      method: obj.method,
      headers: res.headers
    };
    var cb;

    if (!err && res.error) {
      err = res.error;
    }

    if (err && obj.on && obj.on.error) {
      response.obj = err;
      response.status = res ? res.status : 500;
      response.statusText = res ? res.text : err.message;
      cb = obj.on.error;
    } else if (res && obj.on && obj.on.response) {
      response.obj = (typeof res.body !== 'undefined') ? res.body : res.text;
      response.status = res.status;
      response.statusText = res.text;
      cb = obj.on.response;
    }
    response.data = response.statusText;

    if (cb) {
      cb(response);
    }
  });
};
