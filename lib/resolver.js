'use strict';

var SwaggerHttp = require('./http');

/** 
 * Resolves a spec's remote references
 */
var Resolver = module.exports = function () {};

Resolver.prototype.resolve = function (spec, arg1, arg2, arg3) {
  var root = arg1, callback = arg2, scope = arg3, location, i;
  if(typeof arg1 === 'function') {
    root = null;
    callback = arg1;
    scope = arg2;
  }
  var _root = root;
  this.scope = (scope || this);
  this.iteration = this.iteration || 0;

  var name, path, property, propertyName;
  var processedCalls = 0, resolvedRefs = {}, unresolvedRefs = {};
  var resolutionTable = []; // store objects for dereferencing

  // definitions
  for (name in spec.definitions) {
    var definition = spec.definitions[name];
    for (propertyName in definition.properties) {
      property = definition.properties[propertyName];
      this.resolveTo(root, property, resolutionTable, '/definitions');
    }
  }

  // operations
  for (name in spec.paths) {
    var method, operation, responseCode;
    path = spec.paths[name];

    for (method in path) {
      // operation reference
      if(method === '$ref') {
        // location = path[method];
        location = '/paths' + name;
        this.resolveInline(root, spec, path, resolutionTable, unresolvedRefs, location);
      }
      else {
        operation = path[method];

        var parameters = operation.parameters;
        for (i in parameters) {
          var parameter = parameters[i];
          location = '/paths' + name + '/' + method + '/parameters';

          if (parameter.in === 'body' && parameter.schema) {
            this.resolveTo(root, parameter.schema, resolutionTable, location);
          }

          if (parameter.$ref) {
            // parameter reference
            this.resolveInline(root, spec, parameter, resolutionTable, unresolvedRefs, parameter.$ref);
          }
        }

        for (responseCode in operation.responses) {
          var response = operation.responses[responseCode];
          location = location = '/paths' + name + '/' + method + '/responses/' + responseCode;
          if(typeof response === 'object') {
            if(response.$ref) {
              // response reference
              this.resolveInline(root, spec, response, resolutionTable, unresolvedRefs, location);
            }
          }
          if (response.schema && response.schema.$ref) {
            this.resolveTo(root, response.schema, resolutionTable, location);
          }
        }
      }
    }
  }

  var expectedCalls = 0, toResolve = [];
  // if the root is same as obj[i].root we can resolve locally
  var all = resolutionTable;
  for(i = 0; i < all.length; i++) {
    var a = all[i];
    if(root === a.root) {
      if(a.resolveAs === 'ref') {
        // resolve any path walking
        var joined = ((a.root || '') + '/' + a.key).split('/');
        var normalized = [];
        var url = '';
        var k;

        if(a.key.indexOf('../') >= 0) {
          for(var j = 0; j < joined.length; j++) {
            if(joined[j] === '..') {
              normalized = normalized.slice(0, normalized.length-1);
            }
            else {
              normalized.push(joined[j]);
            }
          }
          for(k = 0; k < normalized.length; k ++) {
            if(k > 0) {
              url += '/';
            }
            url += normalized[k];
          }
          // we now have to remote resolve this because the path has changed
          a.root = url;
          toResolve.push(a);
        }
        else {
          var parts = a.key.split('#');
          if(parts.length === 2) {
            if(parts[0].indexOf('http://') === 0 || parts[0].indexOf('https://') === 0) {
              a.root = parts[0];
            }
            location = parts[1].split('/');
            var r;
            var s = spec;
            for(k = 0; k < location.length; k++) {
              var part = location[k];
              if(part !== '') {
                s = s[part];
                if(typeof s !== 'undefined') {
                  r = s;
                }
                else {
                  r = null;
                  break;
                }
              }
            }
            if(r === null) {
              // must resolve this too
              toResolve.push(a);
            }
          }
        }
      }
      else {
        if (a.resolveAs === 'inline') {
          toResolve.push(a);
        }
      }
    }
    else {
      toResolve.push(a);
    }
  }
  expectedCalls = toResolve.length;
  var ii = 0;
  // resolve anything that is local
  for(ii = 0; ii < toResolve.length; ii++) {
    var item = toResolve[ii];
    var self = this;

    if(item.root === null) {
      // local resolve
      self.resolveItem(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, item);
      processedCalls += 1;

      if(processedCalls === expectedCalls) {
        this.finish(spec, root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
      }
    }
    else {
      var obj = {
        useJQuery: false,  // TODO
        url: item.root,
        method: 'get',
        headers: {
          accept: this.scope.swaggerRequestHeaders || 'application/json'
        },
        on: {
          error: function () {
            processedCalls += 1;
            unresolvedRefs[item.key] = null;

            if (processedCalls === expectedCalls) {
              self.finish(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
            }
          },  // jshint ignore:line
          response: function (response) {

            var swagger = response.obj;
            if(swagger === null || Object.keys(swagger).length === 0) {
              try {
                swagger = JSON.parse(response.data);
              }
              catch (e){
                swagger = {};
              }
            }
            self.resolveItem(swagger, _root, resolutionTable, resolvedRefs, unresolvedRefs, item);
            processedCalls += 1;

            if (processedCalls === expectedCalls) {
              self.finish(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
            }
          }
        } // jshint ignore:line
      };

      if (scope && scope.clientAuthorizations) {
        scope.clientAuthorizations.apply(obj);
      }
      new SwaggerHttp().execute(obj);
    }
  }

  if (Object.keys(toResolve).length === 0) {
    callback.call(this.scope, spec, unresolvedRefs);
  }
};

Resolver.prototype.resolveItem = function(spec, root, resolutionTable, resolvedRefs, unresolvedRefs, item) {
  var path = item.location;
  var location = spec, parts = path.split('/');
  for (var j = 0; j < parts.length; j++) {
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
    if(segment === '' && j === (parts.length - 1)  && parts.length > 1) {
      location = null;
      break;
    }
    if (segment.length > 0) {
      location = location[segment];
    }
  }
  var resolved = item.key;
  parts = item.key.split('/');
  var resolvedName = parts[parts.length-1];

  if(resolvedName.indexOf('#') >= 0) {
    resolvedName = resolvedName.split('#')[1];
  }

  if (location !== null && typeof location !== 'undefined') {
    resolvedRefs[resolved] = {
      name: resolvedName,
      obj: location,
      key: item.key,
      root: item.root
    };
  } else {
    unresolvedRefs[resolved] = {
      root: item.root,
      location: item.location
    };
  }
};

Resolver.prototype.finish = function (spec, root, resolutionTable, resolvedRefs, unresolvedRefs, callback) {
  // walk resolution table and replace with resolved refs
  var ref;
  for (ref in resolutionTable) {
    var item = resolutionTable[ref];

    var key = item.key;
    var resolvedTo = resolvedRefs[key];
    if (resolvedTo) {
      spec.definitions = spec.definitions || {};
      if (item.resolveAs === 'ref') {
        spec.definitions[resolvedTo.name] = resolvedTo.obj;
        item.obj.$ref = '#/definitions/' + resolvedTo.name;
      } else if (item.resolveAs === 'inline') {
        var targetObj = item.obj;
        delete targetObj.$ref;

        for (key in resolvedTo.obj) {
          var abs = this.retainRoot(resolvedTo.obj[key], item.root);
          targetObj[key] = abs;
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

Resolver.prototype.retainRoot = function(obj, root) {
  // walk object and look for relative $refs
  for(var key in obj) {
    var item = obj[key];
    if(key === '$ref' && typeof item === 'string') {
      // stop and inspect
      if(item.indexOf('http://') !== 0 && item.indexOf('https://') !== 0) {
        if(item.indexOf('#') !== 0) {
          item = '#' + item;
        }
        item = (root || '') + item;
        obj[key] = item;
      }
    }
    else if(typeof item === 'object') {
      this.retainRoot(item, root);
    }
  }
  return obj;
};

Resolver.prototype.countRefs = function(obj, count) {
  count = count || 0;
  // walk object and look for relative $refs
  for(var key in obj) {
    var item = obj[key];
    if(key === '$ref' && typeof item === 'string') {
      count += 1;
    }
    else if(typeof item === 'object') {
      count += this.countRefs(item);
    }
  }
  return count;
};

/**
 * immediately in-lines local refs, queues remote refs
 * for inline resolution
 */
Resolver.prototype.resolveInline = function (root, spec, property, resolutionTable, unresolvedRefs, location) {
  var key = property.$ref;
  var ref = property.$ref;
  var rootTrimmed = false;
  if (ref) {
    if(ref.indexOf('../') === 0) {
      // reset root
      var p = ref.split('../');
      var rp = root.split('/');
      ref = '';
      for(var i = 0; i < p.length; i++) {
        if(p[i] === '') {
          rp = rp.slice(0, rp.length-1);
        }
        else {
          ref += p[i];
        }
      }
      root = '';
      for(var i = 0; i < rp.length - 1; i++) {
        if(i > 0) { root += '/'; }
        root += rp[i];
      }
      rootTrimmed = true;
    }
    if(ref.indexOf('#') >= 0) {
      if(ref.indexOf('/') === 0) {
        var rs =  ref.split('#');
        var p  = root.split('//');
        var p2 = p[1].split('/');
        root = p[0] + '//' + p2[0] + rs[0];
        location = rs[1];
      }
      else {
        var rs = ref.split('#');
        if(rs[0] !== '') {
          var rp = root.split('/');
          rp = rp.slice(0, rp.length - 1);
          if(!rootTrimmed) {
            root = '';
            for (var k = 0; k < rp.length; k++) {
              if(k > 0) { root += '/'; }
              root += rp[k];
            }
          }
          root += '/' + ref.split('#')[0];
        }
        location = rs[1];
      }
    }
    if (ref.indexOf('http') === 0) {
      if(ref.indexOf('#') >= 0) {
        root = ref.split('#')[0];
        location = ref.split('#')[1];
      }
      else {
        root = ref;
        location = '';
      }
      resolutionTable.push({obj: property, resolveAs: 'inline', root: root, key: key, location: location});
    } else if (ref.indexOf('#') === 0) {
      location = ref.split('#')[1];
      resolutionTable.push({obj: property, resolveAs: 'inline', root: root, key: key, location: location});
    }
    else {
      resolutionTable.push({obj: property, resolveAs: 'inline', root: root, key: key, location: location});
    }
  } else if (property.type === 'array') {
    this.resolveTo(root, property.items, resolutionTable, location);
  }
};

Resolver.prototype.resolveTo = function (root, property, resolutionTable, location) {
  var ref = property.$ref;

  if (ref) {
    if(ref.indexOf('#') >= 0) {
      location = ref.split('#')[1];
    }
    resolutionTable.push({
      obj: property, resolveAs: 'ref', root: root, key: ref, location: location
    });
  } else if (property.type === 'array') {
    var items = property.items;
    this.resolveTo(root, items, resolutionTable, location);
  }
};
