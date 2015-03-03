/**
 * SwaggerAuthorizations applys the correct authorization to an operation being executed
 */
var SwaggerAuthorizations = function() {
  this.authz = {};
};

SwaggerAuthorizations.prototype.add = function(name, auth) {
  this.authz[name] = auth;
  return auth;
};

SwaggerAuthorizations.prototype.remove = function(name) {
  return delete this.authz[name];
};

SwaggerAuthorizations.prototype.apply = function (obj, authorizations) {

  // if the "authorizations" key is undefined, or has an empty array, add all keys
  if (typeof authorizations === 'undefined' || Object.keys(authorizations).length === 0) {
    return this._checkAllKeys(obj);
  }
  else {
    // 2.0 support
    if (Array.isArray(authorizations)) {

      for (var i = 0; i < authorizations.length; i++) {
        var auth = authorizations[i];
        var result = this._checkAuth(obj, auth);

        if(result !== true)
          return false;
      }
    }
    else {
      // 1.2 support
      return this._checkAuth(obj, authorizations);
    }
  }

  return true;
};

SwaggerAuthorizations.prototype._checkAuth = function (obj, authorization) {
  for (var name in authorization) {
    var value = this.authz[name];

    if(typeof value !== "undefined") {
      var result = value.apply(obj);

      if(result !== true)
        return false;
    }
  }

  return true;
};

SwaggerAuthorizations.prototype._checkAllKeys = function(obj) {
  for (var key in this.authz) {
    var value  = this.authz[key];
    var result = value.apply(obj);

    if (result !== true)
      return false;
  }

  return true;
};

/**
 * ApiKeyAuthorization allows a query param or header to be injected
 */
var ApiKeyAuthorization = function(name, value, type) {
  this.name = name;
  this.value = value;
  this.type = type;
};

ApiKeyAuthorization.prototype.apply = function(obj) {
  if (this.type === "query") {
    if (obj.url.indexOf('?') > 0)
      obj.url = obj.url + "&" + this.name + "=" + this.value;
    else
      obj.url = obj.url + "?" + this.name + "=" + this.value;
    return true;
  } else if (this.type === "header") {
    obj.headers[this.name] = this.value;
    return true;
  }
};

var CookieAuthorization = function(cookie) {
  this.cookie = cookie;
};

CookieAuthorization.prototype.apply = function(obj) {
  obj.cookieJar = obj.cookieJar || CookieJar();
  obj.cookieJar.setCookie(this.cookie);
  return true;
};

/**
 * Password Authorization is a basic auth implementation
 */
var PasswordAuthorization = function(name, username, password) {
  this.name = name;
  this.username = username;
  this.password = password;
  this._btoa = null;
  if (typeof window !== 'undefined')
    this._btoa = btoa;
  else
    this._btoa = require("btoa");
};

PasswordAuthorization.prototype.apply = function(obj) {
  var base64encoder = this._btoa;
  obj.headers.Authorization = "Basic " + base64encoder(this.username + ":" + this.password);
  return true;
};
