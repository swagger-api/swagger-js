// swagger.js
// version 2.0.19

var __bind = function(fn, me){
  return function(){
    return fn.apply(me, arguments);
  };
};

log = function(){
  log.history = log.history || [];
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};

sanitize = function(nickname) {
  var op;
  op = nickname.replace(/[\s!@#$%^&*()_+=\[{\]};:<>|./?,\\'""-]/g, '_');
  //'
  op = op.replace(/((_){2,})/g, '_');
  op = op.replace(/^(_)*/g, '');
  op = op.replace(/([_])*$/g, '');
  return op;
};

var SwaggerApi = function(url, options) {
  this.sanitize = sanitize;
  this.url = null;
  this.debug = false;
  this.basePath = null;
  this.authorizations = null;
  this.authorizationScheme = null;
  this.info = null;
  this.spec = null;

  if(typeof url === 'string') {
    this.url = url;
  }
  else if(typeof url === 'object') {
    options = url;
    this.url = options.url;
  }
  options = (options||{})

  if (options.success != null)
    this.success = options.success;

  this.failure = options.failure != null ? options.failure : function() {};
  this.progress = options.progress != null ? options.progress : function() {};
  var self = this;
  if (options.success != null)
    this.specFromURL(this.url, this.process);
}

// this will go away
SwaggerApi.prototype.build = function() {
  var self = this;
  if(this.spec == null) {
    this.progress('fetching resource list: ' + this.url);
    var obj = {
      useJQuery: this.useJQuery,
      url: this.url,
      method: "get",
      headers: {
        accept: "application/json"
      },
      on: {
        error: function(response) {
          if (self.url.substring(0, 4) !== 'http') {
            return self.fail('Please specify the protocol for ' + self.url);
          } else if (response.status === 0) {
            return self.fail('Can\'t read from server.  It may not have the appropriate access-control-origin settings.');
          } else if (response.status === 404) {
            return self.fail('Can\'t read swagger JSON from ' + self.url);
          } else {
            return self.fail(response.status + ' : ' + response.statusText + ' ' + self.url);
          }
        },
        response: function(resp) {
          var responseObj = resp.obj || JSON.parse(resp.data);
          self.swaggerVersion = responseObj.swaggerVersion;
          if (self.swaggerVersion === "1.2") {
            return self.buildFromSpec(responseObj);
          } else {
            return self.buildFrom1_1Spec(responseObj);
          }
        }
      }
    };
    var e = (typeof window !== 'undefined' ? window : exports);
    e.authorizations.apply(obj);
    new SwaggerHttp().execute(obj);
    return this;
  }
  else {
    // build from object
    if(!spec.swaggerVersion) {
      this.progress('invalid spec provided');
    }
    else {
      this.swaggerVersion = spec.swaggerVersion;
      if (this.swaggerVersion === "1.2") {
        return this.buildFromSpec(spec);
      } else {
        return this.buildFrom1_1Spec(spec);
      }
    }
  }
};

// passes a swagger spec object to the callback
SwaggerApi.prototype.specFromObject = function(obj, callback, error) {
  var self = this;
  if(callback)
    callback(obj, self);
}

// passes a swagger spec object to the callback
SwaggerApi.prototype.specFromURL = function(url, callback) {
  var self = this;
  var apis = [];
  var listing = function() {
    var obj = {
      useJQuery: self.useJQuery,
      url: self.url,
      method: "get",
      headers: {
        accept: "application/json"
      },
      on: {
        error: function(response) {
          return self.fail(response.status + ' : ' + response.statusText + ' ' + self.url);
        },
        response: function(resp) {
          var resourceListing = resp.obj || JSON.parse(resp.data);
          if (resourceListing.basePath) {
            self.basePath = resourceListing.basePath;
          } else if (self.url.indexOf('?') > 0) {
            self.basePath = self.url.substring(0, self.url.lastIndexOf('?'));
          } else {
            self.basePath = self.url;
          }
          if(resourceListing && resourceListing.apis) {
            resourceListing.apiDeclarations = [];
            var expectedCount = resourceListing.apis.length;
            var responses = 0;

            for(var i in resourceListing.apis) {
              var api = resourceListing.apis[i];
              var url = self.basePath + api.path;
              var description = api.description;
              obj = {
                url: url,
                method: "get",
                useJQuery: self.useJQuery,
                headers: {
                  accept: "application/json"
                },
                on: {
                  response: function(resp) {
                    var apiDeclaration = resp.obj || JSON.parse(resp.data);
                    responses += 1;
                    if(apiDeclaration) {
                      apiDeclaration.description = description;
                      resourceListing.apiDeclarations.push(apiDeclaration);
                    }

                    // all done, process callback
                    if(responses === expectedCount) {
                      delete resourceListing.apis;
                      callback(resourceListing, self);
                    }
                  },
                  error: function(response) {
                    return self.api.fail("Unable to read api '" +
                      self.name + "' from path " + self.url + " (server returned " + response.statusText + ")");
                  }
                }
              };
              var e = typeof window !== 'undefined' ? window : exports;
              e.authorizations.apply(obj);
              new SwaggerHttp().execute(obj);
            }
          }
        }
      }
    };
    var e = (typeof window !== 'undefined' ? window : exports);
    e.authorizations.apply(obj);
    new SwaggerHttp().execute(obj);
    return this;
  }.call();
}

SwaggerApi.prototype.process = function(spec, parent) {
  parent.apis = {};
  parent.apisArray = [];
  parent.produces = spec.produces;
  parent.consumes = spec.consumes;
  parent.authSchemes = spec.authorizations;
  parent.apiVersion = spec.apiVersion;
  parent.swaggerVersion = spec.swaggerVersion;

  if(spec.info)
    parent.info = spec.info;

  parent.basePath = spec.basePath;

  for(var i in spec.apiDeclarations) {
    var api = spec.apiDeclarations[i];
    var name = api.resourcePath.replace(/\//g, '');
    var resource = new SwaggerResource(null, parent, api);

    parent.apis[name] = resource;
    parent.apisArray.push(resource);    
  }
  parent.selfReflect();
  return parent;
}

SwaggerApi.prototype.buildFromSpec = function(response) {
  if (response.apiVersion != null) {
    this.apiVersion = response.apiVersion;
  }
  this.apis = {};
  this.apisArray = [];
  this.produces = response.produces;
  this.authSchemes = response.authorizations;
  if (response.info != null) {
    this.info = response.info;
  }
  var isApi = false;
  for (var i in response.apis) {
    var api = response.apis[i];
    if (api.operations) {
      for (var j in api.operations) {
        operation = api.operations[j];
        isApi = true;
      }
    }
  }
  if (response.basePath) {
    this.basePath = response.basePath;
  } else if (this.url.indexOf('?') > 0) {
    this.basePath = this.url.substring(0, this.url.lastIndexOf('?'));
  } else {
    this.basePath = this.url;
  }
  if (isApi) {
    var newName = response.resourcePath.replace(/\//g, '');
    this.resourcePath = response.resourcePath;
    res = new SwaggerResource(response, this);
    this.apis[newName] = res;
    this.apisArray.push(res);
  } else {
    for (var k = 0; k < response.apis.length; k++) {
      var resource = response.apis[k];
      res = new SwaggerResource(resource, this);
      this.apis[res.name] = res;
      this.apisArray.push(res);
    }
  }
  if (this.success) {
    this.success();
  }
  return this;
};

SwaggerApi.prototype.buildFrom1_1Spec = function(response) {
  log("This API is using a deprecated version of Swagger!  Please see http://github.com/wordnik/swagger-core/wiki for more info");
  if (response.apiVersion != null)
    this.apiVersion = response.apiVersion;
  this.apis = {};
  this.apisArray = [];
  this.produces = response.produces;
  if (response.info != null) {
    this.info = response.info;
  }
  var isApi = false;
  for (var i = 0; i < response.apis.length; i++) {
    var api = response.apis[i];
    if (api.operations) {
      for (var j = 0; j < api.operations.length; j++) {
        operation = api.operations[j];
        isApi = true;
      }
    }
  }
  if (response.basePath) {
    this.basePath = response.basePath;
  } else if (this.url.indexOf('?') > 0) {
    this.basePath = this.url.substring(0, this.url.lastIndexOf('?'));
  } else {
    this.basePath = this.url;
  }
  if (isApi) {
    var newName = response.resourcePath.replace(/\//g, '');
    this.resourcePath = response.resourcePath;
    var res = new SwaggerResource(response, this);
    this.apis[newName] = res;
    this.apisArray.push(res);
  } else {
    for (k = 0; k < response.apis.length; k++) {
      resource = response.apis[k];
      res = new SwaggerResource(resource, this);
      this.apis[res.name] = res;
      this.apisArray.push(res);
    }
  }
  if (this.success) {
    this.success();
  }
  return this;
};

SwaggerApi.prototype.selfReflect = function() {
  if (this.apis == null)
    return false;
  for (resource_name in this.apis) {
    var resource = this.apis[resource_name];
    if (resource.ready == null) {
      return false;
    }
  }
  this.setConsolidatedModels();
  this.ready = true;
  if (this.success != null) {
    return this.success();
  }
};

SwaggerApi.prototype.fail = function(message) {
  this.failure(message);
  throw message;
};

SwaggerApi.prototype.setConsolidatedModels = function() {
  this.modelsArray = [];
  this.models = {};
  for (var resource_name in this.apis) {
    var resource = this.apis[resource_name];
    for (var modelName in resource.models) {
      if (this.models[modelName] == null) {
        this.models[modelName] = resource.models[modelName];
        this.modelsArray.push(resource.models[modelName]);
      }
    }
  }
  var results = [];
  for (var i in this.modelsArray) {
    model = this.modelsArray[i];
    results.push(model.setReferencedModels(this.models));
  }
  return results;
};

SwaggerApi.prototype.help = function() {
  var operation, operation_name, parameter, resource, resource_name, _i, _len, _ref, _ref1, _ref2;
  _ref = this.apis;
  for (resource_name in _ref) {
    resource = _ref[resource_name];
    log(resource_name);
    _ref1 = resource.operations;
    for (operation_name in _ref1) {
      operation = _ref1[operation_name];
      log("  " + operation.nickname);
      _ref2 = operation.parameters;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        parameter = _ref2[_i];
        log("    " + parameter.name + (parameter.required ? ' (required)' : '') + " - " + parameter.description);
      }
    }
  }
  return this;
};

var SwaggerResource = function(resourceObj, api, obj) {
  var self = this;
  this.api = api;
  this.produces = [];
  this.consumes = [];
  this.operations = {};
  this.operationsArray = [];
  this.modelsArray = [];
  this.models = {};
  this.rawModels = {};

  if(obj) {
    this.name = obj.resourcePath;
    this.path = obj.resourcePath;
    this.description = (obj.description||"");
    return this.addApiDeclaration(obj);
  }
  else {
    this.path = this.api.resourcePath != null ? this.api.resourcePath : resourceObj.path;
    this.description = resourceObj.description;
    var parts = this.path.split("/");
    this.name = parts[parts.length - 1].replace('.{format}', '');
    this.basePath = this.api.basePath;
    this.useJQuery = (typeof api.useJQuery !== 'undefined' ? api.useJQuery : null);

    if (resourceObj && (resourceObj.apis != null) && (this.api.resourcePath != null)) {
      this.addApiDeclaration(resourceObj);
    } else {
      if (this.path == null) {
        this.api.fail("SwaggerResources must have a path.");
      }
      if (this.path.substring(0, 4) === 'http') {
        this.url = this.path.replace('{format}', 'json');
      } else {
        this.url = this.api.basePath + this.path.replace('{format}', 'json');
      }
      this.api.progress('fetching resource ' + this.name + ': ' + this.url);
      obj = {
        url: this.url,
        method: "get",
        useJQuery: this.useJQuery,
        headers: {
          accept: "application/json"
        },
        on: {
          response: function(resp) {
            var responseObj = resp.obj || JSON.parse(resp.data);
            return self.addApiDeclaration(responseObj);
          },
          error: function(response) {
            return self.api.fail("Unable to read api '" +
              self.name + "' from path " + self.url + " (server returned " + response.statusText + ")");
          }
        }
      };
      var e = typeof window !== 'undefined' ? window : exports;
      e.authorizations.apply(obj);
      new SwaggerHttp().execute(obj);
    }
  }
}

SwaggerResource.prototype.getAbsoluteBasePath = function(relativeBasePath) {
  var parts, pos, url;
  url = this.api.basePath;
  pos = url.lastIndexOf(relativeBasePath);
  if (pos === -1) {
    parts = url.split("/");
    url = parts[0] + "//" + parts[2];
    if (relativeBasePath.indexOf("/") === 0) {
      return url + relativeBasePath;
    } else {
      return url + "/" + relativeBasePath;
    }
  } else if (relativeBasePath === "/") {
    return url.substring(0, pos);
  } else {
    return url.substring(0, pos) + relativeBasePath;
  }
};

SwaggerResource.prototype.addApiDeclaration = function(obj) {
  if (obj.produces)
    this.produces = obj.produces;
  if (obj.consumes)
    this.consumes = obj.consumes;
  if ((obj.basePath != null) && obj.basePath.replace(/\s/g, '').length > 0)
    this.basePath = obj.basePath.indexOf("http") === -1 ? this.getAbsoluteBasePath(obj.basePath) : obj.basePath;

  this.addModels(obj.models);
  if (obj.apis) {
    for (var i in obj.apis) {
      var endpoint = obj.apis[i];
      this.addOperations(endpoint.path, endpoint.operations, obj.consumes, obj.produces);
    }
  }
  this.api[sanitize(this.name)] = this;
  this.ready = true;
  return this.api.selfReflect();
};

SwaggerResource.prototype.addModels = function(models) {
  if (models) {
    for (modelName in models) {
      if (this.models[modelName] == null) {
        var swaggerModel = new SwaggerModel(modelName, models[modelName]);
        this.modelsArray.push(swaggerModel);
        this.models[modelName] = swaggerModel;
        this.rawModels[modelName] = models[modelName];
      }
    }
    var output = [];
    for (var i in this.modelsArray) {
      model = this.modelsArray[i];
      output.push(model.setReferencedModels(this.models));
    }
    return output;
  }
};

SwaggerResource.prototype.addOperations = function(resourcePath, operations, consumes, produces) {
  if (operations) {
    output = [];
    for (var i in operations) {
      o = operations[i];
      consumes = this.consumes;
      produces = this.produces;
      if (o.consumes != null)
        consumes = o.consumes;
      else
        consumes = this.consumes;

      if (o.produces != null)
        produces = o.produces;
      else
        produces = this.produces;
      type = (o.type||o.responseClass);

      if (type === "array") {
        ref = null;
        if (o.items)
          ref = o.items["type"] || o.items["$ref"];
        type = "array[" + ref + "]";
      }
      responseMessages = o.responseMessages;
      method = o.method;
      if (o.httpMethod) {
        method = o.httpMethod;
      }
      if (o.supportedContentTypes) {
        consumes = o.supportedContentTypes;
      }
      if (o.errorResponses) {
        responseMessages = o.errorResponses;
        for (var j = 0; j < responseMessages.length; j++) {
          r = responseMessages[j];
          r.message = r.reason;
          r.reason = null;
        }
      }
      o.nickname = sanitize(o.nickname);

      op = new SwaggerOperation({
        path: resourcePath,
        nickname: o.nickname,
        method: method,
        parameters: o.parameters,
        summary: o.summary,
        notes: o.notes,
        type: type,
        responseMessages: responseMessages, 
        resource: this,
        consumes: consumes, 
        produces: produces, 
        authorizations: o.authorizations
      })
      this.operations[op.nickname] = op;
      output.push(this.operationsArray.push(op));
    }
    return output;
  }
};

SwaggerResource.prototype.help = function() {
  var op = this.operations;
  var output = [];
  for (operation_name in op) {
    operation = op[operation_name];
    var msg = "  " + operation.nickname;
    for (var i = 0; i < operation.parameters; i++) {
      parameter = operation.parameters[i];
      msg.concat("    " + parameter.name + (parameter.required ? ' (required)' : '') + " - " + parameter.description);
    }
    output.push(msg);
  }
  return output;
};

var SwaggerModel = function(modelName, obj) {
  this.name = obj.id != null ? obj.id : modelName;
  this.properties = [];
  for (propertyName in obj.properties) {
    if (obj.required != null) {
      for (value in obj.required) {
        if (propertyName === obj.required[value]) {
          obj.properties[propertyName].required = true;
        }
      }
    }
    prop = new SwaggerModelProperty(propertyName, obj.properties[propertyName]);
    this.properties.push(prop);
  }
}

SwaggerModel.prototype.setReferencedModels = function(allModels) {
  var results = [];
  for (var i in this.properties) {
    var property = this.properties[i];
    var type = property.type || property.dataType;
    if (allModels[type] != null)
      results.push(property.refModel = allModels[type]);
    else if ((property.refDataType != null) && (allModels[property.refDataType] != null))
      results.push(property.refModel = allModels[property.refDataType]);
    else
      results.push(void 0);
  }
  return results;
};

SwaggerModel.prototype.getMockSignature = function(modelsToIgnore) {
  var propertiesStr = [];
  for (var i in this.properties) {
    prop = this.properties[i];
    propertiesStr.push(prop.toString());
  }

  var strong = '<span class="strong">';
  var stronger = '<span class="stronger">';
  var strongClose = '</span>';
  var classOpen = strong + this.name + ' {' + strongClose;
  var classClose = strong + '}' + strongClose;
  var returnVal = classOpen + '<div>' + propertiesStr.join(',</div><div>') + '</div>' + classClose;
  if (!modelsToIgnore)
    modelsToIgnore = [];
  modelsToIgnore.push(this.name);

  for (var i in this.properties) {
    prop = this.properties[i];
    if ((prop.refModel != null) && modelsToIgnore.indexOf(prop.refModel.name) === -1) {
      returnVal = returnVal + ('<br>' + prop.refModel.getMockSignature(modelsToIgnore));
    }
  }
  return returnVal;
};

SwaggerModel.prototype.createJSONSample = function(modelsToIgnore) {
  var result = {};
  var modelsToIgnore = (modelsToIgnore||[])
  modelsToIgnore.push(this.name);
  for (var i in this.properties) {
    prop = this.properties[i];
    result[prop.name] = prop.getSampleValue(modelsToIgnore);
  }
  modelsToIgnore.pop(this.name);
  return result;
};

var SwaggerModelProperty = function(name, obj) {
  this.name = name;
  this.dataType = obj.type || obj.dataType || obj["$ref"];
  this.isCollection = this.dataType && (this.dataType.toLowerCase() === 'array' || this.dataType.toLowerCase() === 'list' || this.dataType.toLowerCase() === 'set');
  this.descr = obj.description;
  this.required = obj.required;
  if (obj.items != null) {
    if (obj.items.type != null) {
      this.refDataType = obj.items.type;
    }
    if (obj.items.$ref != null) {
      this.refDataType = obj.items.$ref;
    }
  }
  this.dataTypeWithRef = this.refDataType != null ? (this.dataType + '[' + this.refDataType + ']') : this.dataType;
  if (obj.allowableValues != null) {
    this.valueType = obj.allowableValues.valueType;
    this.values = obj.allowableValues.values;
    if (this.values != null) {
      this.valuesString = "'" + this.values.join("' or '") + "'";
    }
  }
  if (obj["enum"] != null) {
    this.valueType = "string";
    this.values = obj["enum"];
    if (this.values != null) {
      this.valueString = "'" + this.values.join("' or '") + "'";
    }
  }
}

SwaggerModelProperty.prototype.getSampleValue = function(modelsToIgnore) {
  var result;
  if ((this.refModel != null) && (modelsToIgnore.indexOf(prop.refModel.name) === -1)) {
    result = this.refModel.createJSONSample(modelsToIgnore);
  } else {
    if (this.isCollection) {
      result = this.toSampleValue(this.refDataType);
    } else {
      result = this.toSampleValue(this.dataType);
    }
  }
  if (this.isCollection) {
    return [result];
  } else {
    return result;
  }
};

SwaggerModelProperty.prototype.toSampleValue = function(value) {
  var result;
  if (value === "integer") {
    result = 0;
  } else if (value === "boolean") {
    result = false;
  } else if (value === "double" || value === "number") {
    result = 0.0;
  } else if (value === "string") {
    result = "";
  } else {
    result = value;
  }
  return result;
};

SwaggerModelProperty.prototype.toString = function() {
  var req = this.required ? 'propReq' : 'propOpt';
  var str = '<span class="propName ' + req + '">' + this.name + '</span> (<span class="propType">' + this.dataTypeWithRef + '</span>';
  if (!this.required) {
    str += ', <span class="propOptKey">optional</span>';
  }
  str += ')';
  if (this.values != null) {
    str += " = <span class='propVals'>['" + this.values.join("' or '") + "']</span>";
  }
  if (this.descr != null) {
    str += ': <span class="propDesc">' + this.descr + '</span>';
  }
  return str;
};

var SwaggerOperation = function(opts) {
  var self = this;

  var errors = [];
  this.nickname = (opts.nickname||errors.push("SwaggerOperations must have a nickname."));
  this.path = (opts.path||errors.push("SwaggerOperation " + this.nickname + " is missing path."));
  this.method = (opts.method||errors.push("SwaggerOperation " + this.nickname + " is missing method."));
  this.parameters = (opts.parameters || []);
  this.summary = opts.summary;
  this.notes = opts.notes;
  this.type = opts.type;
  this.responseMessages = (opts.responseMessages||[]);
  this.resource = (opts.resource||errors.push("Resource is required"));
  this.consumes = opts.consumes;
  this.produces = opts.produces;
  this.authorizations = opts.authorizations;
  this["do"] = __bind(this["do"], this);

  if (errors.length > 0)
    this.resource.api.fail(errors);

  this.path = this.path.replace('{format}', 'json');
  this.method = this.method.toLowerCase();
  this.isGetMethod = this.method === "get";

  this.resourceName = this.resource.name;
  if(typeof this.type !== 'undefined' && this.type === 'void')
    this.type = null;
  else {
    this.responseClassSignature = this.getSignature(this.type, this.resource.models);
    this.responseSampleJSON = this.getSampleJSON(this.type, this.resource.models);
  }

  for(var i = 0; i < this.parameters.length; i ++) {
    var param = this.parameters[i];
    // might take this away
    param.name = param.name || param.type || param.dataType;

    // for 1.1 compatibility
    var type = param.type || param.dataType;
    if(type === 'array') {
      type = 'array[' + (param.items.$ref ? param.items.$ref : param.items.type) + ']';
    }

    if(type.toLowerCase() === 'boolean') {
      param.allowableValues = {};
      param.allowableValues.values = ["true", "false"];
    }
    param.signature = this.getSignature(type, this.resource.models);
    param.sampleJSON = this.getSampleJSON(type, this.resource.models);

    var enumValue = param["enum"];
    if(enumValue != null) {
      param.isList = true;
      param.allowableValues = {};
      param.allowableValues.descriptiveValues = [];

      for(var j = 0; j < enumValue.length; j++) {
        var v = enumValue[j];
        if(param.defaultValue != null) {
          param.allowableValues.descriptiveValues.push ({
            value: String(v),
            isDefault: (v === param.defaultValue)
          });
        }
        else {
          param.allowableValues.descriptiveValues.push ({
            value: String(v),
            isDefault: false
          });
        }
      }
    }
    else if(param.allowableValues != null) {
      if(param.allowableValues.valueType === "RANGE")
        param.isRange = true;
      else
        param.isList = true;
      if(param.allowableValues != null) {
        param.allowableValues.descriptiveValues = [];
        if(param.allowableValues.values) {
          for(var j = 0; j < param.allowableValues.values.length; j++){
            var v = param.allowableValues.values[j];
            if(param.defaultValue != null) {
              param.allowableValues.descriptiveValues.push ({
                value: String(v),
                isDefault: (v === param.defaultValue)
              });
            }
            else {
              param.allowableValues.descriptiveValues.push ({
                value: String(v),
                isDefault: false
              });
            }
          }
        }
      }
    }
  }
  this.resource[this.nickname] = function(args, callback, error) {
    return self["do"](args, callback, error);
  };
  this.resource[this.nickname].help = function() {
    return self.help();
  };
}

SwaggerOperation.prototype.isListType = function(type) {
  if (type && type.indexOf('[') >= 0) {
    return type.substring(type.indexOf('[') + 1, type.indexOf(']'));
  } else {
    return void 0;
  }
};

SwaggerOperation.prototype.getSignature = function(type, models) {
  var listType = this.isListType(type);
  var isPrimitive = ((listType != null) && models[listType]) || (models[type] != null) ? false : true;
  if (isPrimitive) {
    return type;
  } else {
    if (listType != null) {
      return models[listType].getMockSignature();
    } else {
      return models[type].getMockSignature();
    }
  }
};

SwaggerOperation.prototype.getSampleJSON = function(type, models) {
  var isPrimitive, listType, val;
  listType = this.isListType(type);
  isPrimitive = ((listType != null) && models[listType]) || (models[type] != null) ? false : true;
  val = isPrimitive ? void 0 : (listType != null ? models[listType].createJSONSample() : models[type].createJSONSample());
  if (val) {
    val = listType ? [val] : val;
    return JSON.stringify(val, null, 2);
  }
};

SwaggerOperation.prototype["do"] = function(args, opts, callback, error) {
  var key, param, params, possibleParams, req, requestContentType, responseContentType, value, _i, _len, _ref;
  if (args == null) {
    args = {};
  }
  if (opts == null) {
    opts = {};
  }
  requestContentType = null;
  responseContentType = null;
  if ((typeof args) === "function") {
    error = opts;
    callback = args;
    args = {};
  }
  if ((typeof opts) === "function") {
    error = callback;
    callback = opts;
  }
  if (error == null) {
    error = function(xhr, textStatus, error) {
      return log(xhr, textStatus, error);
    };
  }
  if (callback == null) {
    callback = function(response) {
      var content;
      content = null;
      if (response != null) {
        content = response.data;
      } else {
        content = "no data";
      }
      return log("default callback: " + content);
    };
  }
  params = {};
  params.headers = [];
  if (args.headers != null) {
    params.headers = args.headers;
    delete args.headers;
  }

  var possibleParams = [];
  for(var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    if(param.paramType === 'header') {
      if(args[param.name])
        params.headers[param.name] = args[param.name];
    }
    else if(param.paramType === 'form' || param.paramType.toLowerCase() === 'file')
      possibleParams.push(param);
  }

  if (args.body != null) {
    params.body = args.body;
    delete args.body;
  }

  if (possibleParams) {
    for (key in possibleParams) {
      value = possibleParams[key];
      if (args[value.name]) {
        params[value.name] = args[value.name];
      }
    }
  }

  req = new SwaggerRequest(this.method, this.urlify(args), params, opts, callback, error, this);
  if (opts.mock != null) {
    return req;
  } else {
    return true;
  }
};

SwaggerOperation.prototype.pathJson = function() {
  return this.path.replace("{format}", "json");
};

SwaggerOperation.prototype.pathXml = function() {
  return this.path.replace("{format}", "xml");
};

SwaggerOperation.prototype.urlify = function(args) {
  var url = this.resource.basePath + this.pathJson();
  var params = this.parameters;
  for(var i = 0; i < params.length; i ++){
    var param = params[i];
    if (param.paramType === 'path') {
      if(args[param.name]) {
        // apply path params and remove from args
        var reg = new RegExp('\{' + param.name + '[^\}]*\}', 'gi');
        url = url.replace(reg, encodeURIComponent(args[param.name]));
        delete args[param.name];
      }
      else
        throw "" + param.name + " is a required path param.";
    }
  }

  var queryParams = "";
  for(var i = 0; i < params.length; i ++){
    var param = params[i];
    if(param.paramType === 'query') {
      if(queryParams !== '')
        queryParams += "&";
      if(args[param.name] !== undefined)
        queryParams += encodeURIComponent(param.name) + '=' + encodeURIComponent(args[param.name]);
    }
  }
  if ((queryParams != null) && queryParams.length > 0)
    url += '?' + queryParams;
  return url;
};

SwaggerOperation.prototype.supportHeaderParams = function() {
  return this.resource.api.supportHeaderParams;
};

SwaggerOperation.prototype.supportedSubmitMethods = function() {
  return this.resource.api.supportedSubmitMethods;
};

SwaggerOperation.prototype.getQueryParams = function(args) {
  return this.getMatchingParams(['query'], args);
};

SwaggerOperation.prototype.getHeaderParams = function(args) {
  return this.getMatchingParams(['header'], args);
};

SwaggerOperation.prototype.getMatchingParams = function(paramTypes, args) {
  var matchingParams = {};
  var params = this.parameters;
  for (var i = 0; i < params.length; i++) {
    param = params[i];
    if (args && args[param.name])
      matchingParams[param.name] = args[param.name];
  }
  var headers = this.resource.api.headers;
  for (name in headers) {
    var value = headers[name];
    matchingParams[name] = value;
  }
  return matchingParams;
};

SwaggerOperation.prototype.help = function() {
  var msg = "";
  var params = this.parameters;
  for (var i = 0; i < params.length; i++) {
    var param = params[i];
    if (msg !== "")
      msg += "\n";
    msg += "* " + param.name + (param.required ? ' (required)' : '') + " - " + param.description;
  }
  return msg;
};

var SwaggerRequest = function(type, url, params, opts, successCallback, errorCallback, operation, execution) {
  var self = this;
  var errors = [];
  this.useJQuery = (typeof operation.useJQuery !== 'undefined' ? operation.useJQuery : null);
  this.type = (type||errors.push("SwaggerRequest type is required (get/post/put/delete/patch/options)."));
  this.url = (url||errors.push("SwaggerRequest url is required."));
  this.params = params;
  this.opts = opts;
  this.successCallback = (successCallback||errors.push("SwaggerRequest successCallback is required."));
  this.errorCallback = (errorCallback||errors.push("SwaggerRequest error callback is required."));
  this.operation = (operation||errors.push("SwaggerRequest operation is required."));
  this.execution = execution;
  this.headers = (params.headers||{});

  if(errors.length > 0) {
    throw errors;
  }

  this.type = this.type.toUpperCase();

  var myHeaders = {};
  var body = params.body;
  var parent = params["parent"];
  var requestContentType = "application/json";

  var formParams = [];
  var fileParams = [];
  var params = this.operation.parameters;


  for(var i = 0; i < params.length; i++) {
    var param = params[i];
    if(param.paramType === "form")
      formParams.push(param);
    else if(param.paramType === "file")
      fileParams.push(param);
  }


  if (body && (this.type === "POST" || this.type === "PUT" || this.type === "PATCH")) {
    if (this.opts.requestContentType) {
      requestContentType = this.opts.requestContentType;
    }
  } else {
    // if any form params, content type must be set
    if(formParams.length > 0) {
      if(fileParams.length > 0)
        requestContentType = "multipart/form-data";
      else
        requestContentType = "application/x-www-form-urlencoded";
    }
    else if (this.type != "DELETE")
      requestContentType = null;
  }

  if (requestContentType && this.operation.consumes) {
    if (this.operation.consumes[requestContentType] === 'undefined') {
      log("server doesn't consume " + requestContentType + ", try " + JSON.stringify(this.operation.consumes));
      if (this.requestContentType === null) {
        requestContentType = this.operation.consumes[0];
      }
    }
  }

  responseContentType = null;
  if (this.opts.responseContentType) {
    responseContentType = this.opts.responseContentType;
  } else {
    responseContentType = "application/json";
  }
  if (responseContentType && this.operation.produces) {
    if (this.operation.produces[responseContentType] === 'undefined') {
      log("server can't produce " + responseContentType);
    }
  }
  if (requestContentType && requestContentType.indexOf("application/x-www-form-urlencoded") === 0) {
    var fields = {};
    var possibleParams = {};
    var values = {};

    for(var i = 0; i < formParams.length; i++){
      var param = formParams[i];
      values[param.name] = param;
    }

    var encoded = "";
    for(key in values) {
      value = this.params[key];
      if(encoded !== "")
        encoded += "&";
      encoded += encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }
    body = encoded
  }
  for (name in this.headers)
    myHeaders[name] = this.headers[name];
  if (requestContentType && body)
    myHeaders["Content-Type"] = requestContentType;
  if (responseContentType)
    myHeaders["Accept"] = responseContentType;

  if (!((this.headers != null) && (this.headers.mock != null))) {
    obj = {
      url: this.url,
      method: this.type,
      headers: myHeaders,
      body: body,
      useJQuery: this.useJQuery,
      on: {
        error: function(response) {
          return self.errorCallback(response, self.opts.parent);
        },
        redirect: function(response) {
          return self.successCallback(response, self.opts.parent);
        },
        307: function(response) {
          return self.successCallback(response, self.opts.parent);
        },
        response: function(response) {
          return self.successCallback(response, self.opts.parent);
        }
      }
    };
    var e;
    if (typeof window !== 'undefined') {
      e = window;
    } else {
      e = exports;
    }
    status = e.authorizations.apply(obj, this.operation.authorizations);
    if (opts.mock == null) {
      if (status !== false) {
        new SwaggerHttp().execute(obj);
      } else {
        obj.canceled = true;
      }
    } else {
      return obj;
    }
  }
};

SwaggerRequest.prototype.asCurl = function() {
  var results = [];
  if(this.headers) {
    for(key in this.headers) {
      results.push("--header \"" + key + ": " + this.headers[v] + "\"");
    }
  }
  return "curl " + (results.join(" ")) + " " + this.url;
};

/**
 * SwaggerHttp is a wrapper for executing requests
 */
var SwaggerHttp = function() {};

SwaggerHttp.prototype.execute = function(obj) {
  if(obj && (typeof obj.useJQuery === 'boolean'))
    this.useJQuery = obj.useJQuery;
  else
    this.useJQuery = this.isIE8();

  if(this.useJQuery)
    return new JQueryHttpClient().execute(obj);
  else
    return new ShredHttpClient().execute(obj);
}

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
 * JQueryHttpClient lets a browser take advantage of JQuery's cross-browser magic
 */
var JQueryHttpClient = function(options) {}

JQueryHttpClient.prototype.execute = function(obj) {
  var cb = obj.on;
  var request = obj;

  obj.type = obj.method;
  obj.cache = false;

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
  };

  obj.data = obj.body;
  obj.complete = function(response, textStatus, opts) {
    headers = {};
    headerArray = response.getAllResponseHeaders().split(":");

    for(var i = 0; i < headerArray.length / 2; i++)
      headers[headerArray[i] = headerArray[i+1]];

    out = {
      headers: headers,
      url: request.url,
      method: request.method,
      status: response.status,
      data: response.responseText,
      headers: headers
    };

    var contentType = (response._headers["content-type"]||response._headers["Content-Type"]||null)

    if(contentType != null) {
      if(contentType.indexOf("application/json") == 0 || contentType.indexOf("+json") > 0) {
        if(response.responseText && response.responseText !== "")
          out.obj = JSON.parse(response.responseText);
        else
          out.obj = {}
      }
    }

    if(response.status >= 200 && response.status < 300)
      cb.response(out);
    else if(response.status === 0 || (response.status >= 400 && response.status < 599))
      cb.error(out);
    else
      return cb.response(out);
  };

  $.support.cors = true;
  return $.ajax(obj);
}

/*
 * ShredHttpClient is a light-weight, node or browser HTTP client
 */
var ShredHttpClient = function(options) {
  this.options = (options||{});
  this.isInitialized = false;

  var identity, toString;

  if (typeof window !== 'undefined') {
    this.Shred = require("./shred");
    this.content = require("./shred/content");
  }
  else
    this.Shred = require("shred");
  this.shred = new this.Shred();
}

ShredHttpClient.prototype.initShred = function () {
  this.isInitialized = true;
  this.registerProcessors(this.shred);
}

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
}

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

    var contentType = (response._headers["content-type"]||response._headers["Content-Type"]||null)

    if(contentType != null) {
      if(contentType.indexOf("application/json") == 0 || contentType.indexOf("+json") > 0) {
        if(response.content.data && response.content.data !== "")
          out.obj = JSON.parse(response.content.data);
        else
          out.obj = {}
      }
    }
    return out;
  };

  res = {
    error: function(response) {
      if (obj)
        return cb.error(transform(response));
    },
    redirect: function(response) {
      if (obj)
        return cb.redirect(transform(response));
    },
    307: function(response) {
      if (obj)
        return cb.redirect(transform(response));
    },
    response: function(response) {
      if (obj)
        return cb.response(transform(response));
    }
  };
  if (obj) {
    obj.on = res;
  }
  return this.shred.request(obj);
};

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

SwaggerAuthorizations.prototype.apply = function(obj, authorizations) {
  status = null;
  for (key in this.authz) {
    value = this.authz[key];
    result = value.apply(obj, authorizations);
    if (result === false)
      status = false;
    if (result === true)
      status = true;
  }
  return status;
};

/**
 * ApiKeyAuthorization allows a query param or header to be injected
 */
var ApiKeyAuthorization = function(name, value, type) {
  this.name = name;
  this.value = value;
  this.type = type;
};

ApiKeyAuthorization.prototype.apply = function(obj, authorizations) {
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

PasswordAuthorization.prototype.apply = function(obj, authorizations) {
  obj.headers["Authorization"] = "Basic " + this._btoa(this.username + ":" + this.password);
  return true;
};

var e = (typeof window !== 'undefined' ? window : exports);

e.SwaggerHttp = SwaggerHttp;
e.SwaggerRequest = SwaggerRequest;
e.authorizations = new SwaggerAuthorizations();
e.ApiKeyAuthorization = ApiKeyAuthorization;
e.PasswordAuthorization = PasswordAuthorization;
e.JQueryHttpClient = JQueryHttpClient;
e.ShredHttpClient = ShredHttpClient;
e.SwaggerOperation = SwaggerOperation;
e.SwaggerModel = SwaggerModel;
e.SwaggerModelProperty = SwaggerModelProperty;
e.SwaggerResource = SwaggerResource;
e.SwaggerApi = SwaggerApi;
