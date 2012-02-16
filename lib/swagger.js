(function() {
  var Api, Operation, Resource,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Api = (function() {

    Api.prototype.discoveryUrl = "http://api.wordnik.com/v4/resources.json";

    Api.prototype.debug = false;

    Api.prototype.format = "json";

    Api.prototype.api_key = null;

    Api.prototype.basePath = null;

    function Api(options) {
      if (options == null) options = {};
      if (options.discoveryUrl != null) this.discoveryUrl = options.discoveryUrl;
      if (options.debug != null) this.debug = options.debug;
      if (options.format != null) this.format = options.format;
      if (options.apiKey != null) this.api_key = options.apiKey;
      if (options.api_key != null) this.api_key = options.api_key;
    }

    Api.prototype.build = function(callback) {
      var _this = this;
      return $.getJSON(this.discoveryUrl, function(response) {
        var resource;
        _this.basePath = response.basePath;
        return _this.resources = (function() {
          var _i, _len, _ref, _results;
          _ref = response.apis;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            resource = _ref[_i];
            _results.push(new Resource(resource.path, resource.description, this));
          }
          return _results;
        }).call(_this);
      });
    };

    Api.prototype.isReady = function() {
      var resource, _i, _len, _ref;
      if (this.resources == null) return false;
      if (!(this.resources.length > 0)) return false;
      _ref = this.resources;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        resource = _ref[_i];
        if (resource.ready == null) return false;
      }
      return true;
    };

    return Api;

  })();

  Resource = (function() {

    function Resource(path, description, api) {
      var _this = this;
      this.path = path;
      this.description = description;
      this.api = api;
      this.operations = [];
      $.getJSON(this.url(), function(response) {
        var endpoint, o, _i, _j, _len, _len2, _ref, _ref2;
        _this.basePath = response.basePath;
        if (response.apis) {
          _ref = response.apis;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            endpoint = _ref[_i];
            if (endpoint.operations) {
              _ref2 = endpoint.operations;
              for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                o = _ref2[_j];
                _this.operations.push(new Operation(o.nickname, o.path, o.httpMethod, o.parameters, o.summary, _this));
              }
            }
          }
        }
        _this.api[_this.name()] = _this;
        return _this.ready = true;
      });
    }

    Resource.prototype.url = function() {
      return this.api.basePath + this.path.replace('{format}', this.api.format);
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
      this.nickname = nickname;
      this.path = path;
      this.httpMethod = httpMethod;
      this.parameters = parameters;
      this.summary = summary;
      this.resource = resource;
      this.run = __bind(this.run, this);
      this.resource[this.nickname] = this;
    }

    Operation.prototype.run = function(args, callback) {
      return $.ajax({
        type: this.httpMethod,
        url: this.urlFor(args),
        dataType: this.resource.api.format,
        error: function(xhr, textStatus, error) {
          return console.log('ajax.error', error);
        },
        success: function(data) {
          return console.log('ajax.success', data);
        }
      });
    };

    Operation.prototype.urlFor = function(args) {
      var param, url, _i, _len, _ref;
      url = this.resource.basePath + this.path;
      _ref = this.parameters;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        param = _ref[_i];
        if (param.paramType === 'path' && args[param.name]) {
          url = url.replace("{" + param.name + "}", args[param.name]);
          delete args[param.name];
        }
      }
      args['api_key'] = this.resource.api.api_key;
      url += "?" + $.param(args);
      console.log("Request URL: " + url);
      return url;
    };

    return Operation;

  })();

  window.Api = Api;

  window.Resource = Resource;

  window.Operation = Operation;

}).call(this);
