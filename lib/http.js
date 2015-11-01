'use strict';

var helpers = require('./helpers');
var request = require('superagent');
var jsyaml = require('js-yaml');
var _ = {
  isObject: require('lodash-compat/lang/isObject')
};

/*
 * SuperagentHttpClient is a light-weight, node or browser HTTP client
 */
var SuperagentHttpClient = function () {};

/**
 * SwaggerHttp is a wrapper for executing requests
 */
var SwaggerHttp = module.exports = function () {};

SwaggerHttp.prototype.execute = function (obj, opts) {
  var client;

  if(opts && opts.client) {
    client = opts.client;
  }
  else {
    client = new SuperagentHttpClient(opts);
  }

  var success = obj.on.response;

  var responseInterceptor = function(data) {
    if(opts && opts.responseInterceptor) {
      data = opts.responseInterceptor.apply(data);
    }
    return success(data);
  };

  obj.on.response = function(data) {
    responseInterceptor(data);
  };


  if (_.isObject(obj) && _.isObject(obj.body)) {
    obj.body = JSON.stringify(obj.body);
  }

  client.execute(obj);

  return (obj.deferred) ? obj.deferred.promise : null;
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

  if(typeof r.buffer === 'function') {
    r.buffer(); // force superagent to populate res.text with the raw response data
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
      var possibleObj;

      // Already parsed by by superagent?
      if(res.body && Object.keys(res.body).length > 0) {
        possibleObj = res.body;
      } else {
          try {
            possibleObj = jsyaml.safeLoad(res.text);
            // can parse into a string... which we don't need running around in the system
            possibleObj = (typeof possibleObj === 'string') ? null : possibleObj;
          } catch(e) {
            helpers.log('cannot parse JSON/YAML content');
          }
      }

      // null means we can't parse into object
      response.obj = possibleObj || null;

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
