"use strict";

exports.__esModule = true;
exports.default = void 0;
var _buffer = require("buffer");
const btoa = val => {
  let buffer;
  if (val instanceof _buffer.Buffer) {
    buffer = val;
  } else {
    buffer = _buffer.Buffer.from(val.toString(), 'binary');
  }
  return buffer.toString('base64');
};
var _default = exports.default = btoa;