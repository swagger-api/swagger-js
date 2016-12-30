'use strict';

var _ = {
  isPlainObject: require('lodash-compat/lang/isPlainObject'),
  indexOf: require('lodash-compat/array/indexOf')
};

module.exports.__bind = function (fn, me) {
  return function(){
    return fn.apply(me, arguments);
  };
};

var log = module.exports.log = function() {
  // Only log if available and we're not testing
  if (console && process.env.NODE_ENV !== 'test') {
    console.log(Array.prototype.slice.call(arguments)[0]);
  }
};

module.exports.fail = function (message) {
  log(message);
};

module.exports.optionHtml = function (label, value) {
  return '<tr><td class="optionName">' + label + ':</td><td>' + value + '</td></tr>';
};

var resolveSchema = module.exports.resolveSchema = function (schema) {
  if (_.isPlainObject(schema.schema)) {
    schema = resolveSchema(schema.schema);
  }

  return schema;
};

module.exports.simpleRef = function (name) {
  if (typeof name === 'undefined') {
    return null;
  }

  if (name.indexOf('#/definitions/') === 0) {
    return name.substring('#/definitions/'.length);
  } else {
    return name;
  }
};

/**
 * helper to remove extensions and add them to an object
 *
 * @param keyname
 * @param obj
 */
module.exports.extractExtensions = function (keyname, obj, value) {
  if(!keyname || !obj) {
    return;
  }

  if (typeof keyname === 'string' && keyname.indexOf('x-') === 0) {
    obj.vendorExtensions = obj.vendorExtensions || {};
    if(value) {
      obj.vendorExtensions[keyname] = value;
    }
    else {
      obj.vendorExtensions[keyname] = obj[keyname];
    }
  }
};