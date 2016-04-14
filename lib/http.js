'use strict';

var helpers = require('./helpers');
var request = require('superagent');
require('superagent-proxy')(request);
var jsyaml = require('js-yaml');
var _ = {
  isObject: require('lodash-compat/lang/isObject')
};

/*
 * JQueryHttpClient is a light-weight, node or browser HTTP client
 */
var JQueryHttpClient = function () {
  this.type = 'JQueryHttpClient';
};

/*
 * SuperagentHttpClient is a light-weight, node or browser HTTP client
 */
var SuperagentHttpClient = function (opts) {
  this.type = 'SuperagentHttpClient';
  this.opts = opts || {};
};

/**
 * SwaggerHttp is a wrapper for executing requests
 */
var SwaggerHttp = module.exports = function () {};

SwaggerHttp.prototype.execute = function (obj, opts) {
  var client;
  var proxy = null;
  
  if (process && process.env && process.env.http_proxy) {
    proxy = process.env.http_proxy;
  }
  else if(opts.proxy && opts.proxy !== null) {
    proxy = opts.proxy;
  }
  else {
    proxy = this.proxy;
  }
  
  if (proxy !== null) {
    opts.proxy = obj.proxy = proxy;
  }

  if(opts && opts.client) {
    client = opts.client;
  }
  else {
    client = new SuperagentHttpClient(opts);
  }
  
  client.opts = opts || {};

  // legacy support
  var hasJQuery = false;
  if(typeof window !== 'undefined') {
    if(typeof window.jQuery !== 'undefined') {
      hasJQuery = true;
    }
  }
  // OPTIONS support
  if(obj.method.toLowerCase() === 'options' && client.type === 'SuperagentHttpClient') {
    log('forcing jQuery as OPTIONS are not supported by SuperAgent');
    obj.useJQuery = true;
  }
  if(this.isInternetExplorer() && (obj.useJQuery === false || !hasJQuery )) {
    throw new Error('Unsupported configuration! JQuery is required but not available');
  }
  if ((obj && obj.useJQuery === true) || this.isInternetExplorer() && hasJQuery) {
    client = new JQueryHttpClient(opts);
  }

  var success = obj.on.response;

  var requestInterceptor = function(data) {
    if(opts && opts.requestInterceptor) {
      data = opts.requestInterceptor.apply(data);
    }
    return data;
  };

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
    // special processing for file uploads via jquery
    if (obj.body.type && obj.body.type === 'formData'){
      obj.contentType = false;
      obj.processData = false;

      delete obj.headers['Content-Type'];
    } else {
      obj.body = JSON.stringify(obj.body);
    }
  }

  obj = requestInterceptor(obj) || obj;
  if (obj.beforeSend) {
    obj.beforeSend(function(_obj) {
      client.execute(_obj || obj);
    });
  } else {
    client.execute(obj);
  }

  return (obj.deferred) ? obj.deferred.promise : obj;
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
  var jq = this.jQuery || (typeof window !== 'undefined' && window.jQuery);
  var cb = obj.on;
  var request = obj;

  if(typeof jq === 'undefined' || jq === false) {
    throw new Error('Unsupported configuration! JQuery is required but not available');
  }

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

  jq.support.cors = true;

  return jq.ajax(obj);
};

SuperagentHttpClient.prototype.execute = function (obj) {
  var method = obj.method.toLowerCase();

  if (method === 'delete') {
    method = 'del';
  }
  var headers = obj.headers || {};
  var r = request[method](obj.url);
  
  if (obj.proxy) {
    r.proxy(obj.proxy);
  }
  
  var name;
  for (name in headers) {
    r.set(name, headers[name]);
  }

  if (obj.enableCookies) {
    r.withCredentials();
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
      response.errObj = err;
      response.status = res ? res.status : 500;
      response.statusText = res ? res.text : err.message;
      if(res.headers && res.headers['content-type']) {
        if(res.headers['content-type'].indexOf('application/json') >= 0) {
          try {
            response.obj = JSON.parse(response.statusText);
          }
          catch (e) {
            response.obj = null;
          }
        }
      }
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
      response.obj = (typeof possibleObj === 'object') ? possibleObj : null;

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
