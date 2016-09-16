'use strict';

var _ = {
  cloneDeep: require('lodash-compat/lang/cloneDeep'),
  isUndefined: require('lodash-compat/lang/isUndefined'),
  isEmpty: require('lodash-compat/lang/isEmpty'),
  isObject: require('lodash-compat/lang/isObject')
};
var helpers = require('../helpers');
var Model = require('./model');
var SwaggerHttp = require('../http');
var Q = require('q');

var Operation = module.exports = function (parent, scheme, operationId, httpMethod, path, args, definitions, models, clientAuthorizations) {
  var errors = [];

  parent = parent || {};
  args = args || {};

  if(parent && parent.options) {
    this.client = parent.options.client || null;
    this.requestInterceptor = parent.options.requestInterceptor || null;
    this.responseInterceptor = parent.options.responseInterceptor || null;
  }
  this.authorizations = args.security;
  this.basePath = parent.basePath || '/';
  this.clientAuthorizations = clientAuthorizations;
  this.consumes = args.consumes || parent.consumes || ['application/json'];
  this.produces = args.produces || parent.produces || ['application/json'];
  this.deprecated = args.deprecated;
  this.description = args.description;
  this.host = parent.host;
  this.method = (httpMethod || errors.push('Operation ' + operationId + ' is missing method.'));
  this.models = models || {};
  this.nickname = (operationId || errors.push('Operations must have a nickname.'));
  this.operation = args;
  this.operations = {};
  this.parameters = args !== null ? (args.parameters || []) : {};
  this.parent = parent;
  this.path = (path || errors.push('Operation ' + this.nickname + ' is missing path.'));
  this.responses = (args.responses || {});
  this.scheme = scheme || parent.scheme || 'http';
  this.schemes = args.schemes || parent.schemes;
  this.security = args.security || parent.security;
  this.summary = args.summary || '';
  this.timeout = parent.timeout;
  this.type = null;
  this.useJQuery = parent.useJQuery;
  this.jqueryAjaxCache = parent.jqueryAjaxCache;
  this.enableCookies = parent.enableCookies;

  if(!this.host) {
    if(typeof window !== 'undefined') {
      this.host = window.location.host;
    }
    else {
      this.host = 'localhost';
    }
  }
  this.parameterMacro = parent.parameterMacro || function (operation, parameter) {
    return parameter.default;
  };

  this.inlineModels = [];

  if(this.basePath !== '/' && this.basePath.slice(-1) === '/') {
    this.basePath = this.basePath.slice(0, -1);
  }

  if (typeof this.deprecated === 'string') {
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

  if (definitions) {
    // add to global models
    var key;

    for (key in definitions) {
      model = new Model(key, definitions[key], this.models, parent.modelPropertyMacro);

      if (model) {
        this.models[key] = model;
      }
    }
  }
  else {
    definitions = {};
  }

  for (i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];

    // Allow macro to set the default value
    param.default = this.parameterMacro(this, param);

    if (param.type === 'array') {
      param.isList = true;
      param.allowMultiple = true;
      // the enum can be defined at the items level
      //if (param.items && param.items.enum) {
      //  param['enum'] = param.items.enum;
      //}
    }

    var innerType = this.getType(param);

    if (innerType && innerType.toString().toLowerCase() === 'boolean') {
      param.allowableValues = {};
      param.isList = true;
      param['enum'] = [true, false]; // use actual primitives
    }

    if(typeof param['x-example'] !== 'undefined') {
      var d = param['x-example'];
      param.default = d;
    }
    if(param['x-examples']) {
      var d = param['x-examples'].default;
      if(typeof d !== 'undefined') {
        param.default = d;
      }
    }

    var enumValues = param['enum'] || (param.items && param.items['enum']);

    if (typeof enumValues !== 'undefined') {
      var id;

      param.allowableValues = {};
      param.allowableValues.values = [];
      param.allowableValues.descriptiveValues = [];

      for (id = 0; id < enumValues.length; id++) {
        var value = enumValues[id];
        var isDefault = (value === param.default || value+'' === param.default);

        param.allowableValues.values.push(value);
        // Always have string for descriptive values....
        param.allowableValues.descriptiveValues.push({value : value+'', isDefault: isDefault});
      }
    }

    if (param.type === 'array') {
      innerType = [innerType];

      if (typeof param.allowableValues === 'undefined') {
        // can't show as a list if no values to select from
        delete param.isList;
        delete param.allowMultiple;
      }
    }

    param.modelSignature = {type: innerType, definitions: this.models};
    param.signature = this.getModelSignature(innerType, this.models).toString();
    param.sampleJSON = this.getModelSampleJSON(innerType, this.models);
    param.responseClassSignature = param.signature;
  }

  var defaultResponseCode, response, responses = this.responses;

  if (responses['200']) {
    response = responses['200'];
    defaultResponseCode = '200';
  } else if (responses['201']) {
    response = responses['201'];
    defaultResponseCode = '201';
  } else if (responses['202']) {
    response = responses['202'];
    defaultResponseCode = '202';
  } else if (responses['203']) {
    response = responses['203'];
    defaultResponseCode = '203';
  } else if (responses['204']) {
    response = responses['204'];
    defaultResponseCode = '204';
  } else if (responses['205']) {
    response = responses['205'];
    defaultResponseCode = '205';
  } else if (responses['206']) {
    response = responses['206'];
    defaultResponseCode = '206';
  } else if (responses['default']) {
    response = responses['default'];
    defaultResponseCode = 'default';
  }

  if (response && response.schema) {
    var resolvedModel = this.resolveModel(response.schema, definitions);
    var successResponse;

    delete responses[defaultResponseCode];

    if (resolvedModel) {
      this.successResponse = {};
      successResponse = this.successResponse[defaultResponseCode] = resolvedModel;
    } else if (!response.schema.type || response.schema.type === 'object' || response.schema.type === 'array') {
      // Inline model
      this.successResponse = {};
      successResponse = this.successResponse[defaultResponseCode] = new Model(undefined, response.schema || {}, this.models, parent.modelPropertyMacro);
    } else {
      // Primitive
      this.successResponse = {};
      successResponse = this.successResponse[defaultResponseCode] = response.schema;
    }

    if (successResponse) {
      // Attach response properties
      if (response.description) {
        successResponse.description = response.description;
      }

      if (response.examples) {
        successResponse.examples = response.examples;
      }

      if (response.headers) {
        successResponse.headers = response.headers;
      }
    }

    this.type = response;
  }

  if (errors.length > 0) {
    if (this.resource && this.resource.api && this.resource.api.fail) {
      this.resource.api.fail(errors);
    }
  }

  return this;
};

Operation.prototype.isDefaultArrayItemValue = function(value, param) {
  if (param.default && Array.isArray(param.default)) {
    return param.default.indexOf(value) !== -1;
  }
  return value === param.default;
};

Operation.prototype.getType = function (param) {
  var type = param.type;
  var format = param.format;
  var isArray = false;
  var str;

  if (type === 'integer' && format === 'int32') {
    str = 'integer';
  } else if (type === 'integer' && format === 'int64') {
    str = 'long';
  } else if (type === 'integer') {
    str = 'integer';
  } else if (type === 'string') {
    if (format === 'date-time') {
      str = 'date-time';
    } else if (format === 'date') {
      str = 'date';
    } else {
      str = 'string';
    }
  } else if (type === 'number' && format === 'float') {
    str = 'float';
  } else if (type === 'number' && format === 'double') {
    str = 'double';
  } else if (type === 'number') {
    str = 'double';
  } else if (type === 'boolean') {
    str = 'boolean';
  } else if (type === 'array') {
    isArray = true;

    if (param.items) {
      str = this.getType(param.items);
    }
  } else if (type === 'file') {
    str = 'file';
  }

  if (param.$ref) {
    str = helpers.simpleRef(param.$ref);
  }

  var schema = param.schema;

  if (schema) {
    var ref = schema.$ref;

    if (ref) {
      ref = helpers.simpleRef(ref);

      if (isArray) {
        return [ ref ];
      } else {
        return ref;
      }
    } else {
      // If inline schema, we add it our interal hash -> which gives us it's ID (int)
      if(schema.type === 'object') {
        return this.addInlineModel(schema);
      }
      return this.getType(schema);
    }
  }
  if (isArray) {
    return [ str ];
  } else {
    return str;
  }
};

/**
 * adds an inline schema (model) to a hash, where we can ref it later
 * @param {object} schema a schema
 * @return {number} the ID of the schema being added, or null
 **/
Operation.prototype.addInlineModel = function (schema) {
  var len = this.inlineModels.length;
  var model = this.resolveModel(schema, {});
  if(model) {
    this.inlineModels.push(model);
    return 'Inline Model '+len; // return string ref of the inline model (used with #getInlineModel)
  }
  return null; // report errors?
};

/**
 * gets the internal ref to an inline model
 * @param {string} inline_str a string reference to an inline model
 * @return {Model} the model being referenced. Or null
 **/
Operation.prototype.getInlineModel = function(inlineStr) {
  if(/^Inline Model \d+$/.test(inlineStr)) {
    var id = parseInt(inlineStr.substr('Inline Model'.length).trim(),10); //
    var model = this.inlineModels[id];
    return model;
  }
  // I'm returning null here, should I rather throw an error?
  return null;
};

Operation.prototype.resolveModel = function (schema, definitions) {
  if (typeof schema.$ref !== 'undefined') {
    var ref = schema.$ref;

    if (ref.indexOf('#/definitions/') === 0) {
      ref = ref.substring('#/definitions/'.length);
    }

    if (definitions[ref]) {
      return new Model(ref, definitions[ref], this.models, this.parent.modelPropertyMacro);
    }
  // schema must at least be an object to get resolved to an inline Model
  } else if (schema && typeof schema === 'object' &&
            (schema.type === 'object' || _.isUndefined(schema.type))) {
    return new Model(undefined, schema, this.models, this.parent.modelPropertyMacro);
  }

  return null;
};

Operation.prototype.help = function (dontPrint) {
  var out = this.nickname + ': ' + this.summary + '\n';

  for (var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    var typeInfo = param.signature;

    out += '\n  * ' + param.name + ' (' + typeInfo + '): ' + param.description;
  }

  if (typeof dontPrint === 'undefined') {
    helpers.log(out);
  }

  return out;
};

Operation.prototype.getModelSignature = function (type, definitions) {
  var isPrimitive, listType;

  if (type instanceof Array) {
    listType = true;
    type = type[0];
  }

  // Convert undefined to string of 'undefined'
  if (typeof type === 'undefined') {
    type = 'undefined';
    isPrimitive = true;

  } else if (definitions[type]){
    // a model def exists?
    type = definitions[type]; /* Model */
    isPrimitive = false;

  } else if (this.getInlineModel(type)) {
    type = this.getInlineModel(type); /* Model */
    isPrimitive = false;

  } else {
    // We default to primitive
    isPrimitive = true;
  }

  if (isPrimitive) {
    if (listType) {
      return 'Array[' + type + ']';
    } else {
      return type.toString();
    }
  } else {
    if (listType) {
      return 'Array[' + type.getMockSignature() + ']';
    } else {
      return type.getMockSignature();
    }
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
  var headerParamsByLowerCase = {};

  for (var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];

    if (param.in === 'header') {
      headerParamsByLowerCase[param.name.toLowerCase()] = param;
    }
  }

  for (var arg in args) {
    var headerParam = headerParamsByLowerCase[arg.toLowerCase()];
    if (typeof headerParam !== 'undefined') {
      var value = args[arg];

      if (Array.isArray(value)) {
        value = value.toString();
      }

      headers[headerParam.name] = value;
    }
  }

  return headers;
};

Operation.prototype.urlify = function (args) {
  var formParams = {};
  var requestUrl = this.path.replace(/#.*/, ''); // remove URL fragment
  var querystring = ''; // grab params from the args, build the querystring along the way

  for (var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];

    if (typeof args[param.name] !== 'undefined') {
      if (param.in === 'path') {
        var reg = new RegExp('\{' + param.name + '\}', 'gi');
        var value = args[param.name];

        if (Array.isArray(value)) {
          value = this.encodePathCollection(param.collectionFormat, param.name, value);
        } else {
          value = this.encodePathParam(value);
        }

        requestUrl = requestUrl.replace(reg, value);
      } else if (param.in === 'query' && typeof args[param.name] !== 'undefined') {
        if (querystring === '' && requestUrl.indexOf('?') < 0) {
          querystring += '?';
        } else {
          querystring += '&';
        }

        if (typeof param.collectionFormat !== 'undefined') {
          var qp = args[param.name];

          if (Array.isArray(qp)) {
            querystring += this.encodeQueryCollection(param.collectionFormat, param.name, qp);
          } else {
            querystring += this.encodeQueryKey(param.name) + '=' + this.encodeQueryParam(args[param.name]);
          }
        } else {
          querystring += this.encodeQueryKey(param.name) + '=' + this.encodeQueryParam(args[param.name]);
        }
      } else if (param.in === 'formData') {
        formParams[param.name] = args[param.name];
      }
    }
  }
  var url = this.scheme + '://' + this.host;

  if (this.basePath !== '/') {
    url += this.basePath;
  }
  return url + requestUrl + querystring;
};

Operation.prototype.getMissingParams = function (args) {
  var missingParams = []; // check required params, track the ones that are missing
  var i;

  for (i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];

    if (param.required === true) {
      if (typeof args[param.name] === 'undefined') {
        missingParams = param.name;
      }
    }
  }

  return missingParams;
};

Operation.prototype.getBody = function (headers, args, opts) {
  var formParams = {}, hasFormParams, body, key, value, hasBody = false;

  // look at each param and put form params in an object
  for (var i = 0; i < this.parameters.length; i++) {
    var param = this.parameters[i];
    if (typeof args[param.name] !== 'undefined') {
      if (param.in === 'body') {
        body = args[param.name];
      } else if (param.in === 'formData') {
        formParams[param.name] = {
          param: param,
          value: args[param.name]
        };
        hasFormParams = true;
      }
    }
    else {
      if(param.in === 'body') {
        hasBody = true;
      }
    }
  }

  // if body is null and hasBody is true, AND a JSON body is requested, send empty {}
  if(hasBody && typeof body === 'undefined') {
    var contentType = headers['Content-Type'];
    if(contentType && contentType.indexOf('application/json') === 0) {
      body = '{}';
    }
  }

  var isMultiPart = false;
  if(headers['Content-Type'] && headers['Content-Type'].indexOf('multipart/form-data') >= 0) {
    isMultiPart = true;
  }

  // handle form params
  if (hasFormParams && !isMultiPart) {
    var encoded = '';

    for (key in formParams) {
      var param = formParams[key].param;
      value = formParams[key].value;

      if (typeof value !== 'undefined') {
        if (Array.isArray(value)) {
          if (encoded !== '') {
            encoded += '&';
          }
          encoded += this.encodeQueryCollection(param.collectionFormat, key, value);
        }
        else {
          if (encoded !== '') {
            encoded += '&';
          }

          encoded += encodeURIComponent(key) + '=' + encodeURIComponent(value);
        }
      }
    }

    body = encoded;
  } else if (isMultiPart) {
    var bodyParam;
    if (typeof FormData === 'function') {
      bodyParam = new FormData();

      bodyParam.type = 'formData';

      for (key in formParams) {
        var param = formParams[key].param;
        value = args[key];

        if (typeof value !== 'undefined') {
          if({}.toString.apply(value) === '[object File]') {
            bodyParam.append(key, value);
          }
          else if (value.type === 'file' && value.value) {
            bodyParam.append(key, value.value);
          } else {
            if (Array.isArray(value)) {
              if(param.collectionFormat === 'multi') {
                bodyParam.delete(key);
                for(var v in value) {
                  bodyParam.append(key, value[v]);
                }
              }
              else {
                bodyParam.append(key, this.encodeQueryCollection(param.collectionFormat, key, value).split('=').slice(1).join('='));
              }
            }
            else {
              bodyParam.append(key, value);
            }
          }
        }
      }
      body = bodyParam;
    }
    else {
      bodyParam = {};
      for (key in formParams) {
        value = args[key];
        if (Array.isArray(value)) {
          var delimeter;
          var format = param.collectionFormat || 'multi';
          if(format === 'ssv') {
            delimeter = ' ';
          }
          else if(format === 'pipes') {
            delimeter = '|';
          }
          else if(format === 'tsv') {
            delimeter = '\t';
          }
          else if(format === 'multi') {
            bodyParam[key] = value;
            break;
          }
          else {
            delimeter = ',';
          }
          var data;
          value.forEach(function(v) {
            if(data) {
              data += delimeter;
            }
            else {
              data = '';
            }
            data += v;
          });
          bodyParam[key] = data;
        }
        else {
          bodyParam[key] = value;
        }
      }
      body = bodyParam;
    }
    headers['Content-Type'] = 'multipart/form-data';
  }

  return body;
};

/**
 * gets sample response for a single operation
 **/
Operation.prototype.getModelSampleJSON = function (type, models) {
  var listType, sampleJson, innerType;
  models = models || {};

  listType = (type instanceof Array);
  innerType = listType ? type[0] : type;

  if(models[innerType]) {
    sampleJson = models[innerType].createJSONSample();
  } else if (this.getInlineModel(innerType)){
    sampleJson = this.getInlineModel(innerType).createJSONSample(); // may return null, if type isn't correct
  }


  if (sampleJson) {
    sampleJson = listType ? [sampleJson] : sampleJson;

    if (typeof sampleJson === 'string') {
      return sampleJson;
    } else if (_.isObject(sampleJson)) {
      var t = sampleJson;

      if (sampleJson instanceof Array && sampleJson.length > 0) {
        t = sampleJson[0];
      }

      if (t.nodeName && typeof t === 'Node') {
        var xmlString = new XMLSerializer().serializeToString(t);

        return this.formatXml(xmlString);
      } else {
        return JSON.stringify(sampleJson, null, 2);
      }
    } else {
      return sampleJson;
    }
  }
};

/**
 * legacy binding
 **/
Operation.prototype.do = function (args, opts, callback, error, parent) {
  return this.execute(args, opts, callback, error, parent);
};

/**
 * executes an operation
 **/
Operation.prototype.execute = function (arg1, arg2, arg3, arg4, parent) {
  var args = arg1 || {};
  var opts = {}, success, error, deferred, timeout;

  if (_.isObject(arg2)) {
    opts = arg2;
    success = arg3;
    error = arg4;
  }

  timeout = typeof opts.timeout !== 'undefined'
    ? opts.timeout
    : this.timeout;

  if(this.client) {
    opts.client = this.client;
  }

  // add the request interceptor from parent, if none sent from client
  if(!opts.requestInterceptor && this.requestInterceptor ) {
    opts.requestInterceptor = this.requestInterceptor ;
  }

  if(!opts.responseInterceptor && this.responseInterceptor) {
    opts.responseInterceptor = this.responseInterceptor;
  }

  if (typeof arg2 === 'function') {
    success = arg2;
    error = arg3;
  }

  if (this.parent.usePromise) {
    deferred = Q.defer();
  } else {
    success = (success || this.parent.defaultSuccessCallback || helpers.log);
    error = (error || this.parent.defaultErrorCallback || helpers.log);
  }

  if (typeof opts.useJQuery === 'undefined') {
    opts.useJQuery = this.useJQuery;
  }

  if (typeof opts.jqueryAjaxCache === 'undefined') {
    opts.jqueryAjaxCache = this.jqueryAjaxCache;
  }

  if (typeof opts.enableCookies === 'undefined') {
    opts.enableCookies = this.enableCookies;
  }

  var missingParams = this.getMissingParams(args);

  if (missingParams.length > 0) {
    var message = 'missing required params: ' + missingParams;

    helpers.fail(message);

    if (this.parent.usePromise) {
      deferred.reject(message);
      return deferred.promise;
    } else {
      error(message, parent);
      return {};
    }
  }

  var allHeaders = this.getHeaderParams(args);
  var contentTypeHeaders = this.setContentTypes(args, opts);
  var headers = {}, attrname;

  for (attrname in allHeaders) { headers[attrname] = allHeaders[attrname]; }
  for (attrname in contentTypeHeaders) { headers[attrname] = contentTypeHeaders[attrname]; }

  var body = this.getBody(contentTypeHeaders, args, opts);
  var url = this.urlify(args);

  if(url.indexOf('.{format}') > 0) {
    if(headers) {
      var format = headers.Accept || headers.accept;
      if(format && format.indexOf('json') > 0) {
        url = url.replace('.{format}', '.json');
      }
      else if(format && format.indexOf('xml') > 0) {
        url = url.replace('.{format}', '.xml');
      }
    }
  }

  var obj = {
    url: url,
    method: this.method.toUpperCase(),
    body: body,
    enableCookies: opts.enableCookies,
    useJQuery: opts.useJQuery,
    jqueryAjaxCache: opts.jqueryAjaxCache,
    deferred: deferred,
    headers: headers,
    clientAuthorizations: opts.clientAuthorizations,
    on: {
      response: function (response) {
        if (deferred) {
          deferred.resolve(response);
          return deferred.promise;
        } else {
          return success(response, parent);
        }
      },
      error: function (response) {
        if (deferred) {
          deferred.reject(response);
          return deferred.promise;
        } else {
          return error(response, parent);
        }
      }
    }
  };

  if (timeout) {
    obj.timeout = timeout;
  }

  this.clientAuthorizations.apply(obj, this.operation.security);
  if (opts.mock === true) {
    return obj;
  } else {
    return new SwaggerHttp().execute(obj, opts);
  }
};

function itemByPriority(col, itemPriority) {

  // No priorities? return first...
  if(_.isEmpty(itemPriority)) {
    return col[0];
  }

  for (var i = 0, len = itemPriority.length; i < len; i++) {
    if(col.indexOf(itemPriority[i]) > -1) {
      return itemPriority[i];
    }
  }

  // Otherwise return first
  return col[0];
}

Operation.prototype.setContentTypes = function (args, opts) {
  // default type
  var allDefinedParams = this.parameters;
  var body;
  var consumes = args.parameterContentType || itemByPriority(this.consumes, ['application/json', 'application/yaml']);
  var accepts = opts.responseContentType || itemByPriority(this.produces, ['application/json', 'application/yaml']);
  var definedFileParams = [];
  var definedFormParams = [];
  var headers = {};
  var i;

  // get params from the operation and set them in definedFileParams, definedFormParams, headers
  for (i = 0; i < allDefinedParams.length; i++) {
    var param = allDefinedParams[i];

    if (param.in === 'formData') {
      if (param.type === 'file') {
        definedFileParams.push(param);
      } else {
        definedFormParams.push(param);
      }
    } else if (param.in === 'header' && opts) {
      var key = param.name;
      var headerValue = opts[param.name];

      if (typeof opts[param.name] !== 'undefined') {
        headers[key] = headerValue;
      }
    } else if (param.in === 'body' && typeof args[param.name] !== 'undefined') {
      body = args[param.name];
    }
  }

  // if there's a body, need to set the consumes header via requestContentType
  var hasBody = body || definedFileParams.length || definedFormParams.length;
  if (this.method === 'post' || this.method === 'put' || this.method === 'patch' ||
      ((this.method === 'delete' || this.method === 'get') && hasBody)) {
    if (opts.requestContentType) {
      consumes = opts.requestContentType;
    }
    // if any form params, content type must be set
    if (definedFormParams.length > 0) {
      consumes = undefined;
      if (opts.requestContentType) {             // override if set
        consumes = opts.requestContentType;
      } else if (definedFileParams.length > 0) { // if a file, must be multipart/form-data
        consumes = 'multipart/form-data';
      } else {
        if (this.consumes && this.consumes.length > 0) {
          // use the consumes setting
          for(var c in this.consumes) {
            var chk = this.consumes[c];
            if(chk.indexOf('application/x-www-form-urlencoded') === 0 || chk.indexOf('multipart/form-data') === 0) {
              consumes = chk;
            }
          }
        }
      }
      if(typeof consumes === 'undefined') {
        // default to x-www-from-urlencoded
        consumes = 'application/x-www-form-urlencoded';
      }
    }
  }
  else {
    consumes = null;
  }

  if (consumes && this.consumes) {
    if (this.consumes.indexOf(consumes) === -1) {
      helpers.log('server doesn\'t consume ' + consumes + ', try ' + JSON.stringify(this.consumes));
    }
  }

  if (!this.matchesAccept(accepts)) {
    helpers.log('server can\'t produce ' + accepts);
  }

  if ((consumes && body !== '') || (consumes === 'application/x-www-form-urlencoded')) {
    headers['Content-Type'] = consumes;
  }
  else if(this.consumes && this.consumes.length > 0 && this.consumes[0] === 'application/x-www-form-urlencoded') {
    headers['Content-Type'] = this.consumes[0];
  }

  if (accepts) {
    headers.Accept = accepts;
  }

  return headers;
};

/**
 * Returns true if the request accepts header matches anything in this.produces.
 *  If this.produces contains * / *, ignore the accept header.
 * @param {string=} accepts The client request accept header.
 * @return {boolean}
 */
Operation.prototype.matchesAccept = function(accepts) {
  // no accepts or produces, no problem!
  if (!accepts || !this.produces) {
    return true;
  }
  return this.produces.indexOf(accepts) !== -1 || this.produces.indexOf('*/*') !== -1;
};

Operation.prototype.asCurl = function (args1, args2) {
  var opts = {mock: true};
  if (typeof args2 === 'object') {
    for (var argKey in args2) {
      opts[argKey] = args2[argKey];
    }
  }
  var obj = this.execute(args1, opts);

  this.clientAuthorizations.apply(obj, this.operation.security);

  var results = [];

  results.push('-X ' + this.method.toUpperCase());

  if (typeof obj.headers !== 'undefined') {
    var key;

    for (key in obj.headers) {
      var value = obj.headers[key];
      if(typeof value === 'string'){
        value = value.replace(/\'/g, '\\u0027');
      }
      results.push('--header \'' + key + ': ' + value + '\'');
    }
  }
  var isFormData = false;
  var isMultipart = false;

  var type = obj.headers['Content-Type'];
  if(type && type.indexOf('application/x-www-form-urlencoded') === 0) {
    isFormData = true;
  }
  else if (type && type.indexOf('multipart/form-data') === 0) {
    isFormData = true;
    isMultipart = true;
  }

  if (obj.body) {
    var body;
    if (_.isObject(obj.body)) {
      if(isMultipart) {
        isMultipart = true;
        // add the form data
        for(var i = 0; i < this.parameters.length; i++) {
          var parameter = this.parameters[i];
          if(parameter.in === 'formData') {
            if (!body) {
              body = '';
            }

            var paramValue;
            if(typeof FormData === 'function' && obj.body instanceof FormData) {
              paramValue = obj.body.getAll(parameter.name);
            }
            else {
              paramValue = obj.body[parameter.name];
            }
            if (paramValue) {
              if (parameter.type === 'file') {
                if(paramValue.name) {
                  body += '-F ' + parameter.name + '=@"' + paramValue.name + '" ';
                }
              }
              else {
                if (Array.isArray(paramValue)) {
                  if(parameter.collectionFormat === 'multi') {
                    for(var v in paramValue) {
                      body += '-F ' + this.encodeQueryKey(parameter.name) + '=' + paramValue[v] + ' ';
                    }
                  }
                  else {
                    body += '-F ' + this.encodeQueryCollection(parameter.collectionFormat, parameter.name, paramValue) + ' ';
                  }
                } else {
                  body += '-F ' + this.encodeQueryKey(parameter.name) + '=' + paramValue + ' ';
                }
              }
            }
          }
        }
      }
      if(!body) {
        body = JSON.stringify(obj.body);
      }
    } else {
      body = obj.body;
    }
    // escape @ => %40, ' => %27
    body = body.replace(/\'/g, '%27').replace(/\n/g, ' \\ \n ');

    if(!isFormData) {
      // escape & => %26
      body = body.replace(/&/g, '%26');
    }
    if(isMultipart) {
      results.push(body);
    }
    else {
      results.push('-d \'' + body.replace(/@/g, '%40') + '\'');
    }
  }

  return 'curl ' + (results.join(' ')) + ' \'' + obj.url + '\'';
};

Operation.prototype.encodePathCollection = function (type, name, value) {
  var encoded = '';
  var i;
  var separator = '';

  if (type === 'ssv') {
    separator = '%20';
  } else if (type === 'tsv') {
    separator = '%09';
  } else if (type === 'pipes') {
    separator = '|';
  } else {
    separator = ',';
  }

  for (i = 0; i < value.length; i++) {
    if (i === 0) {
      encoded = this.encodeQueryParam(value[i]);
    } else {
      encoded += separator + this.encodeQueryParam(value[i]);
    }
  }

  return encoded;
};

Operation.prototype.encodeQueryCollection = function (type, name, value) {
  var encoded = '';
  var i;

  type = type || 'default';
  if (type === 'default' || type === 'multi') {
    for (i = 0; i < value.length; i++) {
      if (i > 0) {encoded += '&';}

      encoded += this.encodeQueryKey(name) + '=' + this.encodeQueryParam(value[i]);
    }
  } else {
    var separator = '';

    if (type === 'csv') {
      separator = ',';
    } else if (type === 'ssv') {
      separator = '%20';
    } else if (type === 'tsv') {
      separator = '%09';
    } else if (type === 'pipes') {
      separator = '|';
    } else if (type === 'brackets') {
      for (i = 0; i < value.length; i++) {
        if (i !== 0) {
          encoded += '&';
        }

        encoded += this.encodeQueryKey(name) + '[]=' + this.encodeQueryParam(value[i]);
      }
    }

    if (separator !== '') {
      for (i = 0; i < value.length; i++) {
        if (i === 0) {
          encoded = this.encodeQueryKey(name) + '=' + this.encodeQueryParam(value[i]);
        } else {
          encoded += separator + this.encodeQueryParam(value[i]);
        }
      }
    }
  }

  return encoded;
};

Operation.prototype.encodeQueryKey = function (arg) {
  return encodeURIComponent(arg)
      .replace('%5B','[').replace('%5D', ']').replace('%24', '$');
};

Operation.prototype.encodeQueryParam = function (arg) {
  return encodeURIComponent(arg);
};

/**
 * TODO revisit, might not want to leave '/'
 **/
Operation.prototype.encodePathParam = function (pathParam) {
  return encodeURIComponent(pathParam);
};
