'use strict';

var helpers = require('./helpers');
var SwaggerClient = require('./client');
var SwaggerHttp = require('./http');

var SwaggerSpecConverter = module.exports = function () {
  this.errors = [];
  this.warnings = [];
  this.modelMap = {};
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
  var i;
  for(i = 0; i < obj.apis.length; i++) {
    var api = obj.apis[i];
    if(Array.isArray(api.operations))
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

SwaggerSpecConverter.prototype.declaration = function(obj, swagger) {
  if(!obj.apis)
    return;

  // build a mapping of id to name for 1.0 model resolutions
  var name;
  for(name in obj.models) {
    var existingModel = obj.models[name];
    var key = (existingModel.id || name);
    this.modelMap[key] = name;
  }

  var i;
  for(i = 0; i < obj.apis.length; i++) {
    var api = obj.apis[i];
    var path = api.path;
    var operations = api.operations;
    this.operations(path, operations, swagger);
  }

  var models = obj.models;
  this.models(models, swagger);
};

SwaggerSpecConverter.prototype.models = function(obj, swagger) {
  if(typeof obj !== 'object')
    return;

  swagger.definitions = swagger.definitions || {};
  var name;
  for(name in obj) {
    var existingModel = obj[name];
    var _enum = [];
    var schema = { properties: {}};
    var propertyName;
    for(propertyName in existingModel.properties) {
      var existingProperty = existingModel.properties[propertyName];
      var property = {};
      this.dataType(existingProperty, property);
      if(existingProperty.description)
        property.description = existingProperty.description;
      if(existingProperty['enum'])
        property['enum'] = existingProperty['enum'];
      if(typeof existingProperty.required === 'boolean' && existingProperty.required === true)
        _enum.push(propertyName);
      if(typeof existingProperty.required === 'string' && existingProperty.required === 'true')
        _enum.push(propertyName);
      schema.properties[propertyName] = property;
    }
    if(_enum.length > 0)
      schema['enum'] = _enum;
    swagger.definitions[name] = schema;
  }
}

SwaggerSpecConverter.prototype.operations = function(path, obj, swagger) {
  if(!Array.isArray(obj))
    return;
  var i;
  if(!swagger.paths)
    swagger.paths = {};
  var pathObj = swagger.paths[path] || {};
  for(i = 0; i < obj.length; i++) {
    var existingOperation = obj[i];
    var method = (existingOperation.method || existingOperation.httpMethod).toLowerCase();

    var operation = {};
    if(existingOperation.summary)
      operation.summary = existingOperation.summary;
    existingOperation.summary;
    if(existingOperation.notes)
      operation.description = existingOperation.notes;
    if(existingOperation.nickname)
      operation.operationId = existingOperation.nickname;

    this.authorizations(existingOperation.authorizations, swagger);
    this.parameters(operation, existingOperation.parameters, swagger);
    this.responseMessages(operation, existingOperation, swagger);

    pathObj[method] = operation;
  }

  swagger.paths[path] = pathObj;
};

SwaggerSpecConverter.prototype.responseMessages = function(operation, existingOperation, swagger) {
  if(typeof existingOperation !== 'object')
    return;
  // build default response from the operation (1.x)
  var defaultResponse = {};
  this.dataType(existingOperation, defaultResponse);

  operation.responses = operation.responses || {};

  // grab from responseMessages (1.2)
  var has200 = false;
  if(Array.isArray(existingOperation.responseMessages)) {
    var i;
    var existingResponses = existingOperation.responseMessages;
    for(i = 0; i < existingResponses.length; i++) {
      var existingResponse = existingResponses[i];
      var response = { description: existingResponse.message };
      if(existingResponse.code == 200)
        has200 = true;
      operation.responses['' + existingResponse.code] = response;
      // TODO: schema
    }
  }

  if(has200)
    operation.responses['default'] = defaultResponse;
  else
    operation.responses['200'] = defaultResponse;
};

SwaggerSpecConverter.prototype.authorizations = function(obj, swagger) {
  // TODO
  if(typeof obj !== 'object')
    return;
};

SwaggerSpecConverter.prototype.parameters = function(operation, obj, swagger) {
  if(!Array.isArray(obj))
    return;
  var i;
  for(i = 0; i < obj.length; i++) {
    var existingParameter = obj[i];
    var parameter = {};

    parameter.name = existingParameter.name;
    parameter.description = existingParameter.description;
    parameter.required = existingParameter.required;
    parameter.in = existingParameter.paramType;

    if(existingParameter.allowMultiple === true || existingParameter.allowMultiple === 'true') {
      var innerType = {};
      this.dataType(existingParameter, innerType);
      parameter.type = 'array';
      parameter.items = innerType;

      if(existingParameter.allowableValues) {
        var av = existingParameter.allowableValues;
        if(av.valueType === 'LIST') {
          parameter['enum'] = av.values;
        }
      }
    }
    else
      this.dataType(existingParameter, parameter);

    operation.parameters = operation.parameters || [];
    operation.parameters.push(parameter);
  }
};

SwaggerSpecConverter.prototype.dataType = function(source, target) {
  if(typeof source !== 'object')
    return;

  if(source.minimum)
    target.minimum = source.minimum;
  if(source.maximum)
    target.maximum = source.maximum;
  if(source.defaultValue)
    target.default = source.defaultValue;

  var jsonSchemaType = this.toJsonSchema(source);
  if(jsonSchemaType) {
    target = target || {};
    if(jsonSchemaType.type)
      target.type = jsonSchemaType.type;
    if(jsonSchemaType.format)
      target.format = jsonSchemaType.format;
    if(jsonSchemaType.$ref)
      target.schema = {$ref: jsonSchemaType.$ref};
    if(jsonSchemaType.items)
      target.items = jsonSchemaType.items;
  }
}

SwaggerSpecConverter.prototype.toJsonSchema = function(source) {
  if(!source)
    return 'object';
  var lcType = (source.type || source.dataType || "").toLowerCase();
  var format = (source.format || "").toLowerCase();

  if(lcType === 'int' || (lcType === 'integer' && format === 'int32'))
    return {type: 'integer', format: 'int32'};
  else if(lcType === 'long' || (lcType === 'integer' && format === 'int64'))
    return {type: 'integer', format: 'int64'};
  else if(lcType === 'integer')
    return {type: 'integer', format: 'int64'};
  else if(lcType === 'float' || (lcType === 'number' && format === 'float'))
    return {type: 'number', format: 'float'};
  else if(lcType === 'double' || (lcType === 'number' && format === 'double'))
    return {type: 'number', format: 'double'};
  else if((lcType === 'string' && format === 'date-time') || (lcType === 'date'))
    return {type: 'string', format: 'date-time'};
  else if(lcType === 'string')
    return {type: 'string'};
  else if(lcType === 'file')
    return {type: 'file'};
  else if(lcType === 'boolean')
    return {type: 'boolean'};
  else if(lcType === 'array' || lcType === 'list') {
    if(source.items) {
      var innerType = this.toJsonSchema(source.items);
      return {type: 'array', items: innerType};
    }
    else
      return {type: 'array', items: {type: 'object'}};
  }
  else if(source.$ref)
    return {$ref: '#/definitions/' + this.modelMap[source.$ref] || source.$ref};
  else
    return {$ref: '#/definitions/' + this.modelMap[source.type] || source.type};
}

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
      headers: {accept: 'application/json'},
      on: {},
      method: 'get'
    };
    http.on.response = function(data) {
      processedCount += 1;
      if(data.obj) {
        self.declaration(data.obj, swagger);
      }
      if(processedCount === expectedCount)
        self.finish(callback, swagger);
    };
    http.on.error = function(data) {
      processedCount += 1;
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