'use strict';

var log = require('../helpers').log;
var _ = {
  isPlainObject: require('lodash-compat/lang/isPlainObject'),
  isString: require('lodash-compat/lang/isString'),
};

var SchemaMarkup = require('../schema-markup.js');
var jsyaml = require('js-yaml');

var Model = module.exports = function (name, definition, models, modelPropertyMacro) {
  this.definition = definition || {};
  this.isArray = definition.type === 'array';
  this.models = models || {};
  this.name = name || definition.title || 'Inline Model';
  this.modelPropertyMacro = modelPropertyMacro || function (property) {
    return property.default;
  };

  return this;
};

// Note!  This function will be removed in 2.2.x!
Model.prototype.createJSONSample = Model.prototype.getSampleValue = function (modelsToIgnore) {
  modelsToIgnore = modelsToIgnore || {};

  modelsToIgnore[this.name] = this;

  // Response support
  if (this.examples && _.isPlainObject(this.examples) && this.examples['application/json']) {
    this.definition.example = this.examples['application/json'];

    if (_.isString(this.definition.example)) {
      this.definition.example = jsyaml.safeLoad(this.definition.example);
    }
  } else if (!this.definition.example) {
    this.definition.example = this.examples;
  }

  return SchemaMarkup.schemaToJSON(this.definition, this.models, modelsToIgnore, this.modelPropertyMacro);
};

Model.prototype.getMockSignature = function () {
  return SchemaMarkup.schemaToHTML(this.name, this.definition, this.models, this.modelPropertyMacro);
};
