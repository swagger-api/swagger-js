'use strict';

var btoa = require('btoa'); // jshint ignore:line
var CookieJar = require('cookiejar');

/**
 * SwaggerAuthorizations applys the correct authorization to an operation being executed
 */
var SwaggerAuthorizations = module.exports.SwaggerAuthorizations = function () {
  this.authz = {};
};

SwaggerAuthorizations.prototype.add = function (name, auth) {
  this.authz[name] = auth;

  return auth;
};

SwaggerAuthorizations.prototype.remove = function (name) {
  return delete this.authz[name];
};

SwaggerAuthorizations.prototype.apply = function (obj, authorizations) {
  var status = null;
  var key, name, value, result;

  // Apply all authorizations if there were no authorizations to apply
  if (typeof authorizations === 'undefined') {
    for (key in this.authz) {
      value = this.authz[key];
      result = value.apply(obj, authorizations);

      if (result === true) {
        status = true;
      }
    }
  } else {
    // 2.0 support
    if (Array.isArray(authorizations)) {
      for (var i = 0; i < authorizations.length; i++) {
        var auth = authorizations[i];

        for (name in auth) {
          for (key in this.authz) {
            if (key === name) {
              value = this.authz[key];
              result = value.apply(obj, authorizations);

              if (result === true) {
                status = true;
              }
            }
          }
        }
      }
    } else {
      // 1.2 support
      for (name in authorizations) {
        for (key in this.authz) {
          if (key === name) {
            value = this.authz[key];
            result = value.apply(obj, authorizations);

            if (result === true) {
              status = true;
            }
          }
        }
      }
    }
  }

  return status;
};

/**
 * ApiKeyAuthorization allows a query param or header to be injected
 */
var ApiKeyAuthorization = module.exports.ApiKeyAuthorization = function (name, value, type) {
  this.name = name;
  this.value = value;
  this.type = type;
};

ApiKeyAuthorization.prototype.apply = function (obj) {
  if (this.type === 'query') {
    if (obj.url.indexOf('?') > 0) {
      obj.url = obj.url + '&' + this.name + '=' + this.value;
    } else {
      obj.url = obj.url + '?' + this.name + '=' + this.value;
    }

    return true;
  } else if (this.type === 'header') {
    obj.headers[this.name] = this.value;

    return true;
  }
};

var CookieAuthorization = module.exports.CookieAuthorization = function (cookie) {
  this.cookie = cookie;
};

CookieAuthorization.prototype.apply = function (obj) {
  obj.cookieJar = obj.cookieJar || new CookieJar();
  obj.cookieJar.setCookie(this.cookie);

  return true;
};

/**
 * Password Authorization is a basic auth implementation
 */
var PasswordAuthorization = module.exports.PasswordAuthorization = function (name, username, password) {
  this.name = name;
  this.username = username;
  this.password = password;
};

PasswordAuthorization.prototype.apply = function (obj) {
  obj.headers.Authorization = 'Basic ' + btoa(this.username + ':' + this.password);

  return true;
};
