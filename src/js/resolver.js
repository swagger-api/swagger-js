/** 
 * Resolves a spec's remote references
 */
var Resolver = function (){};

Resolver.prototype.resolve = function(spec, callback, scope) {
  this.scope = (scope || this);
  var processedCalls = 0, resolvedRefs = {}, unresolvedRefs = {};

  // store objects for dereferencing
  var resolutionTable = {};

  // models
  _.forEach(spec.definitions, function(model){
    if (!model.properties) {
      model.properties = {};
    }
    if (model.allOf) {
      _.forEach(model.allOf, function(merge){
        if(merge.$ref){
          model.$ref = merge.$ref;
          this.resolveInline(spec, model, resolutionTable, unresolvedRefs);
        }else{
          _.forEach(merge.properties, function(property, propertyName){
            model.properties[propertyName] = property = merge.properties[propertyName];
            this.resolveTo(property, resolutionTable);
          }, this);
        }
      }, this);
    }else {
      _.forEach(model.properties, function(property){
        this.resolveTo(property, resolutionTable);
      }, this);
    }
  }, this);

  // operations
  _.forEach(spec.paths, function(path){
    _.forEach(path, function(operation){
      _.forEach(operation.parameters, function(parameter){
        if(parameter.in === 'body' && parameter.schema) {
          this.resolveTo(parameter.schema, resolutionTable);
        }
        if(parameter.$ref) {
          this.resolveInline(spec, parameter, resolutionTable, unresolvedRefs);
        }
      }, this);
      _.forEach(operation.responses, function(response){
        if(response.schema) {
          this.resolveTo(response.schema, resolutionTable);
        }
      }, this);
    }, this);
  }, this);
  // get hosts
  var opts = {}, expectedCalls = 0;
  _.forEach(resolutionTable, function(element, name){
    var parts = name.split('#');
    if(parts.length == 2) {
      var host = parts[0]; var path = parts[1];
      if(!_.isArray(opts[host])) {
        opts[host] = [];
        expectedCalls += 1;
      }
      opts[host].push(path);
    }
  });

  _.forEach(opts, function(opt, host){
    var self = this;

    var obj = {
      useJQuery: false,  // TODO
      url: host,
      method: "get",
      headers: {
        accept: this.scope.swaggerRequestHeaders || 'application/json'
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
            var location = swagger, path = opt[i], parts = path.split('/');
            for(j = 0; j < parts.length; j++) {
              var segment = parts[j];
              if(typeof location === 'undefined')
                break;
              if(segment.length > 0)
                location = location[segment];
            }
            var resolved = host + '#' + path, resolvedName = parts[j-1];
            if(typeof location !== 'undefined') {
              resolvedRefs[resolved] = {
                name: resolvedName,
                obj: location
              };
            }
            else unresolvedRefs[resolved] = null;
          }
          if(processedCalls === expectedCalls)
            self.finish(spec, resolutionTable, resolvedRefs, unresolvedRefs, callback);
        }
      }
    };
    authorizations.apply(obj);
    new SwaggerHttp().execute(obj);
  }, this);
  if(Object.keys(opts).length === 0)
    callback.call(this.scope, spec, unresolvedRefs);
};

Resolver.prototype.finish = function(spec, resolutionTable, resolvedRefs, unresolvedRefs, callback) {
  // walk resolution table and replace with resolved refs
  var ref;
  _.forEach(resolutionTable, function(locations, ref){
    for(var i = 0; i < locations.length; i++) {
      var resolvedTo = resolvedRefs[locations[i].obj.$ref];
      if(resolvedTo) {
        if(!spec.definitions)
          spec.definitions = {};
        if(locations[i].resolveAs === '$ref') {
          spec.definitions[resolvedTo.name] = resolvedTo.obj;
          locations[i].obj.$ref = '#/definitions/' + resolvedTo.name;
        }
        else if (locations[i].resolveAs === 'inline') {
          var targetObj = locations[i].obj;
          delete targetObj.$ref;
          _.forEach(resolvedTo.obj, function(element, key){
            targetObj[key] = element;
          });
        }
      }
    }
  });
  callback.call(this.scope, spec, unresolvedRefs);
};

/**
 * immediately in-lines local refs, queues remote refs
 * for inline resolution
 */
Resolver.prototype.resolveInline = function (spec, property, objs, unresolvedRefs) {
  var ref = property.$ref;
  if(ref) {
    if(ref.indexOf('http') === 0) {
      if(_.isArray(objs[ref])) {
        objs[ref].push({obj: property, resolveAs: 'inline'});
      }
      else {
        objs[ref] = [{obj: property, resolveAs: 'inline'}];
      }
    }
    else if (ref.indexOf('#') === 0) {
      // local resolve
      var shortenedRef = ref.substring(1);
      var i, parts = shortenedRef.split('/'), location = spec;
      for(i = 0; i < parts.length; i++) {
        var part = parts[i];
        if(part.length > 0) {
          location = location[part];
        }
      }
      if(location) {
        delete property.$ref;
        _.forEach(location, function(element, key){
          property[key] = element;
        });
      }
      else unresolvedRefs[ref] = null;
    }
  }
  else if(property.type === 'array') {
    this.resolveTo(property.items, objs);
  }
};

Resolver.prototype.resolveTo = function (property, objs) {
  var ref = property.$ref;
  if(ref) {
    if(ref.indexOf('http') === 0) {
      if(_.isArray(objs[ref])) {
        objs[ref].push({obj: property, resolveAs: '$ref'});
      }
      else {
        objs[ref] = [{obj: property, resolveAs: '$ref'}];
      }
    }
  }
  else if(property.type === 'array') {
    var items = property.items;
    this.resolveTo(items, objs);
  }
};
