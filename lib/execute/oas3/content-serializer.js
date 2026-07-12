"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = serialize;
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));
/*
  Serializer that serializes according to a media type instead of OpenAPI's
  `style` + `explode` constructs.
*/

function serialize(value, mediaType) {
  if ((0, _includes.default)(mediaType).call(mediaType, 'application/json')) {
    if (typeof value === 'string') {
      // Assume the user has a JSON string
      return value;
    }
    if (Array.isArray(value)) {
      value = value.map(v => {
        try {
          return JSON.parse(v);
        } catch (e) {
          return v;
        }
      });
    }
    return JSON.stringify(value);
  }
  return String(value);
}