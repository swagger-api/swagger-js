'use strict';

var auth = require('./lib/auth');
var helpers = require('./lib/helpers');
var SwaggerClient = require('./lib/client');
var deprecationWrapper = function (url, options) {
  helpers.log('This is deprecated, use "new SwaggerClient" instead.');

  return new SwaggerClient(url, options);
};

/* Here for IE8 Support */
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(obj, start) {
    for (var i = (start || 0), j = this.length; i < j; i++) {
      if (this[i] === obj) { return i; }
    }
    return -1;
  };
}

/* Here for IE8 Support */
if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

/* Here for node 10.x support */
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

module.exports = SwaggerClient;

SwaggerClient.ApiKeyAuthorization = auth.ApiKeyAuthorization;
SwaggerClient.PasswordAuthorization = auth.PasswordAuthorization;
SwaggerClient.CookieAuthorization = auth.CookieAuthorization;
SwaggerClient.SwaggerApi = deprecationWrapper;
SwaggerClient.SwaggerClient = deprecationWrapper;
SwaggerClient.SchemaMarkup = require('./lib/schema-markup');
