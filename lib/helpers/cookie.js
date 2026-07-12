"use strict";

exports.__esModule = true;
exports.valuePercentEncoder = exports.serialize = void 0;
var _ramda = require("ramda");
var _cookie = require("@swaggerexpert/cookie");
const eqSignPE = '%3D';
const ampersandPE = '%26';
const valuePercentEncoder = cookieValue => (0, _cookie.cookieValueStrictPercentEncoder)(cookieValue).replace(/[=&]/gu, match => match === '=' ? eqSignPE : ampersandPE);
exports.valuePercentEncoder = valuePercentEncoder;
const serialize = (cookiePairs, options = {}) => {
  const defaultOptions = {
    encoders: {
      name: _cookie.identity,
      value: valuePercentEncoder
    },
    validators: {
      name: _cookie.cookieNameLenientValidator,
      value: _cookie.cookieValueStrictValidator
    }
  };
  return (0, _cookie.serializeCookie)(cookiePairs, (0, _ramda.mergeDeepRight)(defaultOptions, options));
};
exports.serialize = serialize;