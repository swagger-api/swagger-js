'use strict';

var _ = {
  isPlainObject: require('lodash-compat/lang/isPlainObject'),
  isString: require('lodash-compat/lang/isString'),
  isUndefined: require('lodash-compat/lang/isUndefined')
};
var ArrayModel = require('./arrayModel');
var helpers = require('../helpers');

var Property = module.exports = function (name, obj, required, models) {
  this.models = models;
  this.schema = obj;
  this.required = required;

  if (obj.$ref) {
    this.$ref = helpers.simpleRef(obj.$ref);
  } else if (obj.type === 'array' && obj.items) {
    if (obj.items.$ref) {
      this.$ref = helpers.simpleRef(obj.items.$ref);
    } else {
      obj = obj.items;
    }
  }

  this.name = name;
  this.description = obj.description;
  this.obj = obj;
  this.optional = true;
  this.optional = !required;
  this.default = obj.default || null;
  this.example = obj.example !== undefined ? obj.example : null;
  this.collectionFormat = obj.collectionFormat || null;
  this.maximum = obj.maximum || null;
  this.exclusiveMaximum = obj.exclusiveMaximum || null;
  this.minimum = obj.minimum || null;
  this.exclusiveMinimum = obj.exclusiveMinimum || null;
  this.maxLength = obj.maxLength || null;
  this.minLength = obj.minLength || null;
  this.pattern = obj.pattern || null;
  this.maxItems = obj.maxItems || null;
  this.minItems = obj.minItems || null;
  this.uniqueItems = obj.uniqueItems || null;
  this['enum'] = obj['enum'] || null;
  this.multipleOf = obj.multipleOf || null;
};

var Model = module.exports = function (name, definition, models) {
  this.models = models || {};
  this.name = name;
  this.definition = definition || {};
  this.properties = [];

  if (definition.type === 'array') {
    return new ArrayModel(definition, models);
  }

  var requiredFields = definition.required || [];
  var key;
  var props = definition.properties;

  if (props) {
    for (key in props) {
      var required = false;
      var property = props[key];

      if (requiredFields.indexOf(key) >= 0) {
        required = true;
      }

      this.properties.push(new Property(key, property, required, this.models));
    }
  }

  return this;
};

Model.prototype.createJSONSample = function (modelsToIgnore) {
  var i, result = {}, representations = {};
  var example = this.examples && this.examples['application/json'] ? this.examples['application/json'] : undefined;

  if (!_.isUndefined(example)) {
    if (_.isPlainObject(example)) {
      result = example;
    } else if (_.isString(example)) {
      result = JSON.parse(this.examples['application/json']);
    } else {
      example = undefined;
    }
  }

  if (_.isUndefined(example)) {
    modelsToIgnore = (modelsToIgnore||{});
    modelsToIgnore[this.name] = this;

    for (i = 0; i < this.properties.length; i++) {
      var prop = this.properties[i];

      var sample = prop.getSampleValue(modelsToIgnore, representations);

      result[prop.name] = sample;
    }

    delete modelsToIgnore[this.name];
  }

  return result;
};

Model.prototype.getSampleValue = function (modelsToIgnore) {
  var i, obj = {}, representations = {};

  for (i = 0; i < this.properties.length; i++ ) {
    var property = this.properties[i];

    obj[property.name] = property.sampleValue(false, modelsToIgnore, representations);
  }

  return obj;
};

Model.prototype.getMockSignature = function (modelsToIgnore) {
  var i, prop, propertiesStr = [];

  for (i = 0; i < this.properties.length; i++) {
    prop = this.properties[i];
    propertiesStr.push(prop.toString());
  }

  var strong = '<span class="strong">';
  var strongClose = '</span>';
  var classOpen = strong + this.name + ' {' + strongClose;
  var classClose = strong + '}' + strongClose;
  var returnVal = classOpen + '<div>' + propertiesStr.join(',</div><div>') + '</div>' + classClose;

  if (!modelsToIgnore) {
    modelsToIgnore = {};
  }

  modelsToIgnore[this.name] = this;

  for (i = 0; i < this.properties.length; i++) {
    prop = this.properties[i];

    var ref = prop.$ref;
    var model = this.models[ref];

    if (model && typeof modelsToIgnore[model.name] === 'undefined') {
      returnVal = returnVal + ('<br>' + model.getMockSignature(modelsToIgnore));
    }
  }

  return returnVal;
};

Property.prototype.getSampleValue = function (modelsToIgnore, representations) {
  return this.sampleValue(false, modelsToIgnore, representations);
};

Property.prototype.isArray = function () {
  var schema = this.schema;

  if (schema.type === 'array') {
    return true;
  } else {
    return false;
  }
};

Property.prototype.sampleValue = function (isArray, ignoredModels, representations) {
  isArray = (isArray || this.isArray());
  ignoredModels = (ignoredModels || {});
  // representations = (representations || {});

  var self = this;
  var getRefValue = function (ref) {
    var refModelName = helpers.simpleRef(ref);
    var refModel = self.models[refModelName];
    var output;

    if (typeof representations[type] !== 'undefined') {
      output = representations[type];
    }

    if (refModel && typeof ignoredModels[type] === 'undefined') {
      ignoredModels[type] = this;
      output = refModel.getSampleValue(ignoredModels, representations);
      representations[type] = output;
    } else {
      output = (representations[type] || refModelName);
    }

    return output;
  };

  var type = helpers.getStringSignature(this.obj, true);
  var output;

  if (this.$ref) {
    output = getRefValue(this.$ref);
  } else if (this.example) {
    output = this.example;
  } else if (this.default) {
    output = this.default;
  } else if (type === 'date-time') {
    output = new Date().toISOString();
  } else if (type === 'date') {
    output = new Date().toISOString().split('T')[0];
  } else if (type === 'string') {
    output = 'string';
  } else if (type === 'integer') {
    output = 0;
  } else if (type === 'long') {
    output = 0;
  } else if (type === 'float') {
    output = 0.0;
  } else if (type === 'double') {
    output = 0.0;
  } else if (type === 'boolean') {
    output = true;
  } else if (this.schema.$ref) {
    output = getRefValue(this.schema.$ref);
  } else if (this.schema.properties) {
    output = new Model('InlineModel-' + new Date(), this.schema, this.models).getSampleValue();
  } else {
    output = {};
  }

  ignoredModels[type] = output;

  if (isArray) {
    return [output];
  } else {
    return output;
  }
};

Property.prototype.toString = function () {
  var str = helpers.getStringSignature(this.obj);
  var strong ='<span class="strong">';
  var strongClose = '</span>';
  var propertiesStr = [];
  var prop;

  if (str === 'object') {
    for (var name in this.schema.properties) {
      if (this.schema.properties.hasOwnProperty(name)) {
        prop = new Property(name, this.schema.properties[name], (this.schema.required || []).indexOf(name) > -1, this.models);

        propertiesStr.push(prop.toString());
      }
    }

    str = strong + this.name + ' {' + strongClose + '<div>' + propertiesStr.join(',</div><div>') + '</div>' + strong + '}' + strongClose;
  } else if (str !== '') {
    str = '<span class="propName ' + this.required + '">' + this.name + '</span> (<span class="propType">' + str + '</span>';

    if (!this.required) {
      str += ', <span class="propOptKey">optional</span>';
    }

    str += ')';
  } else {
    str = this.name + ' (' + JSON.stringify(this.obj) + ')';
  }

  if (typeof this.description !== 'undefined') {
    str += ': ' + this.description;
  }

  if (this['enum']) {
    str += ' = <span class="propVals">[\'' + this['enum'].join('\' or \'') + '\']</span>';
  }

  if (this.descr) {
    str += ': <span class="propDesc">' + this.descr + '</span>';
  }

  var options = '';
  var isArray = this.schema.type === 'array';
  var type;

  if (isArray) {
    if (this.schema.items) {
      type = this.schema.items.type;
    } else {
      type = '';
    }
  } else {
    type = this.schema.type;
  }

  if (this.default) {
    options += helpers.optionHtml('Default', this.default);
  }

  switch (type) {
  case 'string':
    if (this.minLength) {
      options += helpers.optionHtml('Min. Length', this.minLength);
    }

    if (this.maxLength) {
      options += helpers.optionHtml('Max. Length', this.maxLength);
    }

    if (this.pattern) {
      options += helpers.optionHtml('Reg. Exp.', this.pattern);
    }
    break;
  case 'integer':
  case 'number':
    if (this.minimum) {
      options += helpers.optionHtml('Min. Value', this.minimum);
    }

    if (this.exclusiveMinimum) {
      options += helpers.optionHtml('Exclusive Min.', 'true');
    }

    if (this.maximum) {
      options += helpers.optionHtml('Max. Value', this.maximum);
    }

    if (this.exclusiveMaximum) {
      options += helpers.optionHtml('Exclusive Max.', 'true');
    }

    if (this.multipleOf) {
      options += helpers.optionHtml('Multiple Of', this.multipleOf);
    }

    break;
  }

  if (isArray) {
    if (this.minItems) {
      options += helpers.optionHtml('Min. Items', this.minItems);
    }

    if (this.maxItems) {
      options += helpers.optionHtml('Max. Items', this.maxItems);
    }

    if (this.uniqueItems) {
      options += helpers.optionHtml('Unique Items', 'true');
    }

    if (this.collectionFormat) {
      options += helpers.optionHtml('Coll. Format', this.collectionFormat);
    }
  }

  if (this['enum']) {
    var enumString;

    if (type === 'number' || type === 'integer') {
      enumString = this['enum'].join(', ');
    } else {
      enumString = '"' + this['enum'].join('", "') + '"';
    }

    options += helpers.optionHtml('Enum', enumString);
  }

  if (options.length > 0) {
    str = '<span class="propWrap">' + str + '<table class="optionsWrapper"><tr><th colspan="2">' + this.name + '</th></tr>' + options + '</table></span>';
  }

  return str;
};
