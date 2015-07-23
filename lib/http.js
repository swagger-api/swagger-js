'use strict';

var helpers = require('./helpers');
var jQuery = require('jquery');
var request = require('superagent');
var jsyaml = require('js-yaml');
var _ = {
  isObject: require('lodash-compat/lang/isObject')
};

/*
 * JQueryHttpClient is a light-weight, node or browser HTTP client
 */
var JQueryHttpClient = function () {};

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

  // legacy support
  if ((obj && obj.useJQuery === true) || this.isInternetExplorer()) {
    client = new JQueryHttpClient(opts);
  }

  var success = obj.on.response;

  var responseInterceptor = function(data) {
    if(opts && opts.responseInterceptor) {
      data = opts.responseInterceptor.apply(data);
    }
    success(data);
  };

  obj.on.response = function(data) {
    responseInterceptor(data);
  };


  if (_.isObject(obj) && _.isObject(obj.body)) {
    // special processing for file uploads via jquery
    if (obj.body.type && obj.body.type === 'formData'){
      obj.contentType = false;
      obj.processData = false;

      delete obj.headers['Content-Type'];
    } else {
      obj.body = JSON.stringify(obj.body);
    }
  }
  client.execute(obj);
};

SwaggerHttp.prototype.isInternetExplorer = function () {
  var detectedIE = false;

  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    var nav = navigator.userAgent.toLowerCase();

    if (nav.indexOf('msie') !== -1) {
      var version = parseInt(nav.split('msie')[1]);

      if (version <= 8) {
        detectedIE = true;
      }
    }
  }

  return detectedIE;
};

JQueryHttpClient.prototype.execute = function (obj) {
  var cb = obj.on;
  var request = obj;

  obj.type = obj.method;
  obj.cache = false;
  delete obj.useJQuery;

  /*
  obj.beforeSend = function (xhr) {
    var key, results;
    if (obj.headers) {
      results = [];
      for (key in obj.headers) {
        if (key.toLowerCase() === 'content-type') {
          results.push(obj.contentType = obj.headers[key]);
        } else if (key.toLowerCase() === 'accept') {
          results.push(obj.accepts = obj.headers[key]);
        } else {
          results.push(xhr.setRequestHeader(key, obj.headers[key]));
        }
      }
      return results;
    }
  };*/

  obj.data = obj.body;

  delete obj.body;

  obj.complete = function (response) {
    var headers = {};
    var headerArray = response.getAllResponseHeaders().split('\n');

    for (var i = 0; i < headerArray.length; i++) {
      var toSplit = headerArray[i].trim();

      if (toSplit.length === 0) {
        continue;
      }

      var separator = toSplit.indexOf(':');

      if (separator === -1) {
        // Name but no value in the header
        headers[toSplit] = null;

        continue;
      }

      var name = toSplit.substring(0, separator).trim();
      var value = toSplit.substring(separator + 1).trim();

      headers[name] = value;
    }

    var out = {
      url: request.url,
      method: request.method,
      status: response.status,
      statusText: response.statusText,
      data: response.responseText,
      headers: headers
    };

    try {
      var possibleObj =  response.responseJSON || jsyaml.safeLoad(response.responseText);
      out.obj = (typeof possibleObj === 'string') ? {} : possibleObj;
    } catch (ex) {
      // do not set out.obj
      helpers.log('unable to parse JSON/YAML content');
    }

    // I can throw, or parse null?
    out.obj = out.obj || null;

    if (response.status >= 200 && response.status < 300) {
      cb.response(out);
    } else if (response.status === 0 || (response.status >= 400 && response.status < 599)) {
      cb.error(out);
    } else {
      return cb.response(out);
    }
  };

  jQuery.support.cors = true;

  return jQuery.ajax(obj);
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
