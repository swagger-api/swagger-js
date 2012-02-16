(function() {
  var Operation, Resource, SwaggeringApi;

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

    SwaggeringApi.prototype.isReady = function() {
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
        var endpoint, o, _i, _len, _ref;
        _this.basePath = response.basePath;
        if (response.apis) {
          _ref = response.apis;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            endpoint = _ref[_i];
            if (endpoint.operations) {
              _this.operations = (function() {
                var _j, _len2, _ref2, _results;
                _ref2 = endpoint.operations;
                _results = [];
                for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                  o = _ref2[_j];
                  _results.push(new Operation(o.nickname, o.path, o.httpMethod, o.parameters, o.summary, this));
                }
                return _results;
              }).call(_this);
            }
          }
        }
        return _this.ready = true;
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
    }

    return Operation;

  })();

  window.SwaggeringApi = SwaggeringApi;

  window.Resource = Resource;

  window.Operation = Operation;

}).call(this);
