'use strict';

var SwaggerHttp = require('./http');
var _ = {
  isObject: require('lodash-compat/lang/isObject'),
  cloneDeep: require('lodash-compat/lang/cloneDeep'),
  isArray: require('lodash-compat/lang/isArray'),
  isString: require('lodash-compat/lang/isString')
};


/**
 * Resolves a spec's remote references
 */
var Resolver = module.exports = function () {
  this.failedUrls = [];
  this.resolverCache = {};
  this.pendingUrls = {};
};

Resolver.prototype.processAllOf = function(root, name, definition, resolutionTable, unresolvedRefs, spec) {
  var i, location, property;

  definition['x-resolved-from'] = [ '#/definitions/' + name ];
  var allOf = definition.allOf;
  // the refs go first
  allOf.sort(function(a, b) {
    if(a.$ref && b.$ref) { return 0; }
    else if(a.$ref) { return -1; }
    else { return 1; }
  });
  for (i = 0; i < allOf.length; i++) {
    property = allOf[i];
    location = '/definitions/' + name + '/allOf';
    this.resolveInline(root, spec, property, resolutionTable, unresolvedRefs, location);
  }
};

Resolver.prototype.resolve = function (spec, arg1, arg2, arg3) {
  this.spec = spec;
  var root = arg1, callback = arg2, scope = arg3, opts = {}, location, i;
  if(typeof arg1 === 'function') {
    root = null;
    callback = arg1;
    scope = arg2;
  }
  var _root = root;
  this.scope = (scope || this);
  this.iteration = this.iteration || 0;

  if(this.scope.options && this.scope.options.requestInterceptor){
    opts.requestInterceptor = this.scope.options.requestInterceptor;
  }

  if(this.scope.options && this.scope.options.responseInterceptor){
    opts.responseInterceptor = this.scope.options.responseInterceptor;
  }

  var name, path, property, propertyName;
  var processedCalls = 0, resolvedRefs = {}, unresolvedRefs = {};
  var resolutionTable = []; // store objects for dereferencing

  spec.definitions = spec.definitions || {};
  // definitions
  for (name in spec.definitions) {
    var definition = spec.definitions[name];
    if(definition['$ref']) {
      this.resolveInline(root, spec, definition, resolutionTable, unresolvedRefs, definition);
    }
    else {
      for (propertyName in definition.properties) {
        property = definition.properties[propertyName];
        if (_.isArray(property.allOf)) {
          this.processAllOf(root, name, property, resolutionTable, unresolvedRefs, spec);
        }
        else {
          this.resolveTo(root, property, resolutionTable, '/definitions');
        }
      }

      if (definition.allOf) {
        this.processAllOf(root, name, definition, resolutionTable, unresolvedRefs, spec);
      }
    }
  }

  // shared parameters
  spec.parameters = spec.parameters || {};
  for(name in spec.parameters) {
    var parameter = spec.parameters[name];
    if (parameter.in === 'body' && parameter.schema) {
      if(_.isArray(parameter.schema.allOf)) {
        // move to a definition
        var modelName = 'inline_model';
        var name = modelName;
        var done = false; var counter = 0;
        while(!done) {
          if(typeof spec.definitions[name] === 'undefined') {
            done = true;
            break;
          }
          name = modelName + '_' + counter;
          counter ++;
        }
        spec.definitions[name] = { allOf: parameter.schema.allOf };
        delete parameter.schema.allOf;
        parameter.schema.$ref = '#/definitions/' + name;
        this.processAllOf(root, name, spec.definitions[name], resolutionTable, unresolvedRefs, spec);
      }
      else {
        this.resolveTo(root, parameter.schema, resolutionTable, location);
      }
    }

    if (parameter.$ref) {
      // parameter reference
      this.resolveInline(root, spec, parameter, resolutionTable, unresolvedRefs, parameter.$ref);
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
        var sharedParameters = path.parameters || [];
        var parameters = operation.parameters || [];

        for (i in sharedParameters) {
          var parameter = sharedParameters[i];
          parameters.unshift(parameter);
        }
        if(method !== 'parameters' && _.isObject(operation)) {
          operation.parameters = operation.parameters || parameters;
        }

        for (i in parameters) {
          var parameter = parameters[i];
          location = '/paths' + name + '/' + method + '/parameters';

          if (parameter.in === 'body' && parameter.schema) {
            if(_.isArray(parameter.schema.allOf)) {
              // move to a definition
              var modelName = 'inline_model';
              var name = modelName;
              var done = false; var counter = 0;
              while(!done) {
                if(typeof spec.definitions[name] === 'undefined') {
                  done = true;
                  break;
                }
                name = modelName + '_' + counter;
                counter ++;
              }
              spec.definitions[name] = { allOf: parameter.schema.allOf };
              delete parameter.schema.allOf;
              parameter.schema.$ref = '#/definitions/' + name;
              this.processAllOf(root, name, spec.definitions[name], resolutionTable, unresolvedRefs, spec);
            }
            else {
              this.resolveTo(root, parameter.schema, resolutionTable, location);
            }
          }

          if (parameter.$ref) {
            // parameter reference
            this.resolveInline(root, spec, parameter, resolutionTable, unresolvedRefs, parameter.$ref);
          }
        }

        for (responseCode in operation.responses) {
          var response = operation.responses[responseCode];
          location = '/paths' + name + '/' + method + '/responses/' + responseCode;

          if(_.isObject(response)) {
            if(response.$ref) {
              // response reference
              this.resolveInline(root, spec, response, resolutionTable, unresolvedRefs, location);
            }
            if (response.schema) {
              var responseObj = response;
              if(_.isArray(responseObj.schema.allOf)) {
                // move to a definition
                var modelName = 'inline_model';
                var name = modelName;
                var done = false; var counter = 0;
                while(!done) {
                  if(typeof spec.definitions[name] === 'undefined') {
                    done = true;
                    break;
                  }
                  name = modelName + '_' + counter;
                  counter ++;
                }
                spec.definitions[name] = { allOf: responseObj.schema.allOf };
                delete responseObj.schema.allOf;
                delete responseObj.schema.type;
                responseObj.schema.$ref = '#/definitions/' + name;
                this.processAllOf(root, name, spec.definitions[name], resolutionTable, unresolvedRefs, spec);
              }
              else if('array' === responseObj.schema.type) {
                if(responseObj.schema.items && responseObj.schema.items.$ref) {
                  // response reference
                  this.resolveInline(root, spec, responseObj.schema.items, resolutionTable, unresolvedRefs, location);
                }
              }
              else {
                this.resolveTo(root, response.schema, resolutionTable, location);
              }
            }
          }
        }
      }
    }
    // clear them out to avoid multiple resolutions
    path.parameters = [];
  }

  var expectedCalls = 0, toResolve = [];
  // if the root is same as obj[i].root we can resolve locally
  var all = resolutionTable;

  var parts;
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
          parts = a.key.split('#');
          if(parts.length === 2) {
            if(parts[0].indexOf('http:') === 0 || parts[0].indexOf('https:') === 0) {
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
          if(a.key && a.key.indexOf('#') === -1 && a.key.charAt(0) !== '/') {
            // handle relative schema
            parts = a.root.split('/');
            location = '';
            for(i = 0; i < parts.length - 1; i++) {
              location += parts[i] + '/';
            }
            location += a.key;
            a.root = location;
            a.location = '';
          }
          toResolve.push(a);
        }
      }
    }
    else {
      toResolve.push(a);
    }
  }
  expectedCalls = toResolve.length;

  // resolve anything that is local

  var lock = {};
  for(var ii = 0; ii < toResolve.length; ii++) {
    (function(item, spec, self, lock, ii) {
      if(!item.root || item.root === root) {
        // local resolve
        self.resolveItem(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, item);
        processedCalls += 1;

        if(processedCalls === expectedCalls) {
          self.finish(spec, root, resolutionTable, resolvedRefs, unresolvedRefs, callback, true);
        }
      }
      else if(self.failedUrls.indexOf(item.root) === -1) {
        var obj = {
          useJQuery: false,  // TODO
          url: item.root,
          method: 'get',
          headers: {
            accept: self.scope.swaggerRequestHeaders || 'application/json'
          },
          on: {
            error: function (error) {
              processedCalls += 1;
              console.log('failed url: ' + obj.url);
              self.failedUrls.push(obj.url);
              if (lock) {
                delete lock[item.root];
              }
              unresolvedRefs[item.key] = {
                root: item.root,
                location: item.location
              };

              if (processedCalls === expectedCalls) {
                self.finish(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
              }
            },  // jshint ignore:line
            response: function (response) {
              var swagger = response.obj;
              if (lock) {
                delete lock[item.root];
              }
              if (self.resolverCache) {
                self.resolverCache[item.root] = swagger;
              }
              self.resolveItem(swagger, item.root, resolutionTable, resolvedRefs, unresolvedRefs, item);
              processedCalls += 1;

              if (processedCalls === expectedCalls) {
                self.finish(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
              }
            }
          } // jshint ignore:line
        };

        // apply timeout only when specified
        if (scope && scope.fetchSpecTimeout) {
          obj.timeout = scope.fetchSpecTimeout;
        }

        if (scope && scope.clientAuthorizations) {
          scope.clientAuthorizations.apply(obj);
        }

        (function waitForUnlock() {
          setTimeout(function() {
            if (lock[obj.url]) {
              waitForUnlock();
            }
            else {
              var cached = self.resolverCache[obj.url];
              if (_.isObject(cached)) {
                obj.on.response({obj: cached}), 1;
              }
              else {
                lock[obj.url] = true;
                new SwaggerHttp().execute(obj, opts);
              }
            }
          }, 0);
        })();
      }

      else {
        processedCalls += 1;
        unresolvedRefs[item.key] = {
          root: item.root,
          location: item.location
        };
        if (processedCalls === expectedCalls) {
          self.finish(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
        }
      }
    }(toResolve[ii], spec, this, lock, ii));
  }

  if (Object.keys(toResolve).length === 0) {
    this.finish(spec, _root, resolutionTable, resolvedRefs, unresolvedRefs, callback);
  }
};

Resolver.prototype.resolveItem = function(spec, root, resolutionTable, resolvedRefs, unresolvedRefs, item) {
  var path = item.location;
  var location = spec, parts = path.split('/');
  if(path !== '') {
    for (var j = 0; j < parts.length; j++) {
      var segment = parts[j];
      if (segment.indexOf('~1') !== -1) {
        segment = parts[j].replace(/~0/g, '~').replace(/~1/g, '/');
        if (segment.charAt(0) !== '/') {
          segment = '/' + segment;
        }
      }
      if (typeof location === 'undefined' || location === null) {
        break;
      }
      if (segment === '' && j === (parts.length - 1) && parts.length > 1) {
        location = null;
        break;
      }
      if (segment.length > 0) {
        location = location[segment];
      }
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

Resolver.prototype.finish = function (spec, root, resolutionTable, resolvedRefs, unresolvedRefs, callback, localResolve) {
  // walk resolution table and replace with resolved refs
  var ref;
  for (ref in resolutionTable) {
    var item = resolutionTable[ref];

    var key = item.key;
    var resolvedTo = resolvedRefs[key];
    if (resolvedTo) {
      spec.definitions = spec.definitions || {};
      if (item.resolveAs === 'ref') {
        if (localResolve !== true) {
          // don't retain root for local definitions
          for (key in resolvedTo.obj) {
            var abs = this.retainRoot(key, resolvedTo.obj[key], item.root);
            resolvedTo.obj[key] = abs;
          }
        }
        spec.definitions[resolvedTo.name] = resolvedTo.obj;
        item.obj.$ref = '#/definitions/' + resolvedTo.name;
      } else if (item.resolveAs === 'inline') {
        var targetObj = item.obj;
        targetObj['x-resolved-from'] = [ item.key ];
        delete targetObj.$ref;

        for (key in resolvedTo.obj) {
          var abs = resolvedTo.obj[key];

          if (localResolve !== true) {
            // don't retain root for local definitions
            abs = this.retainRoot(key, resolvedTo.obj[key], item.root);
          }
          targetObj[key] = abs;
        }
      }
    }
  }
  var existingUnresolved = this.countUnresolvedRefs(spec);

  if(existingUnresolved === 0 || this.iteration > 5) {
    this.resolveAllOf(spec.definitions);
    this.resolverCache = null;
    callback.call(this.scope, spec, unresolvedRefs);
  }
  else {
    this.iteration += 1;
    this.resolve(spec, root, callback, this.scope);
  }
};

Resolver.prototype.countUnresolvedRefs = function(spec) {
  var i;
  var refs = this.getRefs(spec);
  var keys = [];
  var unresolvedKeys = [];
  for(i in refs) {
    if(i.indexOf('#') === 0) {
      keys.push(i.substring(1));
    }
    else {
      unresolvedKeys.push(i);
    }
  }

  // verify possible keys
  for (i = 0; i < keys.length; i++) {
    var part = keys[i];
    var parts = part.split('/');
    var obj = spec;

    for (var k = 0; k < parts.length; k++) {
      var key = parts[k];
      if(key !== '') {
        obj = obj[key];
        if(typeof obj === 'undefined') {
          unresolvedKeys.push(part);
          break;
        }
      }
    }
  }
  return unresolvedKeys.length;
};

Resolver.prototype.getRefs = function(spec, obj) {
  obj = obj || spec;
  var output = {};
  for(var key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    var item = obj[key];
    if(key === '$ref' && typeof item === 'string') {
      output[item] = null;
    }
    else if(_.isObject(item)) {
      var o = this.getRefs(item);
      for(var k in o) {
        output[k] = null;
      }
    }
  }
  return output;
};

function splitUrl(url) {
  var result = {};
  var proto = /[a-z]+:\/\//i.exec(url);
  if (proto) {
    result.proto = proto[0].slice(0, -3);
    url = url.slice(result.proto.length + 1);
  }
  if (url.slice(0, 2) === '//') {
    result.domain = url.slice(2).split('/')[0];
    url = url.slice(2 + result.domain.length);
  }
  var p = url.split('#');
  if (p[0].length) {
    result.path = p[0];
  }
  if (p.length > 1) {
    result.fragment = p.slice(1).join('#');
  }
  return result;
}

function unsplitUrl(url) {
  var result = url.path;
  if (result === undefined) {
    result = '';
  }
  if (url.fragment !== undefined) {
    result += '#' + url.fragment;
  }
  if (url.domain !== undefined) {
    if (result.slice(0, 1) === '/') {
      result = result.slice(1);
    }
    result = '//' + url.domain + '/' + result;
    if (url.proto !== undefined) {
      result = url.proto + ':' + result;
    }
  }
  return result;
}

function joinUrl(base, rel) {
  var relsp = splitUrl(rel);
  if (relsp.domain !== undefined) {
    return rel;
  }
  var result = splitUrl(base);
  if (relsp.path === undefined) {
    // change only fragment part
    result.fragment = relsp.fragment;
  } else if (relsp.path.slice(0, 1) === '/') {
    // relative to domain
    result.path = relsp.path;
    result.fragment = relsp.fragment;
  } else {
    // relative to path
    var path = result.path === undefined ? [] : result.path.split('/');
    var relpath = relsp.path.split('/');
    if (path.length) {
      path.pop();
    }
    while (relpath[0] === '..' || relpath[0] === '.') {
      if (relpath[0] === '..') {
        path.pop();
      }
      relpath.shift();
    }
    result.path = path.concat(relpath).join('/');
    result.fragment = relsp.fragment;
  }
  return unsplitUrl(result);
}

Resolver.prototype.retainRoot = function(origKey, obj, root) {
  // walk object and look for relative $refs
  if(_.isObject(obj)) {
    for(var key in obj) {
      var item = obj[key];
      if (key === '$ref' && typeof item === 'string') {
        obj[key] = joinUrl(root, item);
      }
      else if (_.isObject(item)) {
        this.retainRoot(key, item, root);
      }
    }
  }
  else if(_.isString(obj) && origKey === '$ref') {
    obj = joinUrl(root, obj);
  }
  return obj;
};

/**
 * immediately in-lines local refs, queues remote refs
 * for inline resolution
 */
Resolver.prototype.resolveInline = function (root, spec, property, resolutionTable, unresolvedRefs, location) {
  var key = property.$ref, ref = property.$ref, i, p, p2, rs;
  var rootTrimmed = false;

  root = root || '' // Guard against .split. @fehguy, you'll need to check if this logic fits
  // More imporantly is how do we gracefully handle relative urls, when provided just a 'spec', not a 'url' ?

  if (ref) {
    if(ref.indexOf('../') === 0) {
      // reset root
      p = ref.split('../');
      p2 = root.split('/');
      ref = '';
      for(i = 0; i < p.length; i++) {
        if(p[i] === '') {
          p2 = p2.slice(0, p2.length-1);
        }
        else {
          ref += p[i];
        }
      }
      root = '';
      for(i = 0; i < p2.length - 1; i++) {
        if(i > 0) { root += '/'; }
        root += p2[i];
      }
      rootTrimmed = true;
    }
    if(ref.indexOf('#') >= 0) {
      if(ref.indexOf('/') === 0) {
        rs = ref.split('#');
        p  = root.split('//');
        p2 = p[1].split('/');
        root = p[0] + '//' + p2[0] + rs[0];
        location = rs[1];
      }
      else {
        rs = ref.split('#');
        if(rs[0] !== '') {
          p2 = root.split('/');
          p2 = p2.slice(0, p2.length - 1);
          if(!rootTrimmed) {
            root = '';
            for (var k = 0; k < p2.length; k++) {
              if(k > 0) { root += '/'; }
              root += p2[k];
            }
          }
          root += '/' + ref.split('#')[0];
        }
        location = rs[1];
      }
    }
    if (ref.indexOf('http:') === 0 || ref.indexOf('https:') === 0) {
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
    } else if (ref.indexOf('/') === 0 && ref.indexOf('#') === -1) {
      location = ref;
      var matches = root.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      if(matches) {
        root = matches[0] + ref.substring(1);
        location = '';
      }
      resolutionTable.push({obj: property, resolveAs: 'inline', root: root, key: key, location: location});
    }
    else {
      resolutionTable.push({obj: property, resolveAs: 'inline', root: root, key: key, location: location});
    }
  }
  else if (property.type === 'array') {
    this.resolveTo(root, property.items, resolutionTable, location);
  }
};

Resolver.prototype.resolveTo = function (root, property, resolutionTable, location) {
  var sp, i;
  var ref = property.$ref;
  var lroot = root;
  if ((typeof ref !== 'undefined') && (ref !== null)) {
    if(ref.indexOf('#') >= 0) {
      var parts = ref.split('#');

      // #/definitions/foo
      // foo.json#/bar
      if(parts[0] && ref.indexOf('/') === 0) {

      }
      else if(parts[0] && (parts[0].indexOf('http:') === 0 || parts[0].indexOf('https:') === 0)) {
        lroot = parts[0];
        ref = parts[1];
      }
      else if(parts[0] && parts[0].length > 0) {
        // relative file
        sp = root.split('/');
        lroot = '';
        for(i = 0; i < sp.length - 1; i++) {
          lroot += sp[i] + '/';
        }
        lroot += parts[0];
      }
      else {

      }

      location = parts[1];
    }
    else if (ref.indexOf('http:') === 0 || ref.indexOf('https:') === 0) {
      lroot = ref;
      location = '';
    }
    else {
      // relative file
      sp = root.split('/');
      lroot = '';
      for(i = 0; i < sp.length - 1; i++) {
        lroot += sp[i] + '/';
      }
      lroot += ref;
      location = '';
    }
    resolutionTable.push({
      obj: property, resolveAs: 'ref', root: lroot, key: ref, location: location
    });
  } else if (property.type === 'array') {
    var items = property.items;
    this.resolveTo(root, items, resolutionTable, location);
  } else {
    if(property && (property.properties || property.additionalProperties)) {
      var name = this.uniqueName('inline_model');
      if (property.title) {
        name = this.uniqueName(property.title);
      }
      delete property.title;
      this.spec.definitions[name] = _.cloneDeep(property);
      property['$ref'] = '#/definitions/' + name;
      delete property.type;
      delete property.properties;
    }
  }
};

Resolver.prototype.uniqueName = function(base) {
  var name = base;
  var count = 0;
  while(true) {
    if(!_.isObject(this.spec.definitions[name])) {
      return name;
    }
    name = base + '_' + count;
    count++;
  }
};

Resolver.prototype.resolveAllOf = function(spec, obj, depth) {
  depth = depth || 0;
  obj = obj || spec;
  var name;
  for(var key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    var item = obj[key];
    if(item === null) {
      throw new TypeError('Swagger 2.0 does not support null types (' + obj + ').  See https://github.com/swagger-api/swagger-spec/issues/229.');
    }
    if(typeof item === 'object') {
      this.resolveAllOf(spec, item, depth + 1);
    }
    if(item && typeof item.allOf !== 'undefined') {
      var allOf = item.allOf;
      if(_.isArray(allOf)) {
        var output = _.cloneDeep(item);
        delete output.allOf;

        output['x-composed'] = true;
        if (typeof item['x-resolved-from'] !== 'undefined') {
          output['x-resolved-from'] = item['x-resolved-from'];
        }

        for(var i = 0; i < allOf.length; i++) {
          var component = allOf[i];
          var source = 'self';
          if(typeof component['x-resolved-from'] !== 'undefined') {
            source = component['x-resolved-from'][0];
          }

          for(var part in component) {
            if(!output.hasOwnProperty(part)) {
              output[part] = _.cloneDeep(component[part]);
              if(part === 'properties') {
                for(name in output[part]) {
                  output[part][name]['x-resolved-from'] = source;
                }
              }
            }
            else {
              if(part === 'properties') {
                var properties = component[part];
                for(name in properties) {
                  output.properties[name] = _.cloneDeep(properties[name]);
                  var resolvedFrom = properties[name]['x-resolved-from'];
                  if (typeof resolvedFrom === 'undefined' || resolvedFrom === 'self') {
                    resolvedFrom = source;
                  }
                  output.properties[name]['x-resolved-from'] = resolvedFrom;
                }
              }
              else if(part === 'required') {
                // merge & dedup the required array
                var a = output.required.concat(component[part]);
                for(var k = 0; k < a.length; ++k) {
                  for(var j = k + 1; j < a.length; ++j) {
                    if(a[k] === a[j]) { a.splice(j--, 1); }
                  }
                }
                output.required = a;
              }
              else if(part === 'x-resolved-from') {
                output['x-resolved-from'].push(source);
              }
              else {
                // TODO: need to merge this property
                // console.log('what to do with ' + part)
              }
            }
          }
        }
        obj[key] = output;
      }
    }
  }
};
