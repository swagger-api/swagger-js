var addModel = function(name, model) {
  models[name] = model;
};

var SwaggerClient = function(url, options) {
  this.isBuilt = false;
  this.url = null;
  this.debug = false;
  this.basePath = null;
  this.modelsArray = [];
  this.authorizations = null;
  this.authorizationScheme = null;
  this.isValid = false;
  this.info = null;
  this.useJQuery = false;
  this.resourceCount = 0;

  if(typeof url !== 'undefined')
    return this.initialize(url, options);
};

SwaggerClient.prototype.initialize = function (url, options) {
  this.models = models = {};

  options = (options||{});

  if(typeof url === 'string')
    this.url = url;
  else if(typeof url === 'object') {
    options = url;
    this.url = options.url;
  }
  this.swaggerRequstHeaders = options.swaggerRequstHeaders || 'application/json;charset=utf-8,*/*';
  this.defaultSuccessCallback = options.defaultSuccessCallback || null;
  this.defaultErrorCallback = options.defaultErrorCallback || null;

  if (typeof options.success === 'function')
    this.success = options.success;

  if (options.useJQuery)
    this.useJQuery = options.useJQuery;

  if (options.authorizations) {
    this.clientAuthorizations = options.authorizations;
  } else {
    this.clientAuthorizations = authorizations;
  }

  this.supportedSubmitMethods = options.supportedSubmitMethods || [];
  this.failure = options.failure || function() {};
  this.progress = options.progress || function() {};
  this.spec = options.spec;
  this.options = options;

  if (typeof options.success === 'function') {
    this.ready = true;
    this.build();
  }
};

SwaggerClient.prototype.build = function(mock) {
  if (this.isBuilt) return this;
  var self = this;
  this.progress('fetching resource list: ' + this.url);
  var obj = {
    useJQuery: this.useJQuery,
    url: this.url,
    method: "get",
    headers: {
      accept: this.swaggerRequstHeaders
    },
    on: {
      error: function(response) {
        if (self.url.substring(0, 4) !== 'http')
          return self.fail('Please specify the protocol for ' + self.url);
        else if (response.status === 0)
          return self.fail('Can\'t read from server.  It may not have the appropriate access-control-origin settings.');
        else if (response.status === 404)
          return self.fail('Can\'t read swagger JSON from ' + self.url);
        else
          return self.fail(response.status + ' : ' + response.statusText + ' ' + self.url);
      },
      response: function(resp) {
        var responseObj = resp.obj || JSON.parse(resp.data);
        self.swaggerVersion = responseObj.swaggerVersion;

        if(responseObj.swagger && parseInt(responseObj.swagger) === 2) {
          self.swaggerVersion = responseObj.swagger;
          new Resolver().resolve(responseObj, self.buildFromSpec, self);
          self.isValid = true;
        }
        else {
          if (self.swaggerVersion === '1.2') {
            return self.buildFrom1_2Spec(responseObj);
          } else {
            return self.buildFrom1_1Spec(responseObj);
          }
        }
      }
    }
  };
  if(this.spec) {
    setTimeout(function() {
      new Resolver().resolve(self.spec, self.buildFromSpec, self);
   }, 10);
  }
  else {
    authorizations.apply(obj);
    if(mock)
      return obj;
    new SwaggerHttp().execute(obj);
  }
  return this;
};

SwaggerClient.prototype.buildFromSpec = function(response) {
  if(this.isBuilt) return this;

  this.info = response.info || {};
  this.title = response.title || '';
  this.host = response.host || '';
  this.schemes = response.schemes || [];
  this.basePath = response.basePath || '';
  this.apis = {};
  this.apisArray = [];
  this.consumes = response.consumes;
  this.produces = response.produces;
  this.securityDefinitions = response.securityDefinitions;

  // legacy support
  this.authSchemes = response.securityDefinitions;

  var definedTags = {};
  if(Array.isArray(response.tags)) {
    definedTags = {};
    for(k = 0; k < response.tags.length; k++) {
      var t = response.tags[k];
      definedTags[t.name] = t;
    }
  }

  var location;
  if(typeof this.url === 'string') {
    location = this.parseUri(this.url);
  }

  if(typeof this.schemes === 'undefined' || this.schemes.length === 0) {
    this.scheme = location.scheme || 'http';
  }
  else {
    this.scheme = this.schemes[0];
  }

  if(typeof this.host === 'undefined' || this.host === '') {
    this.host = location.host;
    if (location.port) {
      this.host = this.host + ':' + location.port;
    }
  }

  this.definitions = response.definitions;
  var key;
  for(key in this.definitions) {
    var model = new Model(key, this.definitions[key]);
    if(model) {
      models[key] = model;
    }
  }

  // get paths, create functions for each operationId
  var path;
  var operations = [];
  for(path in response.paths) {
    if(typeof response.paths[path] === 'object') {
      var httpMethod;
      for(httpMethod in response.paths[path]) {
        if(['delete', 'get', 'head', 'options', 'patch', 'post', 'put'].indexOf(httpMethod) === -1) {
          continue;
        }
        var operation = response.paths[path][httpMethod];
        var tags = operation.tags;
        if(typeof tags === 'undefined') {
          operation.tags = [ 'default' ];
          tags = operation.tags;
        }
        var operationId = this.idFromOp(path, httpMethod, operation);
        var operationObject = new Operation (
          this,
          operation.scheme,
          operationId,
          httpMethod,
          path,
          operation,
          this.definitions
        );
        // bind this operation's execute command to the api
        if(tags.length > 0) {
          var i;
          for(i = 0; i < tags.length; i++) {
            var tag = this.tagFromLabel(tags[i]);
            var operationGroup = this[tag];
            if(typeof this.apis[tag] === 'undefined')
              this.apis[tag] = {};
            if(typeof operationGroup === 'undefined') {
              this[tag] = [];
              operationGroup = this[tag];
              operationGroup.operations = {};
              operationGroup.label = tag;
              operationGroup.apis = [];
              var tagObject = definedTags[tag];
              if(typeof tagObject === 'object') {
                operationGroup.description = tagObject.description;
                operationGroup.externalDocs = tagObject.externalDocs;
              }
              this[tag].help = this.help.bind(operationGroup);
              this.apisArray.push(new OperationGroup(tag, operationGroup.description, operationGroup.externalDocs, operationObject));
            }
            if(typeof this.apis[tag].help !== 'function')
              this.apis[tag].help = this.help.bind(operationGroup);
            // bind to the apis object
            this.apis[tag][operationId] = operationObject.execute.bind(operationObject);
            this.apis[tag][operationId].help = operationObject.help.bind(operationObject);
            this.apis[tag][operationId].asCurl = operationObject.asCurl.bind(operationObject);
            operationGroup[operationId] = operationObject.execute.bind(operationObject);
            operationGroup[operationId].help = operationObject.help.bind(operationObject);
            operationGroup[operationId].asCurl = operationObject.asCurl.bind(operationObject);

            operationGroup.apis.push(operationObject);
            operationGroup.operations[operationId] = operationObject;

            // legacy UI feature
            var j;
            var api;
            for(j = 0; j < this.apisArray.length; j++) {
              if(this.apisArray[j].tag === tag) {
                api = this.apisArray[j];
              }
            }
            if(api) {
              api.operationsArray.push(operationObject);
            }
          }
        }
        else {
          log('no group to bind to');
        }
      }
    }
  }
  this.isBuilt = true;
  if (this.success) {
    this.isValid = true;
    this.isBuilt = true;
    this.success();
  }
  return this;
};

SwaggerClient.prototype.parseUri = function(uri) {
  var urlParseRE = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;
  var parts = urlParseRE.exec(uri);
  return {
    scheme: parts[4].replace(':',''),
    host: parts[11],
    port: parts[12],
    path: parts[15]
  };
};

SwaggerClient.prototype.help = function(dontPrint) {
  var i;
  var output = 'operations for the "' + this.label + '" tag';
  for(i = 0; i < this.apis.length; i++) {
    var api = this.apis[i];
    output += '\n  * ' + api.nickname + ': ' + api.operation.summary;
  }
  if(dontPrint)
    return output;
  else {
    log(output);
    return output;
  }
};

SwaggerClient.prototype.tagFromLabel = function(label) {
  return label;
};

SwaggerClient.prototype.idFromOp = function(path, httpMethod, op) {
  var opId = op.operationId || (path.substring(1) + '_' + httpMethod);
  return opId.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()\+\s]/g,'_');
};

SwaggerClient.prototype.fail = function(message) {
  this.failure(message);
  throw message;
};

var OperationGroup = function(tag, description, externalDocs, operation) {
  this.tag = tag;
  this.path = tag;
  this.description = description;
  this.externalDocs = externalDocs;
  this.name = tag;
  this.operation = operation;
  this.operationsArray = [];
};

var Operation = function(parent, scheme, operationId, httpMethod, path, args, definitions) {
  var errors = [];
  parent = parent||{};
  args = args||{};

  this.operations = {};
  this.operation = args;
  this.deprecated = args.deprecated;
  this.consumes = args.consumes;
  this.produces = args.produces;
  this.parent = parent;
  this.host = parent.host || 'localhost';
  this.schemes = parent.schemes;
  this.scheme = scheme || parent.scheme || 'http';
  this.basePath = parent.basePath || '/';
  this.nickname = (operationId||errors.push('Operations must have a nickname.'));
  this.method = (httpMethod||errors.push('Operation ' + operationId + ' is missing method.'));
  this.path = (path||errors.push('Operation ' + this.nickname + ' is missing path.'));
  this.parameters = args !== null ? (args.parameters||[]) : {};
  this.summary = args.summary || '';
  this.responses = (args.responses||{});
  this.type = null;
  this.security = args.security;
  this.authorizations = args.security;
  this.description = args.description;
  this.useJQuery = parent.useJQuery;

  if(typeof this.deprecated === 'string') {
    switch(this.deprecated.toLowerCase()) {
      case 'true': case 'yes': case '1': {
        this.deprecated = true;
        break;
      }
      case 'false': case 'no': case '0': case null: {
        this.deprecated = false;
        break;
      }
      default: this.deprecated = Boolean(this.deprecated);
    }
  }

  var i, model;

  if(definitions) {
    // add to global models
    var key;
    for(key in this.definitions) {
      model = new Model(key, definitions[key]);
      if(model) {
        models[key] = model;
      }
    }
  }
  for(i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    if(param.type === 'array') {
      param.isList = true;
      param.allowMultiple = true;
    }
    var innerType = this.getType(param);
    if(innerType && innerType.toString().toLowerCase() === 'boolean') {
      param.allowableValues = {};
      param.isList = true;
      param['enum'] = ["true", "false"];
    }
    if(typeof param['enum'] !== 'undefined') {
      var id;
      param.allowableValues = {};
      param.allowableValues.values = [];
      param.allowableValues.descriptiveValues = [];
      for(id = 0; id < param['enum'].length; id++) {
        var value = param['enum'][id];
        var isDefault = (value === param.default) ? true : false;
        param.allowableValues.values.push(value);
        param.allowableValues.descriptiveValues.push({value : value, isDefault: isDefault});
      }
    }
    if(param.type === 'array') {
      innerType = [innerType];
      if(typeof param.allowableValues === 'undefined') {
        // can't show as a list if no values to select from
        delete param.isList;
        delete param.allowMultiple;
      }
    }
    param.signature = this.getModelSignature(innerType, models).toString();
    param.sampleJSON = this.getModelSampleJSON(innerType, models);
    param.responseClassSignature = param.signature;
  }

  var defaultResponseCode, response, responses = this.responses;

  if(responses['200']) {
    response = responses['200'];
    defaultResponseCode = '200';
  }
  else if(responses['201']) {
    response = responses['201'];
    defaultResponseCode = '201';
  }
  else if(responses['202']) {
    response = responses['202'];
    defaultResponseCode = '202';
  }
  else if(responses['203']) {
    response = responses['203'];
    defaultResponseCode = '203';
  }
  else if(responses['204']) {
    response = responses['204'];
    defaultResponseCode = '204';
  }
  else if(responses['205']) {
    response = responses['205'];
    defaultResponseCode = '205';
  }
  else if(responses['206']) {
    response = responses['206'];
    defaultResponseCode = '206';
  }
  else if(responses['default']) {
    response = responses['default'];
    defaultResponseCode = 'default';
  }

  if(response && response.schema) {
    var resolvedModel = this.resolveModel(response.schema, definitions);
    delete responses[defaultResponseCode];
    if(resolvedModel) {
      this.successResponse = {};
      this.successResponse[defaultResponseCode] = resolvedModel;
    }
    else {
      this.successResponse = {};
      this.successResponse[defaultResponseCode] = response.schema.type;
    }
    this.type = response;
  }

  if (errors.length > 0) {
    if(this.resource && this.resource.api && this.resource.api.fail)
      this.resource.api.fail(errors);
  }

  return this;
};

OperationGroup.prototype.sort = function(sorter) {

};

Operation.prototype.getType = function (param) {
  var type = param.type;
  var format = param.format;
  var isArray = false;
  var str;
  if(type === 'integer' && format === 'int32')
    str = 'integer';
  else if(type === 'integer' && format === 'int64')
    str = 'long';
  else if(type === 'integer')
    str = 'integer';
  else if(type === 'string') {
    if(format === 'date-time')
      str = 'date-time';
    else if(format === 'date')
      str = 'date';
    else
      str = 'string';
  }
  else if(type === 'number' && format === 'float')
    str = 'float';
  else if(type === 'number' && format === 'double')
    str = 'double';
  else if(type === 'number')
    str = 'double';
  else if(type === 'boolean')
    str = 'boolean';
  else if(type === 'array') {
    isArray = true;
    if(param.items)
      str = this.getType(param.items);
  }
  if(param.$ref)
    str = param.$ref;

  var schema = param.schema;
  if(schema) {
    var ref = schema.$ref;
    if(ref) {
      ref = simpleRef(ref);
      if(isArray)
        return [ ref ];
      else
        return ref;
    }
    else
      return this.getType(schema);
  }
  if(isArray)
    return [ str ];
  else
    return str;
};

Operation.prototype.resolveModel = function (schema, definitions) {
  if(typeof schema.$ref !== 'undefined') {
    var ref = schema.$ref;
    if(ref.indexOf('#/definitions/') === 0)
      ref = ref.substring('#/definitions/'.length);
    if(definitions[ref]) {
      return new Model(ref, definitions[ref]);
    }
  }
  if(schema.type === 'array')
    return new ArrayModel(schema);
  else
    return null;
};

Operation.prototype.help = function(dontPrint) {
  var out = this.nickname + ': ' + this.summary + '\n';
  for(var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    var typeInfo = param.signature;
    out += '\n  * ' + param.name + ' (' + typeInfo + '): ' + param.description;
  }
  if(typeof dontPrint === 'undefined')
    log(out);
  return out;
};

Operation.prototype.getModelSignature = function(type, definitions) {
  var isPrimitive, listType;

  if(type instanceof Array) {
    listType = true;
    type = type[0];
  }
  else if(typeof type === 'undefined')
    type = 'undefined';

  if(type === 'string')
    isPrimitive = true;
  else
    isPrimitive = (listType && definitions[listType]) || (definitions[type]) ? false : true;
  if (isPrimitive) {
    if(listType)
      return 'Array[' + type + ']';
    else
      return type.toString();
  } else {
    if (listType)
      return 'Array[' + definitions[type].getMockSignature() + ']';
    else
      return definitions[type].getMockSignature();
  }
};

Operation.prototype.supportHeaderParams = function () {
  return true;
};

Operation.prototype.supportedSubmitMethods = function () {
  return this.parent.supportedSubmitMethods;
};

Operation.prototype.getHeaderParams = function (args) {
  var headers = this.setContentTypes(args, {});
  for(var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    if(typeof args[param.name] !== 'undefined') {
      if (param.in === 'header') {
        var value = args[param.name];
        if(Array.isArray(value))
          value = value.toString();
        headers[param.name] = value;
      }
    }
  }
  return headers;
};

Operation.prototype.urlify = function (args) {
  var formParams = {};
  var requestUrl = this.path;

  // grab params from the args, build the querystring along the way
  var querystring = '';
  for(var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    if(typeof args[param.name] !== 'undefined') {
      if(param.in === 'path') {
        var reg = new RegExp('\{' + param.name + '\}', 'gi');
        var value = args[param.name];
        if(Array.isArray(value))
          value = this.encodePathCollection(param.collectionFormat, param.name, value);
        else
          value = this.encodePathParam(value);
        requestUrl = requestUrl.replace(reg, value);
      }
      else if (param.in === 'query' && typeof args[param.name] !== 'undefined') {
        if(querystring === '')
          querystring += '?';
        else
          querystring += '&';
        if(typeof param.collectionFormat !== 'undefined') {
          var qp = args[param.name];
          if(Array.isArray(qp))
            querystring += this.encodeQueryCollection(param.collectionFormat, param.name, qp);
          else
            querystring += this.encodeQueryParam(param.name) + '=' + this.encodeQueryParam(args[param.name]);
        }
        else
          querystring += this.encodeQueryParam(param.name) + '=' + this.encodeQueryParam(args[param.name]);
      }
      else if (param.in === 'formData')
        formParams[param.name] = args[param.name];
    }
  }
  var url = this.scheme + '://' + this.host;

  if(this.basePath !== '/')
    url += this.basePath;

  return url + requestUrl + querystring;
};

Operation.prototype.getMissingParams = function(args) {
  var missingParams = [];
  // check required params, track the ones that are missing
  var i;
  for(i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    if(param.required === true) {
      if(typeof args[param.name] === 'undefined')
        missingParams = param.name;
    }
  }
  return missingParams;
};

Operation.prototype.getBody = function(headers, args, opts) {
  var formParams = {}, body, key;

  for(var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    if(typeof args[param.name] !== 'undefined') {
      if (param.in === 'body') {
        body = args[param.name];
      } else if(param.in === 'formData') {
        formParams[param.name] = args[param.name];
      }
    }
  }

  // handle form params
  if(headers['Content-Type'] === 'application/x-www-form-urlencoded') {
    var encoded = "";
    for(key in formParams) {
      value = formParams[key];
      if(typeof value !== 'undefined'){
        if(encoded !== "")
          encoded += "&";
        encoded += encodeURIComponent(key) + '=' + encodeURIComponent(value);
      }
    }
    body = encoded;
  }
  else if (headers['Content-Type'] && headers['Content-Type'].indexOf('multipart/form-data') >= 0) {
    if(opts.useJQuery) {
      var bodyParam = new FormData();
      bodyParam.type = 'formData';
      for (key in formParams) {
        value = args[key];
        if (typeof value !== 'undefined') {
          // required for jquery file upload
          if(value.type === 'file' && value.value) {
            delete headers['Content-Type'];
            bodyParam.append(key, value.value);
          }
          else
            bodyParam.append(key, value);
        }
      }
      body = bodyParam;
    }
  }

  return body;
};

/**
 * gets sample response for a single operation
 **/
Operation.prototype.getModelSampleJSON = function(type, models) {
  var isPrimitive, listType, sampleJson;

  listType = (type instanceof Array);
  isPrimitive = models[type] ? false : true;
  sampleJson = isPrimitive ? void 0 : models[type].createJSONSample();
  if (sampleJson) {
    sampleJson = listType ? [sampleJson] : sampleJson;
    if(typeof sampleJson == 'string')
      return sampleJson;
    else if(typeof sampleJson === 'object') {
      var t = sampleJson;
      if(sampleJson instanceof Array && sampleJson.length > 0) {
        t = sampleJson[0];
      }
      if(t.nodeName) {
        var xmlString = new XMLSerializer().serializeToString(t);
        return this.formatXml(xmlString);
      }
      else
        return JSON.stringify(sampleJson, null, 2);
    }
    else
      return sampleJson;
  }
};

/**
 * legacy binding
 **/
Operation.prototype["do"] = function(args, opts, callback, error, parent) {
  return this.execute(args, opts, callback, error, parent);
};


/**
 * executes an operation
 **/
Operation.prototype.execute = function(arg1, arg2, arg3, arg4, parent) {
  var args = arg1 || {};
  var opts = {}, success, error;
  if(typeof arg2 === 'object') {
    opts = arg2;
    success = arg3;
    error = arg4;
  }

  if(typeof arg2 === 'function') {
    success = arg2;
    error = arg3;
  }

  success = (success||log);
  error = (error||log);

  if(opts.useJQuery)
    this.useJQuery = opts.useJQuery;

  var missingParams = this.getMissingParams(args);
  if(missingParams.length > 0) {
    var message = 'missing required params: ' + missingParams;
    fail(message);
    return;
  }
  var allHeaders = this.getHeaderParams(args);
  var contentTypeHeaders = this.setContentTypes(args, opts);

  var headers = {}, attrname;
  for (attrname in allHeaders) { headers[attrname] = allHeaders[attrname]; }
  for (attrname in contentTypeHeaders) { headers[attrname] = contentTypeHeaders[attrname]; }

  var body = this.getBody(headers, args, opts);
  var url = this.urlify(args);

  var obj = {
    url: url,
    method: this.method.toUpperCase(),
    body: body,
    useJQuery: this.useJQuery,
    headers: headers,
    on: {
      response: function(response) {
        return success(response, parent);
      },
      error: function(response) {
        return error(response, parent);
      }
    }
  };
  var status = authorizations.apply(obj, this.operation.security);
  if(opts.mock === true)
    return obj;
  else
    new SwaggerHttp().execute(obj, opts);
};

Operation.prototype.setContentTypes = function(args, opts) {
  // default type
  var accepts = 'application/json';
  var consumes = args.parameterContentType || 'application/json';
  var allDefinedParams = this.parameters;
  var definedFormParams = [];
  var definedFileParams = [];
  var body;
  var headers = {};

  // get params from the operation and set them in definedFileParams, definedFormParams, headers
  var i;
  for(i = 0; i < allDefinedParams.length; i++) {
    var param = allDefinedParams[i];
    if(param.in === 'formData') {
      if(param.type === 'file')
        definedFileParams.push(param);
      else
        definedFormParams.push(param);
    }
    else if(param.in === 'header' && opts) {
      var key = param.name;
      var headerValue = opts[param.name];
      if(typeof opts[param.name] !== 'undefined')
        headers[key] = headerValue;
    }
    else if(param.in === 'body' && typeof args[param.name] !== 'undefined') {
      body = args[param.name];
    }
  }

  // if there's a body, need to set the consumes header via requestContentType
  if (body && (this.method === 'post' || this.method === 'put' || this.method === 'patch' || this.method === 'delete')) {
    if (opts.requestContentType)
      consumes = opts.requestContentType;
  } else {
    // if any form params, content type must be set
    if(definedFormParams.length > 0) {
      if(opts.requestContentType)           // override if set
        consumes = opts.requestContentType;
      else if(definedFileParams.length > 0) // if a file, must be multipart/form-data
        consumes = 'multipart/form-data';
      else                                  // default to x-www-from-urlencoded
        consumes = 'application/x-www-form-urlencoded';
    }
    else if (this.type == 'DELETE')
      body = '{}';
    else if (this.type != 'DELETE')
      consumes = null;
  }

  if (consumes && this.consumes) {
    if (this.consumes.indexOf(consumes) === -1) {
      log('server doesn\'t consume ' + consumes + ', try ' + JSON.stringify(this.consumes));
    }
  }

  if (opts.responseContentType) {
    accepts = opts.responseContentType;
  } else {
    accepts = 'application/json';
  }
  if (accepts && this.produces) {
    if (this.produces.indexOf(accepts) === -1) {
      log('server can\'t produce ' + accepts);
    }
  }

  if ((consumes && body !== '') || (consumes === 'application/x-www-form-urlencoded'))
    headers['Content-Type'] = consumes;
  if (accepts)
    headers.Accept = accepts;
  return headers;
};

Operation.prototype.asCurl = function (args) {
  var obj = this.execute(args, {mock: true});
  authorizations.apply(obj);
  var results = [];
  results.push('-X ' + this.method.toUpperCase());
  if (obj.headers) {
    var key;
    for (key in obj.headers)
      results.push('--header "' + key + ': ' + obj.headers[key] + '"');
  }
  if(obj.body) {
    var body;
    if(typeof obj.body === 'object')
      body = JSON.stringify(obj.body);
    else
      body = obj.body;
    results.push('-d "' + body.replace(/"/g, '\\"') + '"');
  }
  return 'curl ' + (results.join(' ')) + ' "' + obj.url + '"';
};

Operation.prototype.encodePathCollection = function(type, name, value) {
  var encoded = '';
  var i;
  var separator = '';
  if(type === 'ssv')
    separator = '%20';
  else if(type === 'tsv')
    separator = '\\t';
  else if(type === 'pipes')
    separator = '|';
  else
    separator = ',';

  for(i = 0; i < value.length; i++) {
    if(i === 0)
      encoded = this.encodeQueryParam(value[i]);
    else
      encoded += separator + this.encodeQueryParam(value[i]);
  }
  return encoded;
};

Operation.prototype.encodeQueryCollection = function(type, name, value) {
  var encoded = '';
  var i;
  if(type === 'default' || type === 'multi') {
    for(i = 0; i < value.length; i++) {
      if(i > 0) encoded += '&';
      encoded += this.encodeQueryParam(name) + '=' + this.encodeQueryParam(value[i]);
    }
  }
  else {
    var separator = '';
    if(type === 'csv')
      separator = ',';
    else if(type === 'ssv')
      separator = '%20';
    else if(type === 'tsv')
      separator = '\\t';
    else if(type === 'pipes')
      separator = '|';
    else if(type === 'brackets') {
      for(i = 0; i < value.length; i++) {
        if(i !== 0)
          encoded += '&';
        encoded += this.encodeQueryParam(name) + '[]=' + this.encodeQueryParam(value[i]);
      }
    }
    if(separator !== '') {
      for(i = 0; i < value.length; i++) {
        if(i === 0)
          encoded = this.encodeQueryParam(name) + '=' + this.encodeQueryParam(value[i]);
        else
          encoded += separator + this.encodeQueryParam(value[i]);
      }
    }
  }
  return encoded;
};

Operation.prototype.encodeQueryParam = function(arg) {
  return encodeURIComponent(arg);
};

/**
 * TODO revisit, might not want to leave '/'
 **/
Operation.prototype.encodePathParam = function(pathParam) {
  var encParts, part, parts, i, len;
  pathParam = pathParam.toString();
  if (pathParam.indexOf('/') === -1) {
    return encodeURIComponent(pathParam);
  } else {
    parts = pathParam.split('/');
    encParts = [];
    for (i = 0, len = parts.length; i < len; i++) {
      encParts.push(encodeURIComponent(parts[i]));
    }
    return encParts.join('/');
  }
};

var Model = function(name, definition) {
  this.name = name;
  this.definition = definition || {};
  this.properties = [];
  var requiredFields = definition.required || [];
  if(definition.type === 'array') {
    var out = new ArrayModel(definition);
    return out;
  }
  var key;
  var props = definition.properties;
  if(props) {
    for(key in props) {
      var required = false;
      var property = props[key];
      if(requiredFields.indexOf(key) >= 0)
        required = true;
      this.properties.push(new Property(key, property, required));
    }
  }
};

Model.prototype.createJSONSample = function(modelsToIgnore) {
  var i, result = {}, representations = {};
  modelsToIgnore = (modelsToIgnore||{});
  modelsToIgnore[this.name] = this;
  for (i = 0; i < this.properties.length; i++) {
    prop = this.properties[i];
    var sample = prop.getSampleValue(modelsToIgnore, representations);
    result[prop.name] = sample;
  }
  delete modelsToIgnore[this.name];
  return result;
};

Model.prototype.getSampleValue = function(modelsToIgnore) {
  var i, obj = {}, representations = {};
  for(i = 0; i < this.properties.length; i++ ) {
    var property = this.properties[i];
    obj[property.name] = property.sampleValue(false, modelsToIgnore, representations);
  }
  return obj;
};

Model.prototype.getMockSignature = function(modelsToIgnore) {
  var i, prop, propertiesStr = [];
  for (i = 0; i < this.properties.length; i++) {
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
    modelsToIgnore = {};

  modelsToIgnore[this.name] = this;
  for (i = 0; i < this.properties.length; i++) {
    prop = this.properties[i];
    var ref = prop.$ref;
    var model = models[ref];
    if (model && typeof modelsToIgnore[model.name] === 'undefined') {
      returnVal = returnVal + ('<br>' + model.getMockSignature(modelsToIgnore));
    }
  }
  return returnVal;
};

var Property = function(name, obj, required) {
  this.schema = obj;
  this.required = required;
  if(obj.$ref)
    this.$ref = simpleRef(obj.$ref);
  else if (obj.type === 'array' && obj.items) {
    if(obj.items.$ref)
      this.$ref = simpleRef(obj.items.$ref);
    else
      obj = obj.items;
  }
  this.name = name;
  this.description = obj.description;
  this.obj = obj;
  this.optional = true;
  this.optional = !required;
  this.default = obj.default || null;
  this.example = obj.example !== undefined ? obj.example : null;
  this.collectionFormat = obj.collectionFormat || null;
  this.maximum = obj.maximum || null;
  this.exclusiveMaximum = obj.exclusiveMaximum || null;
  this.minimum = obj.minimum || null;
  this.exclusiveMinimum = obj.exclusiveMinimum || null;
  this.maxLength = obj.maxLength || null;
  this.minLength = obj.minLength || null;
  this.pattern = obj.pattern || null;
  this.maxItems = obj.maxItems || null;
  this.minItems = obj.minItems || null;
  this.uniqueItems = obj.uniqueItems || null;
  this['enum'] = obj['enum'] || null;
  this.multipleOf = obj.multipleOf || null;
};

Property.prototype.getSampleValue = function (modelsToIgnore, representations) {
  return this.sampleValue(false, modelsToIgnore, representations);
};

Property.prototype.isArray = function () {
  var schema = this.schema;
  if(schema.type === 'array')
    return true;
  else
    return false;
};

Property.prototype.sampleValue = function(isArray, ignoredModels, representations) {
  isArray = (isArray || this.isArray());
  ignoredModels = (ignoredModels || {});
  // representations = (representations || {});

  var type = getStringSignature(this.obj, true);
  var output;

  if(this.$ref) {
    var refModelName = simpleRef(this.$ref);
    var refModel = models[refModelName];
    if(typeof representations[type] !== 'undefined') {
      return representations[type];
    }
    else

    if(refModel && typeof ignoredModels[type] === 'undefined') {
      ignoredModels[type] = this;
      output = refModel.getSampleValue(ignoredModels, representations);
      representations[type] = output;
    }
    else {
      output = (representations[type] || refModelName);
    }
  }
  else if(this.example)
    output = this.example;
  else if(this.default)
    output = this.default;
  else if(type === 'date-time')
    output = new Date().toISOString();
  else if(type === 'date')
    output = new Date().toISOString().split("T")[0];
  else if(type === 'string')
    output = 'string';
  else if(type === 'integer')
    output = 0;
  else if(type === 'long')
    output = 0;
  else if(type === 'float')
    output = 0.0;
  else if(type === 'double')
    output = 0.0;
  else if(type === 'boolean')
    output = true;
  else
    output = {};
  ignoredModels[type] = output;
  if(isArray)
    return [output];
  else
    return output;
};

getStringSignature = function(obj, baseComponent) {
  var str = '';
  if(typeof obj.$ref !== 'undefined')
    str += simpleRef(obj.$ref);
  else if(typeof obj.type === 'undefined')
    str += 'object';
  else if(obj.type === 'array') {
    if(baseComponent)
      str += getStringSignature((obj.items || obj.$ref || {}));
    else {
      str += 'Array[';
      str += getStringSignature((obj.items || obj.$ref || {}));
      str += ']';
    }
  }
  else if(obj.type === 'integer' && obj.format === 'int32')
    str += 'integer';
  else if(obj.type === 'integer' && obj.format === 'int64')
    str += 'long';
  else if(obj.type === 'integer' && typeof obj.format === 'undefined')
    str += 'long';
  else if(obj.type === 'string' && obj.format === 'date-time')
    str += 'date-time';
  else if(obj.type === 'string' && obj.format === 'date')
    str += 'date';
  else if(obj.type === 'string' && typeof obj.format === 'undefined')
    str += 'string';
  else if(obj.type === 'number' && obj.format === 'float')
    str += 'float';
  else if(obj.type === 'number' && obj.format === 'double')
    str += 'double';
  else if(obj.type === 'number' && typeof obj.format === 'undefined')
    str += 'double';
  else if(obj.type === 'boolean')
    str += 'boolean';
  else if(obj.$ref)
    str += simpleRef(obj.$ref);
  else
    str += obj.type;
  return str;
};

simpleRef = function(name) {
  if(typeof name === 'undefined')
    return null;
  if(name.indexOf("#/definitions/") === 0)
    return name.substring('#/definitions/'.length);
  else
    return name;
};

Property.prototype.toString = function() {
  var str = getStringSignature(this.obj);
  if(str !== '') {
    str = '<span class="propName ' + this.required + '">' + this.name + '</span> (<span class="propType">' + str + '</span>';
    if(!this.required)
      str += ', <span class="propOptKey">optional</span>';
    str += ')';
  }
  else
    str = this.name + ' (' + JSON.stringify(this.obj) + ')';

  if(typeof this.description !== 'undefined')
    str += ': ' + this.description;

  if (this['enum']) {
    str += ' = <span class="propVals">[\'' + this['enum'].join('\' or \'') + '\']</span>';
  }
  if (this.descr) {
    str += ': <span class="propDesc">' + this.descr + '</span>';
  }


  var options = ''; 
  var isArray = this.schema.type === 'array';
  var type;

  if(isArray) {
    if(this.schema.items)
      type = this.schema.items.type;
    else
      type = '';
  }
  else {
    type = this.schema.type;
  }

  if (this.default)
    options += optionHtml('Default', this.default);

  switch (type) {
    case 'string':
      if (this.minLength)
        options += optionHtml('Min. Length', this.minLength);
      if (this.maxLength)
        options += optionHtml('Max. Length', this.maxLength);
      if (this.pattern)
        options += optionHtml('Reg. Exp.', this.pattern);
      break;
    case 'integer':
    case 'number':
      if (this.minimum)
        options += optionHtml('Min. Value', this.minimum);
      if (this.exclusiveMinimum)
        options += optionHtml('Exclusive Min.', "true");
      if (this.maximum)
        options += optionHtml('Max. Value', this.maximum);
      if (this.exclusiveMaximum)
        options += optionHtml('Exclusive Max.', "true");
      if (this.multipleOf)
        options += optionHtml('Multiple Of', this.multipleOf);
      break;
  }

  if (isArray) {
    if (this.minItems)
      options += optionHtml('Min. Items', this.minItems);
    if (this.maxItems)
      options += optionHtml('Max. Items', this.maxItems);
    if (this.uniqueItems)
      options += optionHtml('Unique Items', "true");
    if (this.collectionFormat)
      options += optionHtml('Coll. Format', this.collectionFormat);
  }

  if (this['enum']) {
    var enumString;

    if (type === 'number' || type === 'integer')
      enumString = this['enum'].join(', ');
    else {
      enumString = '"' + this['enum'].join('", "') + '"';
    }

    options += optionHtml('Enum', enumString);
  }     

  if (options.length > 0)
    str = '<span class="propWrap">' + str + '<table class="optionsWrapper"><tr><th colspan="2">' + this.name + '</th></tr>' + options + '</table></span>';
  
  return str;
};

optionHtml = function(label, value) {
  return '<tr><td class="optionName">' + label + ':</td><td>' + value + '</td></tr>';
};

typeFromJsonSchema = function(type, format) {
  var str;
  if(type === 'integer' && format === 'int32')
    str = 'integer';
  else if(type === 'integer' && format === 'int64')
    str = 'long';
  else if(type === 'integer' && typeof format === 'undefined')
    str = 'long';
  else if(type === 'string' && format === 'date-time')
    str = 'date-time';
  else if(type === 'string' && format === 'date')
    str = 'date';
  else if(type === 'number' && format === 'float')
    str = 'float';
  else if(type === 'number' && format === 'double')
    str = 'double';
  else if(type === 'number' && typeof format === 'undefined')
    str = 'double';
  else if(type === 'boolean')
    str = 'boolean';
  else if(type === 'string')
    str = 'string';

  return str;
};

var sampleModels = {};
var cookies = {};
var models = {};
