/**
 * SwaggerHttp is a wrapper for executing requests
 */
var SwaggerHttp = function() {};

SwaggerHttp.prototype.execute = function(obj, opts) {
  if(obj && (typeof obj.useJQuery === 'boolean'))
    this.useJQuery = obj.useJQuery;
  else
    this.useJQuery = this.isIE8();

  if(obj && typeof obj.body === 'object') {
    if(obj.body.type && obj.body.type !== 'formData')
      obj.body = JSON.stringify(obj.body);
    else {
      obj.contentType = false;
      obj.processData = false;
      // delete obj.cache;
      delete obj.headers['Content-Type'];
    }
  }

  if(this.useJQuery)
    return new JQueryHttpClient(opts).execute(obj);
  else
    return new ShredHttpClient(opts).execute(obj);
};

SwaggerHttp.prototype.isIE8 = function() {
  var detectedIE = false;
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    nav = navigator.userAgent.toLowerCase();
    if (nav.indexOf('msie') !== -1) {
      var version = parseInt(nav.split('msie')[1]);
      if (version <= 8) {
        detectedIE = true;
      }
    }
  }
  return detectedIE;
};

/*
 * JQueryHttpClient lets a browser take advantage of JQuery's cross-browser magic.
 * NOTE: when jQuery is available it will export both '$' and 'jQuery' to the global space.
 *       Since we are using closures here we need to alias it for internal use.
 */
var JQueryHttpClient = function(options) {
  "use strict";
  if(!jQuery){
    var jQuery = window.jQuery;
  }
};

JQueryHttpClient.prototype.execute = function(obj) {
  var cb = obj.on;
  var request = obj;

  obj.type = obj.method;
  obj.cache = false;
  delete obj.useJQuery;

  /*
  obj.beforeSend = function(xhr) {
    var key, results;
    if (obj.headers) {
      results = [];
      for (key in obj.headers) {
        if (key.toLowerCase() === "content-type") {
          results.push(obj.contentType = obj.headers[key]);
        } else if (key.toLowerCase() === "accept") {
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
  obj.complete = function(response, textStatus, opts) {
    var headers = {},
      headerArray = response.getAllResponseHeaders().split("\n");

    for(var i = 0; i < headerArray.length; i++) {
      var toSplit = headerArray[i].trim();
      if(toSplit.length === 0)
        continue;
      var separator = toSplit.indexOf(":");
      if(separator === -1) {
        // Name but no value in the header
        headers[toSplit] = null;
        continue;
      }
      var name = toSplit.substring(0, separator).trim(),
        value = toSplit.substring(separator + 1).trim();
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

    var contentType = (headers["content-type"]||headers["Content-Type"]||null);
    if(contentType) {
      if(contentType.indexOf("application/json") === 0 || contentType.indexOf("+json") > 0) {
        try {
          out.obj = response.responseJSON || JSON.parse(out.data) || {};
        } catch (ex) {
          // do not set out.obj
          log("unable to parse JSON content");
        }
      }
    }

    if(response.status >= 200 && response.status < 300)
      cb.response(out);
    else if(response.status === 0 || (response.status >= 400 && response.status < 599))
      cb.error(out);
    else
      return cb.response(out);
  };

  jQuery.support.cors = true;
  return jQuery.ajax(obj);
};

/*
 * ShredHttpClient is a light-weight, node or browser HTTP client
 */
var ShredHttpClient = function(opts) {
  this.opts = (opts||{});
  this.isInitialized = false;

  var identity, toString;

  if (typeof window !== 'undefined') {
    this.Shred = require("./shred");
    this.content = require("./shred/content");
  }
  else
    this.Shred = require("shred");
  this.shred = new this.Shred(opts);
};

ShredHttpClient.prototype.initShred = function () {
  this.isInitialized = true;
  this.registerProcessors(this.shred);
};

ShredHttpClient.prototype.registerProcessors = function(shred) {
  var identity = function(x) {
    return x;
  };
  var toString = function(x) {
    return x.toString();
  };

  if (typeof window !== 'undefined') {
    this.content.registerProcessor(["application/json; charset=utf-8", "application/json", "json"], {
      parser: identity,
      stringify: toString
    });
  } else {
    this.Shred.registerProcessor(["application/json; charset=utf-8", "application/json", "json"], {
      parser: identity,
      stringify: toString
    });
  }
};

ShredHttpClient.prototype.execute = function(obj) {
  if(!this.isInitialized)
    this.initShred();

  var cb = obj.on, res;
  var transform = function(response) {
    var out = {
      headers: response._headers,
      url: response.request.url,
      method: response.request.method,
      status: response.status,
      data: response.content.data
    };

    var headers = response._headers.normalized || response._headers;
    var contentType = (headers["content-type"]||headers["Content-Type"]||null);

    if(contentType) {
      if(contentType.indexOf("application/json") === 0 || contentType.indexOf("+json") > 0) {
        if(response.content.data && response.content.data !== "")
          try{
            out.obj = JSON.parse(response.content.data);
          }
          catch (e) {
            // unable to parse
          }
        else
          out.obj = {};
      }
    }
    return out;
  };

  // Transform an error into a usable response-like object
  var transformError = function (error) {
    var out = {
      // Default to a status of 0 - The client will treat this as a generic permissions sort of error
      status: 0,
      data: error.message || error
    };

    if (error.code) {
      out.obj = error;

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        // We can tell the client that this should be treated as a missing resource and not as a permissions thing
        out.status = 404;
      }
    }
    return out;
  };

  res = {
    error: function (response) {
      if (obj)
        return cb.error(transform(response));
    },
    // Catch the Shred error raised when the request errors as it is made (i.e. No Response is coming)
    request_error: function (err) {
      if (obj)
        return cb.error(transformError(err));
    },
    response: function (response) {
      if (obj) {
        return cb.response(transform(response));
      }
    }
  };
  if (obj) {
    obj.on = res;
  }
  return this.shred.request(obj);
};
