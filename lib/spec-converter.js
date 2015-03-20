'use strict';

var helpers = require('./helpers');
var SwaggerClient = require('./client');
var SwaggerHttp = require('./http');

var SwaggerSpecConverter = module.exports = function () {
  var errors = [];
  var warnings = [];
};

SwaggerSpecConverter.prototype.setDocumentationLocation = function (location) {
  this.docLocation = location;
};

/**
 * converts a resource listing OR api declaration
 **/
SwaggerSpecConverter.prototype.convert = function (obj, callback) {
  var result = {};

  // not a valid spec
  if(!obj || !Array.isArray(obj.apis)) {
    return this.finish(callback, null);
  }

  // create a new swagger object to return
  var swagger = { swagger: '2.0' };

  // add the info
  this.apiInfo(obj, swagger);

  // add security definitions
  this.securityDefinitions(obj, swagger);

  // see if this is a single-file swagger definition
  var isSingleFileSwagger = false;
  for(var api in obj.apis) {
    if(typeof api.operations === 'object')
      isSingleFileSwagger = true;
  }
  if(isSingleFileSwagger) {
    this.declaration(obj, swagger);
    this.finish(callback, swagger);
  }
  else {
    this.resourceListing(obj, swagger, callback);
  }
};

SwaggerSpecConverter.prototype.declaration = function(obj, swagger, callback) {
  
};

SwaggerSpecConverter.prototype.resourceListing = function(obj, swagger, callback) {
  var self = this;
  var i, processedCount = 0;
  var expectedCount = obj.apis.length;

  if(expectedCount === 0)
    this.finish(callback, swagger);
  for(i = 0; i < expectedCount; i++) {
    var api = obj.apis[i];
    var path = api.path;
    var absolutePath = this.getAbsolutePath(this.docLocation, path);
    var http = {
      url: absolutePath,
      on: {},
      method: 'get'
    };
    http.on.response = function(data) {
      processedCount += 1;
      if(data.obj)
        self.declaration(data.obj, swagger);
      if(processedCount === expectedCount)
        self.finish(callback, swagger);
    };
    http.on.error = function(data) {
      processedCount += 1;
      console.log(data);
      if(processedCount === expectedCount)
        self.finish(callback, swagger);
    };
    new SwaggerHttp().execute(http);
  }
};

SwaggerSpecConverter.prototype.getAbsolutePath = function(docLocation, path)  {
  // TODO
  if(path.indexOf('http') == 0)
    return path;
  else
    return docLocation + '/' + path;
};

SwaggerSpecConverter.prototype.securityDefinitions = function(obj, swagger) {
  if(obj.authorizations) {
    var name;
    for(name in obj.authorizations) {
      var isValid = false;
      var securityDefinition = {};
      var definition = obj.authorizations[name];
      if(definition.type === 'apiKey') {
        securityDefinition.type = 'apiKey';
        securityDefinition.in = definition.passAs;
        securityDefinition.name = definition.keyname || name;
        isValid = true;
      }
      else if(definition.type === 'oauth2') {
        var existingScopes = definition.scopes || [];
        var scopes = {};
        var i;
        for(i in existingScopes) {
          var scope = existingScopes[i];
          scopes[scope.scope] = scope.description;
        }
        securityDefinition.type = 'oauth2';
        if(i > 0)
          securityDefinition.scopes = scopes;        
        if(definition.grantTypes) {
          if(definition.grantTypes.implicit) {
            var implicit = definition.grantTypes.implicit;
            securityDefinition.flow = 'implicit';
            securityDefinition.authorizationUrl = implicit.loginEndpoint;
            isValid = true;
          }
          if(definition.grantTypes.authorization_code) {
            if(!securityDefinition.flow) {
              // cannot set if flow is already defined
              var authCode = definition.grantTypes.authorization_code;
              securityDefinition.flow = 'accessCode';
              securityDefinition.authorizationUrl = authCode.tokenRequestEndpoint.url;
              securityDefinition.tokenUrl = authCode.tokenEndpoint.url;
              isValid = true;
            }
          }
        }
      }
      if(isValid) {
        swagger.securityDefinitions = swagger.securityDefinitions || {};
        swagger.securityDefinitions[name] = securityDefinition;
      }
    }
  }
};

SwaggerSpecConverter.prototype.apiInfo = function(obj, swagger) {
  // info section
  if(obj.info) {
    var info = obj.info;
    swagger.info = {};

    if(info.description)
      swagger.info.description = info.description;
    if(info.title)
      swagger.info.title = info.title;
    if(info.termsOfServiceUrl)
      swagger.info.termOfService = info.termsOfServiceUrl;
    if(info.license || info.licenseUrl) {
      swagger.license = {};
      if(info.license)
        swagger.license.name = info.license;
      if(info.licenseUrl)
        swagger.license.url = info.licenseUrl;
    }

  }
  else {
    this.warnings.push("missing info section");
  }
};

SwaggerSpecConverter.prototype.finish = function (callback, obj) {
  callback(obj);
};