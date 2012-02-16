(function() {
  var Operation, Resource, SwaggeringApi,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  SwaggeringApi = (function() {

    SwaggeringApi.prototype.discoveryUrl = "http://api.wordnik.com/v4/resources.json";

    SwaggeringApi.prototype.debug = false;

    SwaggeringApi.prototype.format = "json";

    SwaggeringApi.prototype.resources = [];

    SwaggeringApi.prototype.api_key = null;

    SwaggeringApi.prototype.basePath = null;

    function SwaggeringApi(options) {
      if (options == null) options = {};
      if (options.discoveryUrl != null) this.discoveryUrl = options.discoveryUrl;
      if (options.debug != null) this.debug = options.debug;
      if (options.format != null) this.format = options.format;
      if (options.apiKey != null) this.api_key = options.apiKey;
      if (options.api_key != null) this.api_key = options.api_key;
    }

    SwaggeringApi.prototype.log = function() {
      if (this.debug && window.console) {
        return console.log.apply(console, arguments);
      }
    };

    SwaggeringApi.prototype.build = function(callback) {
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

    return SwaggeringApi;

  })();

  Resource = (function() {
    var operations;

    operations = [];

    function Resource(path, description, api) {
      var _this = this;
      this.path = path;
      this.description = description;
      this.api = api;
      $.getJSON(this.descriptionUrl(), function(response) {
        var endpoint, o, _i, _len, _ref, _results;
        _this.basePath = response.basePath;
        if (response.apis) {
          _ref = response.apis;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            endpoint = _ref[_i];
            if (endpoint.operations) {
              _results.push(_this.operations = (function() {
                var _j, _len2, _ref2, _results2;
                _ref2 = endpoint.operations;
                _results2 = [];
                for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                  o = _ref2[_j];
                  _results2.push(new Operation(o.nickname, o.path, o.httpMethod, o.parameters, o.summary, this));
                }
                return _results2;
              }).call(_this));
            } else {
              _results.push(void 0);
            }
          }
          return _results;
        }
      });
    }

    Resource.prototype.descriptionUrl = function() {
      return this.api.basePath + this.path.replace('{format}', this.api.format);
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
    }

    Operation.prototype.argsToUrl = function(args) {
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

    Operation.prototype.run = function(args) {
      return $.ajax({
        type: this.httpMethod,
        url: this.argsToUrl(args),
        dataType: 'json',
        error: function(xhr, textStatus, error) {
          return console.log('ajax.error', error);
        },
        success: function(data) {
          return console.log('ajax.success', data);
        }
      });
    };

    return Operation;

  })();

  window.SwaggeringApi = SwaggeringApi;

  window.Resource = Resource;

  window.Operation = Operation;

}).call(this);
