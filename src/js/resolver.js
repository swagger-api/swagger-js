var Resolver = function (){};

/** 
 * Resolves a spec's remote references
 */
Resolver.prototype.resolve = function(spec, callback, scope) {
  this.scope = (scope || this);

  var host, name, path, property, propertyName, type;
  // store objects for dereferencing
  var resolutionTable = {};

  // models
  for(name in spec.definitions) {
    var model = spec.definitions[name];
    for(propertyName in model.properties) {
      property = model.properties[propertyName];
      this.resolveTo(property, resolutionTable);
    }
  }
  // operations
  for(name in spec.paths) {
    var method, operation;
    path = spec.paths[name];
    for(method in path){
      operation = path[method];
      var parameters = operation.parameters;
      var i;
      for(i in parameters) {
        var parameter = parameters[i];
        if(parameter.in === 'body' && parameter.schema) {
          this.resolveTo(parameter.schema, resolutionTable);
        }
      }
      var responseCode;
      for(responseCode in operation.responses) {
        var response = operation.responses[responseCode];
        if(response.schema) {
          this.resolveTo(response.schema, resolutionTable);
        }
      }
    }
  }
  // get hosts
  var opts = {},  expectedCalls = 0;
  for(name in resolutionTable) {
    var parts = name.split('#');
    if(parts.length == 2) {
      host = parts[0];
      path = parts[1];
      if(!Array.isArray(opts[host])) {
        opts[host] = [];
        expectedCalls += 1;
      }
      opts[host].push(path);
    }
  }

  var processedCalls = 0, resolvedRefs = {}, unresolvedRefs = {};

  for(name in opts) {
    var self = this, opt = opts[name];
    host = name;

    var obj = {
      useJQuery: false,  // TODO
      url: host,
      method: "get",
      headers: {
        accept: self.swaggerRequestHeaders || 'application/json'
      },
      on: {
        error: function(response) {
          processedCalls += 1;
          var i;
          for(i = 0; i < opt.length; i++) {
            // fail all of these
            var resolved = host + '#' + opt[i];
            unresolvedRefs[resolved] = null;
          }
          if(processedCalls === expectedCalls)
            self.finish(spec, resolutionTable, resolvedRefs, unresolvedRefs, callback);
        },
        response: function(response) {
          var i, j, swagger = response.obj;
          processedCalls += 1;
          for(i = 0; i < opt.length; i++) {
            var path = opt[i];
            var parts = path.split('/');
            var location = swagger;
            for(j = 0; j < parts.length; j++) {
              var segment = parts[j];
              if(segment.length > 0) {
                location = location[segment];
              }
            }
            var resolved = host + '#' + path;
            var resolvedName = parts[j-1];
            if(typeof location !== 'undefined') {
              resolvedRefs[resolved] = {
                name: resolvedName,
                obj: location
              };
            }
            else {
              unresolvedRefs[resolved] = null;
            }
          }
          if(processedCalls === expectedCalls)
            self.finish(spec, resolutionTable, resolvedRefs, unresolvedRefs, callback);
        }
      }
    };
    authorizations.apply(obj);
    new SwaggerHttp().execute(obj);
  }
  if(Object.keys(opts).length === 0)
    callback.call(this.scope, spec, {});
};

Resolver.prototype.finish = function(spec, resolutionTable, resolvedRefs, unresolvedRefs, callback) {
  // walk resolution table and replace with resolved refs
  var ref;
  for(ref in resolutionTable) {
    var locations = resolutionTable[ref];
    var i;
    for(i = 0; i < locations.length; i++) {
      var resolvedTo = resolvedRefs[locations[i].$ref];
      if(resolvedTo) {
        if(!spec.definitions)
          spec.definitions = {};
        spec.definitions[resolvedTo.name] = resolvedTo.obj;
        locations[i].$ref = '#/definitions/' + resolvedTo.name;
      }
    }
  }
  callback.call(this.scope, spec, unresolvedRefs);
};

Resolver.prototype.resolveTo = function (property, objs) {
  var ref = property.$ref;
  if(ref) {
    if(ref.indexOf('http') === 0) {
      if(Array.isArray(objs[ref])) {
        objs[ref].push(property);
      }
      else {
        objs[ref] = [property];
      }
    }
  }
  else if(property.type === 'array') {
    var items = property.items;
    this.resolveTo(items, objs);
  }
};