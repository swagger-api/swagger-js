'use strict';

var SwaggerHttp = require('./http');

/** 
 * Resolves a spec's remote references
 */
var Resolver = module.exports = function () {};

Resolver.prototype.resolve = function (spec, arg1, arg2, arg3) {
  var root = arg1, callback = arg2, scope = arg3;
  if(typeof arg1 === 'function') {
    root = null;
    callback = arg1;
    scope = arg2;
  }
  this.scope = (scope || this);
  this.iteration = this.iteration || 0;

  var host, name, path, property, propertyName;
  var processedCalls = 0, resolvedRefs = {}, unresolvedRefs = {};
  var resolutionTable = {}; // store objects for dereferencing

  // models
  for (name in spec.definitions) {
    var model = spec.definitions[name];

    for (propertyName in model.properties) {
      property = model.properties[propertyName];
      this.resolveTo(root, property, resolutionTable);
    }
  }

  // operations
  for (name in spec.paths) {
    var method, operation, responseCode;
    path = spec.paths[name];

    for (method in path) {
      // operation reference
      if(method === '$ref') {
        this.resolveInline(root, spec, path, resolutionTable, unresolvedRefs);
      }
      else {
        operation = path[method];

        var i, parameters = operation.parameters;
        for (i in parameters) {
          var parameter = parameters[i];

          if (parameter.in === 'body' && parameter.schema) {
            this.resolveTo(root, parameter.schema, resolutionTable);
          }

          if (parameter.$ref) {
            // parameter reference
            this.resolveInline(root, spec, parameter, resolutionTable, unresolvedRefs);
          }
        }

        for (responseCode in operation.responses) {
          var response = operation.responses[responseCode];
          if(typeof response === 'object') {
            if(response.$ref) {
              // response reference
              this.resolveInline(root, spec, response, resolutionTable, unresolvedRefs);
            }
          }
          if (response.schema && response.schema.$ref) {
            this.resolveTo(root, response.schema, resolutionTable);
          }
        }
      }
    }
  }

  // get hosts
  var resolved, opts = {}, expectedCalls = 0;

  for (name in resolutionTable) {
    var parts = name.split('#');

    if(name.indexOf('http') === 0) {
      if (parts.length === 2) {
        host = parts[0]; path = parts[1];

        if (!Array.isArray(opts[host])) {
          opts[host] = [];
          expectedCalls += 1;
        }
        opts[host].push({
          path: path,
          key: name
        });
      }
      else {
        if (!Array.isArray(opts[name])) {
          opts[name] = [];
          expectedCalls += 1;
        }
        opts[name].push(null);
      }
    }
    else {
      resolved = resolutionTable[name];
      if(resolved.length > 1) {
        // TODO
        console.log('more than one match!');
      }
      else {
        resolved = resolved[0];
        if(resolved.root) {
          if(name.indexOf('/') === 0) {
            // use root host not relative
            var p = resolved.root.split('\/\/');
            if(p.length > 1) {
              var hostPart = p[1].split('\/');
              host = p[0] + '//' + hostPart[0];
            }
            resolved.root = host;
          }
          parts = name.split('#');
          if(parts.length > 1) {
            host = host + parts[0];
            path = parts[1];
          }
          else {
            host = resolved.root;
            path = resolved.obj.$ref;
          }

          if (!Array.isArray(opts[host])) {
            opts[host] = [];
            expectedCalls += 1;
          }
          opts[host].push({
            path: path,
            key: resolved.key
          });
        }
      }
    }
  }


  for (name in opts) {
    var self = this, opt = opts[name];
    host = name;

    var obj = {
      useJQuery: false,  // TODO
      url: host,
      method: 'get',
      headers: {
        accept: this.scope.swaggerRequestHeaders || 'application/json'
      },
      on: {
        error: function () {
          processedCalls += 1;

          var i;
          for (i = 0; i < opt.length; i++) {
            // fail all of these
            var resolved = host + '#' + opt[i];
            unresolvedRefs[resolved] = null;
          }

          if (processedCalls === expectedCalls) {
            self.finish(spec, root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
          }
        },  // jshint ignore:line
        response: function (response) {
          var i, j, swagger = response.obj;

          if(swagger === null || Object.keys(swagger).length === 0) {
            try {
              swagger = JSON.parse(response.data);
            }
            catch (e){
              swagger = {};
            }
          }

          processedCalls += 1;

          for (i = 0; i < opt.length; i++) {
            if(opt[i] === null) {
              resolvedRefs[name] = {
                name: name,
                obj: swagger
              };
            }
            else {
              var path = opt[i].path;
              var location = swagger, parts = path.split('/');

              for (j = 0; j < parts.length; j++) {
                var segment = parts[j];
                if(segment.indexOf('~1') !== -1) {
                  segment = parts[j].replace(/~0/g, '~').replace(/~1/g, '/');
                  if(segment.charAt(0) !== '/') {
                    segment = '/' + segment;
                  }
                }

                if (typeof location === 'undefined') {
                  break;
                }

                if (segment.length > 0) {
                  location = location[segment];
                }
              }
              var resolved = host + '#' + path, resolvedName = parts[j-1];
              if (typeof location !== 'undefined') {
                resolvedRefs[resolved] = {
                  name: resolvedName,
                  obj: location,
                  key: opt.key
                };
              } else {
                unresolvedRefs[resolved] = null;
              }
            }
          }
          if (processedCalls === expectedCalls) {
            self.finish(spec, root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
          }
        }
      } // jshint ignore:line
    };

    if (scope && scope.clientAuthorizations) {
      scope.clientAuthorizations.apply(obj);
    }

    new SwaggerHttp().execute(obj);
  }

  if (Object.keys(opts).length === 0) {
    callback.call(this.scope, spec, unresolvedRefs);
  }
};

Resolver.prototype.finish = function (spec, root, resolutionTable, resolvedRefs, unresolvedRefs, callback) {
  // walk resolution table and replace with resolved refs
  var ref;
  for (ref in resolutionTable) {
    var i, locations = resolutionTable[ref];

    for (i = 0; i < locations.length; i++) {
      var key = locations[i].key;
      if(key.indexOf('http') !== 0) {
        key = locations[i].root + key;
      }
      var resolvedTo = resolvedRefs[key];
      if (resolvedTo) {
        spec.definitions = spec.definitions || {};
        if (locations[i].resolveAs === '$ref') {
          spec.definitions[resolvedTo.name] = resolvedTo.obj;
          locations[i].obj.$ref = '#/definitions/' + resolvedTo.name;
        } else if (locations[i].resolveAs === 'inline') {
          var targetObj = locations[i].obj;

          delete targetObj.$ref;

          for (key in resolvedTo.obj) {
            targetObj[key] = resolvedTo.obj[key];
          }
        }
      }
    }
  }

  // TODO need to check if we're done instead of just resolving 2x
  if(this.iteration === 2) {
    callback.call(this.scope, spec, unresolvedRefs);
  }
  else {
    this.iteration += 1;
    this.resolve(spec, root, callback, this.scope);
  }
};

/**
 * immediately in-lines local refs, queues remote refs
 * for inline resolution
 */
Resolver.prototype.resolveInline = function (root, spec, property, resolutionTable, unresolvedRefs) {
  var ref = property.$ref;

  if (ref) {
    if (ref.indexOf('http') === 0) {
      resolutionTable[ref] = resolutionTable[ref] || [];
      resolutionTable[ref] = [{obj: property, resolveAs: 'inline', root: root, key: ref}];
    } else if (ref.indexOf('#') === 0) {
      // local resolve
      var shortenedRef = ref.substring(1);
      var i, parts = shortenedRef.split('/'), location = spec;

      for (i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part.length > 0) {
          location = location[part];
        }
      }

      if (location) {
        delete property.$ref;

        var key;
        for (key in location) {
          property[key] = location[key];
        }
      } else {
        unresolvedRefs[ref] = null;
      }
    }
    else {
      if (Array.isArray(resolutionTable[ref])) {
        resolutionTable[ref].push({obj: property, resolveAs: 'inline', root: root, key: ref});
      } else {
        resolutionTable[ref] = [{obj: property, resolveAs: 'inline', root: root, key: ref}];
      }
    }
  } else if (property.type === 'array') {
    this.resolveTo(root, property.items, resolutionTable);
  }
};

Resolver.prototype.resolveTo = function (root, property, objs) {
  var ref = property.$ref;
  if (ref) {
    if (ref.indexOf('http') === 0) {
      if (Array.isArray(objs[ref])) {
        objs[ref].push({obj: property, resolveAs: '$ref', root: root, key: ref});
      } else {
        objs[ref] = [{obj: property, resolveAs: '$ref', root: root, key: ref}];
      }
    }
  } else if (property.type === 'array') {
    var items = property.items;
    this.resolveTo(root, items, objs);
  }
};
