'use strict';

var auth = require('./auth');
var helpers = require('./helpers');
var Model = require('./types/model');
var Operation = require('./types/operation');
var OperationGroup = require('./types/operationGroup');
var Resolver = require('./resolver');
var SwaggerHttp = require('./http');

var SwaggerClient = module.exports = function (url, options) {
  this.authorizationScheme = null;
  this.authorizations = null;
  this.basePath = null;
  this.debug = false;
  this.info = null;
  this.isBuilt = false;
  this.isValid = false;
  this.modelsArray = [];
  this.resourceCount = 0;
  this.url = null;
  this.useJQuery = false;

  if (typeof url !== 'undefined') {
    return this.initialize(url, options);
  }
};

SwaggerClient.prototype.initialize = function (url, options) {
  this.models = {};
  this.sampleModels = {};

  options = (options || {});

  if (typeof url === 'string') {
    this.url = url;
  } else if (typeof url === 'object') {
    options = url;
    this.url = options.url;
  }

  this.swaggerRequstHeaders = options.swaggerRequstHeaders || 'application/json;charset=utf-8,*/*';
  this.defaultSuccessCallback = options.defaultSuccessCallback || null;
  this.defaultErrorCallback = options.defaultErrorCallback || null;

  if (typeof options.success === 'function') {
    this.success = options.success;
  }

  if (options.useJQuery) {
    this.useJQuery = options.useJQuery;
  }

  if (options.authorizations) {
    this.clientAuthorizations = options.authorizations;
  } else {
    this.clientAuthorizations = new auth.SwaggerAuthorizations();
  }

  this.supportedSubmitMethods = options.supportedSubmitMethods || [];
  this.failure = options.failure || function () {};
  this.progress = options.progress || function () {};
  this.spec = options.spec;
  this.options = options;

  if (typeof options.success === 'function') {
    this.ready = true;
    this.build();
  }
};

SwaggerClient.prototype.build = function (mock) {
  if (this.isBuilt) {
    return this;
  }

  var self = this;

  this.progress('fetching resource list: ' + this.url);

  var obj = {
    useJQuery: this.useJQuery,
    url: this.url,
    method: 'get',
    headers: {
      accept: this.swaggerRequstHeaders
    },
    on: {
      error: function (response) {
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
      response: function (resp) {
        var responseObj = resp.obj || JSON.parse(resp.data);
        self.swaggerVersion = responseObj.swaggerVersion;

        if (responseObj.swagger && parseInt(responseObj.swagger) === 2) {
          self.swaggerVersion = responseObj.swagger;

          new Resolver().resolve(responseObj, self.buildFromSpec, self);

          self.isValid = true;
        } else {
          if (self.swaggerVersion === '1.2') {
            return self.buildFrom1_2Spec(responseObj); // jshint ignore:line
          } else {
            return self.buildFrom1_1Spec(responseObj); // jshint ignore:line
          }
        }
      }
    }
  };

  if (this.spec) {
    setTimeout(function () {
      new Resolver().resolve(self.spec, self.buildFromSpec, self);
   }, 10);
  } else {
    this.clientAuthorizations.apply(obj);

    if (mock) {
      return obj;
    }

    new SwaggerHttp().execute(obj);
  }

  return this;
};

SwaggerClient.prototype.buildFromSpec = function (response) {
  if (this.isBuilt) {
    return this;
  }

  this.apis = {};
  this.apisArray = [];
  this.basePath = response.basePath || '';
  this.consumes = response.consumes;
  this.host = response.host || '';
  this.info = response.info || {};
  this.produces = response.produces;
  this.schemes = response.schemes || [];
  this.securityDefinitions = response.securityDefinitions;
  this.title = response.title || '';

  if (response.externalDocs) {
    this.externalDocs = response.externalDocs;
  }

  // legacy support
  this.authSchemes = response.securityDefinitions;

  var definedTags = {};
  var k;

  if (Array.isArray(response.tags)) {
    definedTags = {};

    for (k = 0; k < response.tags.length; k++) {
      var t = response.tags[k];

      definedTags[t.name] = t;
    }
  }

  var location;

  if (typeof this.url === 'string') {
    location = this.parseUri(this.url);
  }

  if (typeof this.schemes === 'undefined' || this.schemes.length === 0) {
    this.scheme = location.scheme || 'http';
  } else {
    this.scheme = this.schemes[0];
  }

  if (typeof this.host === 'undefined' || this.host === '') {
    this.host = location.host;

    if (location.port) {
      this.host = this.host + ':' + location.port;
    }
  }

  this.definitions = response.definitions;

  var key;

  for (key in this.definitions) {
    var model = new Model(key, this.definitions[key], this.models);

    if (model) {
      this.models[key] = model;
    }
  }

  // get paths, create functions for each operationId
  var path;

  for (path in response.paths) {
    if (typeof response.paths[path] === 'object') {
      var httpMethod;

      for (httpMethod in response.paths[path]) {
        if (['delete', 'get', 'head', 'options', 'patch', 'post', 'put'].indexOf(httpMethod) === -1) {
          continue;
        }

        var operation = response.paths[path][httpMethod];
        var tags = operation.tags;

        if (typeof tags === 'undefined') {
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
          this.definitions,
          this.models,
          this.clientAuthorizations
        );

        // bind this operation's execute command to the api
        if (tags.length > 0) {
          var i;

          for (i = 0; i < tags.length; i++) {
            var tag = this.tagFromLabel(tags[i]);
            var operationGroup = this[tag];

            if (typeof this.apis[tag] === 'undefined') {
              this.apis[tag] = {};
            }

            if (typeof operationGroup === 'undefined') {
              this[tag] = [];
              operationGroup = this[tag];
              operationGroup.operations = {};
              operationGroup.label = tag;
              operationGroup.apis = [];

              var tagObject = definedTags[tag];

              if (typeof tagObject === 'object') {
                operationGroup.description = tagObject.description;
                operationGroup.externalDocs = tagObject.externalDocs;
              }

              this[tag].help = this.help.bind(operationGroup);
              this.apisArray.push(new OperationGroup(tag, operationGroup.description, operationGroup.externalDocs, operationObject));
            }

            if (typeof this.apis[tag].help !== 'function') {
              this.apis[tag].help = this.help.bind(operationGroup);
            }

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

            for (j = 0; j < this.apisArray.length; j++) {
              if (this.apisArray[j].tag === tag) {
                api = this.apisArray[j];
              }
            }

            if (api) {
              api.operationsArray.push(operationObject);
            }
          }
        } else {
          helpers.log('no group to bind to');
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

SwaggerClient.prototype.parseUri = function (uri) {
  var urlParseRE = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;
  var parts = urlParseRE.exec(uri);

  return {
    scheme: parts[4].replace(':',''),
    host: parts[11],
    port: parts[12],
    path: parts[15]
  };
};

SwaggerClient.prototype.help = function (dontPrint) {
  var i;
  var output = 'operations for the "' + this.label + '" tag';

  for (i = 0; i < this.apis.length; i++) {
    var api = this.apis[i];

    output += '\n  * ' + api.nickname + ': ' + api.operation.summary;
  }

  if (dontPrint) {
    return output;
  } else {
    helpers.log(output);

    return output;
  }
};

SwaggerClient.prototype.tagFromLabel = function (label) {
  return label;
};

SwaggerClient.prototype.idFromOp = function (path, httpMethod, op) {
  var opId = op.operationId || (path.substring(1) + '_' + httpMethod);

  return opId.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()\+\s]/g,'_');
};

SwaggerClient.prototype.fail = function (message) {
  this.failure(message);

  throw message;
};
