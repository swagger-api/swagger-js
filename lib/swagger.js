(function() {
  var Api, Operation, Request, Resource,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Api = (function() {

    Api.prototype.discoveryUrl = "http://api.wordnik.com/v4/resources.json";

    Api.prototype.debug = false;

    Api.prototype.api_key = null;

    Api.prototype.basePath = null;

    function Api(options) {
      if (options == null) options = {};
      if (options.discoveryUrl != null) this.discoveryUrl = options.discoveryUrl;
      if (options.debug != null) this.debug = options.debug;
      if (options.apiKey != null) this.api_key = options.apiKey;
      if (options.api_key != null) this.api_key = options.api_key;
      if (options.verbose != null) this.verbose = options.verbose;
      if (options.success != null) this.success = options.success;
      if (options.success != null) this.build();
    }

    Api.prototype.build = function() {
      var _this = this;
      return $.getJSON(this.discoveryUrl, function(response) {
        var res, resource, _i, _len, _ref;
        _this.basePath = response.basePath;
        _this.basePath = _this.basePath.replace(/\/$/, '');
        _this.resources = {};
        _ref = response.apis;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          resource = _ref[_i];
          res = new Resource(resource.path, resource.description, _this);
          _this.resources[res.name()] = res;
        }
        return _this;
      });
    };

    Api.prototype.selfReflect = function() {
      var resource, resource_name, _ref;
      if (this.resources == null) return false;
      _ref = this.resources;
      for (resource_name in _ref) {
        resource = _ref[resource_name];
        if (resource.ready == null) return false;
      }
      this.ready = true;
      if (this.success != null) return this.success();
    };

    return Api;

  })();

  Resource = (function() {

    function Resource(path, description, api) {
      var _this = this;
      this.path = path;
      this.description = description;
      this.api = api;
      if (this.path == null) throw "Resources must have a path.";
      this.operations = {};
      $.getJSON(this.url(), function(response) {
        var endpoint, o, op, _i, _j, _len, _len2, _ref, _ref2;
        _this.basePath = response.basePath;
        _this.basePath = _this.basePath.replace(/\/$/, '');
        if (response.apis) {
          _ref = response.apis;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            endpoint = _ref[_i];
            if (endpoint.operations) {
              _ref2 = endpoint.operations;
              for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                o = _ref2[_j];
                op = new Operation(o.nickname, endpoint.path, o.httpMethod, o.parameters, o.summary, _this);
                _this.operations[op.nickname] = op;
              }
            }
          }
        }
        _this.api[_this.name()] = _this;
        _this.ready = true;
        return _this.api.selfReflect();
      });
    }

    Resource.prototype.url = function() {
      return this.api.basePath + this.path.replace('{format}', 'json');
    };

    Resource.prototype.name = function() {
      var parts;
      parts = this.path.split("/");
      return parts[parts.length - 1].replace('.{format}', '');
    };

    return Resource;

  })();

  Operation = (function() {

    function Operation(nickname, path, httpMethod, parameters, summary, resource) {
      var _this = this;
      this.nickname = nickname;
      this.path = path;
      this.httpMethod = httpMethod;
      this.parameters = parameters;
      this.summary = summary;
      this.resource = resource;
      this["do"] = __bind(this["do"], this);
      if (this.nickname == null) throw "Operations must have a nickname.";
      if (this.path == null) throw "Operation " + nickname + " is missing path.";
      if (this.httpMethod == null) {
        throw "Operation " + nickname + " is missing httpMethod.";
      }
      this.path = this.path.replace('{format}', 'json');
      this.resource[this.nickname] = function(args, callback) {
        return _this["do"](args, callback);
      };
    }

    Operation.prototype["do"] = function(args, callback) {
      var body, headers;
      if (args == null) args = {};
      if (callback == null) {
        callback = function(data) {
          return console.log(data);
        };
      }
      if (args.headers != null) {
        headers = args.headers;
        delete args.headers;
      }
      if (args.body != null) {
        body = args.body;
        delete args.body;
      }
      return new Request(this.httpMethod, this.urlify(args), headers, body, callback, this);
    };

    Operation.prototype.urlify = function(args) {
      var param, url, _i, _len, _ref;
      url = this.resource.basePath + this.path;
      url = url.replace('{format}', 'json');
      _ref = this.parameters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        param = _ref[_i];
        if (param.paramType === 'path') {
          if (args[param.name]) {
            url = url.replace("{" + param.name + "}", args[param.name]);
            delete args[param.name];
          } else {
            throw "" + param.name + " is a required path param.";
          }
        }
      }
      if (this.resource.api.api_key != null) {
        args['api_key'] = this.resource.api.api_key;
      }
      url += "?" + $.param(args);
      return url;
    };

    return Operation;

  })();

  Request = (function() {

    function Request(type, url, headers, body, callback, operation) {
      var _this = this;
      this.type = type;
      this.url = url;
      this.headers = headers;
      this.body = body;
      this.callback = callback;
      this.operation = operation;
      if (this.type == null) {
        throw "Request type is required (get/post/put/delete).";
      }
      if (this.url == null) throw "Request url is required.";
      if (this.callback == null) throw "Request callback is required.";
      if (this.operation == null) throw "Request operation is required.";
      if (this.operation.resource.api.verbose) console.log(this.asCurl());
      this.headers || (this.headers = {});
      if (this.operation.resource.api.api_key != null) {
        this.headers.api_key = this.operation.resource.api.api_key;
      }
      if (this.headers.mock == null) {
        $.ajax({
          type: this.type,
          url: this.url,
          data: this.body,
          dataType: 'json',
          error: function(xhr, textStatus, error) {
            return console.log(xhr, textStatus, error);
          },
          success: function(data) {
            return _this.callback(data);
          }
        });
      }
    }

    Request.prototype.asCurl = function() {
      var header_args, k, v;
      header_args = (function() {
        var _ref, _results;
        _ref = this.headers;
        _results = [];
        for (k in _ref) {
          v = _ref[k];
          _results.push("--header \"" + k + ": " + v + "\"");
        }
        return _results;
      }).call(this);
      return "curl " + (header_args.join(" ")) + " " + this.url;
    };

    return Request;

  })();

  window.Api = Api;

  window.Resource = Resource;

  window.Operation = Operation;

  window.Request = Request;

}).call(this);
