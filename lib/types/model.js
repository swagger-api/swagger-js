'use strict';

var _ = {
  forEach: require('lodash-compat/collection/forEach'),
  indexOf: require('lodash-compat/array/indexOf'),
  isArray: require('lodash-compat/lang/isArray'),
  isPlainObject: require('lodash-compat/lang/isPlainObject'),
  isString: require('lodash-compat/lang/isString'),
  isUndefined: require('lodash-compat/lang/isUndefined'),
  keys: require('lodash-compat/object/keys'),
  map: require('lodash-compat/collection/map')
};
var helpers = require('../helpers');


/**
 * allows override of the default value based on the parameter being
 * supplied
 **/
var applyParameterMacro = function (operation, parameter) {
  // TODO the reference to operation.api is not available
  if (operation.api && operation.api.parameterMacro) {
    return operation.api.parameterMacro(operation, parameter);
  } else {
    return parameter.defaultValue;
  }
};

/**
 * allows overriding the default value of an model property
 **/
var applyModelPropertyMacro = function (model, property) {
  // TODO the reference to model.api is not available
  if (model.api && model.api.modelPropertyMacro) {
    return model.api.modelPropertyMacro(model, property);
  } else {
    return property.default;
  }
};

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

  // this.default = applyModelPropertyMacro(obj, this);

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
  this.enum = obj.enum || null;
  this.multipleOf = obj.multipleOf || null;
};

var Model = module.exports = function (name, definition, models) {
  this.definition = definition || {};
  this.isArray = definition.type === 'array';
  this.models = models || {};
  this.name = name || 'Inline Model';
  this.properties = [];

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

var schemaToHTML = function (name, schema, models) {
  var strongOpen = '<span class="strong">';
  var strongClose = '</span>';
  var references = {};
  var seenModels = [];
  var inlineModels = 0;
  var addReference = function (schema, name, skipRef) {
    var modelName = name;
    var model;

    if (schema.$ref) {
      modelName = helpers.simpleRef(schema.$ref);
      model = models[modelName];
    } else if (_.isUndefined(name)) {
      modelName = 'Inline Model ' + (++inlineModels);
      model = new Model(modelName, schema, models);
    }

    if (skipRef !== true) {
      references[modelName] = _.isUndefined(model) ? {} : model.definition;
    }

    return modelName;
  };
  var primitiveToHTML = function (schema) {
    var html = '<span class="propType">';
    var type = schema.type || 'object';

    if (schema.$ref) {
      html += addReference(schema, helpers.simpleRef(schema.$ref));
    } else if (type === 'object') {
      html += addReference(schema);
    } else if (type === 'array') {
      html += 'Array[';

      if (_.isArray(schema.items)) {
        html += _.map(schema.items, addReference).join(',');
      } else if (_.isPlainObject(schema.items)) {
        if (_.isUndefined(schema.items.$ref)) {
          if (!_.isUndefined(schema.items.type) && _.indexOf(['array', 'object'], schema.items.type) === -1) {
            html += schema.items.type;
          } else {
            html += addReference(schema.items);
          }
        } else {
          html += addReference(schema.items, helpers.simpleRef(schema.items.$ref));
        }
      } else {
        helpers.log('Array type\'s \'items\' schema is not an array or an object, cannot process');
        html += addReference({});
      }

      html += ']';
    } else {
      html += schema.type;
    }

    html += '</span>';

    return html;
  };
  var primitiveToOptionsHTML = function (schema, html) {
    var options = '';
    var type = schema.type || 'object';
    var isArray = type === 'array';

    if (isArray) {
      if (_.isPlainObject(schema.items) && !_.isUndefined(schema.items.type)) {
        type = schema.items.type;
      } else {
        type = 'object';
      }
    }

    if (schema.default) {
      options += helpers.optionHtml('Default', schema.default);
    }

    switch (type) {
    case 'string':
      if (schema.minLength) {
        options += helpers.optionHtml('Min. Length', schema.minLength);
      }

      if (schema.maxLength) {
        options += helpers.optionHtml('Max. Length', schema.maxLength);
      }

      if (schema.pattern) {
        options += helpers.optionHtml('Reg. Exp.', schema.pattern);
      }
      break;
    case 'integer':
    case 'number':
      if (schema.minimum) {
        options += helpers.optionHtml('Min. Value', schema.minimum);
      }

      if (schema.exclusiveMinimum) {
        options += helpers.optionHtml('Exclusive Min.', 'true');
      }

      if (schema.maximum) {
        options += helpers.optionHtml('Max. Value', schema.maximum);
      }

      if (schema.exclusiveMaximum) {
        options += helpers.optionHtml('Exclusive Max.', 'true');
      }

      if (schema.multipleOf) {
        options += helpers.optionHtml('Multiple Of', schema.multipleOf);
      }

      break;
    }

    if (isArray) {
      if (schema.minItems) {
        options += helpers.optionHtml('Min. Items', schema.minItems);
      }

      if (schema.maxItems) {
        options += helpers.optionHtml('Max. Items', schema.maxItems);
      }

      if (schema.uniqueItems) {
        options += helpers.optionHtml('Unique Items', 'true');
      }

      if (schema.collectionFormat) {
        options += helpers.optionHtml('Coll. Format', schema.collectionFormat);
      }
    }

    if (_.isUndefined(schema.items)) {
      if (_.isArray(schema.enum)) {
        var enumString;

        if (type === 'number' || type === 'integer') {
          enumString = schema.enum.join(', ');
        } else {
          enumString = '"' + schema.enum.join('", "') + '"';
        }

        options += helpers.optionHtml('Enum', enumString);
      }
    }

    if (options.length > 0) {
      html = '<span class="propWrap">' + html + '<table class="optionsWrapper"><tr><th colspan="2">' + type + '</th></tr>' + options + '</table></span>';
    }

    return html;
  };
  var processModel = function (schema, name) {
    var type = schema.type || 'object';
    var isArray = schema.type === 'array';
    var html = strongOpen + name + ' ' + (isArray ? '[' : '{') + strongClose;

    if (name) {
      seenModels.push(name);
    }

    if (isArray) {
      if (_.isArray(schema.items)) {
        html += '<div>' + _.map(schema.items, function (item) {
          var type = item.type || 'object';

          if (_.isUndefined(item.$ref)) {
            if (_.indexOf(['array', 'object'], type) > -1) {
              return addReference(item);
            } else {
              return primitiveToOptionsHTML(item, type);
            }
          } else {
            return addReference(item, helpers.simpleRef(item.$ref));
          }
        }).join(',</div><div>');
      } else if (_.isPlainObject(schema.items)) {
        if (_.isUndefined(schema.items.$ref)) {
          if (_.indexOf(['array', 'object'], schema.items.type || 'object') > -1) {
            html += '<div>' + addReference(schema.items) + '</div>';
          } else {
            html += '<div>' + primitiveToOptionsHTML(schema.items, schema.items.type) + '</div>';
          }
        } else {
          html += '<div>' + addReference(schema.items, helpers.simpleRef(schema.items.$ref)) + '</div>';
        }
      } else {
        helpers.log('Array type\'s \'items\' property is not an array or an object, cannot process');
        html += '<div>' + addReference({}, undefined, true) + '</div>';
      }
    } else {
      if (schema.$ref) {
        html += '<div>' + addReference(schema, name) + '</div>';
      } else if (type === 'object') {
        html += '<div>';

        if (_.isPlainObject(schema.properties)) {
          html += _.map(schema.properties, function (property, name) {
            var required = _.indexOf(schema.required || [], name) > -1;
            var html = '<span class="propName ' + required + '">' + name + '</span> (';

            html += primitiveToHTML(property);

            if (!required) {
              html += ', <span class="propOptKey">optional</span>';
            }

            html += ')';

            if (!_.isUndefined(property.description)) {
              html += ': ' + property.description;
            }

            if (property.enum) {
              html += ' = <span class="propVals">[\'' + property.enum.join('\' or \'') + '\']</span>';
            }

            return primitiveToOptionsHTML(property, html);
          }).join(',</div><div>');
        }

        html += '</div>';
      } else {
        html = '<div>' + primitiveToOptionsHTML(schema, type) + '</div>';
      }
    }

    return html + strongOpen + (isArray ? ']' : '}') + strongClose;
  };

  
  // Generate current HTML
  var html = processModel(schema, name);
  
  // Generate references HTML
  while (_.keys(references).length > 0) {
    _.forEach(references, function (schema, name) {
      var seenModel = _.indexOf(seenModels, name) > -1;

      delete references[name];

      if (!seenModel) {
        seenModels.push(name);

        html += '<br />' + processModel(schema, name);
      }
    });
  }

  return html;
};

var schemaToJSON = function (schema, models, modelsToIgnore) {
  var type = schema.type || 'object';
  var model;
  var output;

  if (schema.example) {
    output = schema.example;
  } else if (_.isUndefined(schema.items) && _.isArray(schema.enum)) {
    output = schema.enum[0];
  }

  if (_.isUndefined(output)) {
    if (schema.$ref) {
      model = models[helpers.simpleRef(schema.$ref)];

      if (!_.isUndefined(model)) {
        if (_.isUndefined(modelsToIgnore[model.name])) {
          modelsToIgnore[model.name] = model;
          output = schemaToJSON(model.definition, models, modelsToIgnore);
          delete modelsToIgnore[model.name];
        } else {
          if (model.type === 'array') {
            output = [];
          } else {
            output = {};
          }
        }
      }
    } else if (schema.default) {
      output = schema.default;
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
    } else if (type === 'object') {
      output = {};

      _.forEach(schema.properties, function (property, name) {
        output[name] = schemaToJSON(property, models, modelsToIgnore);
      });
    } else if (type === 'array') {
      output = [];

      if (_.isArray(schema.items)) {
        _.forEach(schema.items, function (item) {
          output.push(schemaToJSON(item, models, modelsToIgnore));
        });
      } else if (_.isPlainObject(schema.items)) {
        output.push(schemaToJSON(schema.items, models, modelsToIgnore));
      } else if (_.isUndefined(schema.items)) {
        output.push({});
      } else {
        helpers.log('Array type\'s \'items\' property is not an array or an object, cannot process');
      }
    }
  }

  return output;
};

Model.prototype.createJSONSample = Model.prototype.getSampleValue = function (modelsToIgnore) {
  modelsToIgnore = modelsToIgnore || {};

  modelsToIgnore[this.name] = this;

  // Response support
  if (this.examples && _.isPlainObject(this.examples) && this.examples['application/json']) {
    this.definition.example = this.examples['application/json'];

    if (_.isString(this.definition.example)) {
      this.definition.example = JSON.parse(this.definition.example);
    }
  } else {
    this.definition.example = this.examples;
  }

  
  return schemaToJSON(this.definition, this.models, modelsToIgnore);
};

Model.prototype.getMockSignature = function () {
  return schemaToHTML(this.name, this.definition, this.models);
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
    output = new Model(undefined, this.schema, this.models).getSampleValue();
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
