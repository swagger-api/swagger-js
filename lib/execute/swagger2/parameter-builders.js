"use strict";

exports.__esModule = true;
exports.default = void 0;
var _openapiPathTemplating = require("openapi-path-templating");
// These functions will update the request.
// They'll be given {req, value, paramter, spec, operation}.
var _default = exports.default = {
  body: bodyBuilder,
  header: headerBuilder,
  query: queryBuilder,
  path: pathBuilder,
  formData: formDataBuilder
}; // Add the body to the request
function bodyBuilder({
  req,
  value
}) {
  if (value !== undefined) {
    req.body = value;
  }
}

// Add a form data object.
function formDataBuilder({
  req,
  value,
  parameter
}) {
  if (value === false && parameter.type === 'boolean') {
    value = 'false';
  }
  if (value === 0 && ['number', 'integer'].indexOf(parameter.type) > -1) {
    value = '0';
  }
  if (value) {
    req.form = req.form || {};
    req.form[parameter.name] = {
      collectionFormat: parameter.collectionFormat,
      value
    };
  } else if (parameter.allowEmptyValue && value !== undefined) {
    req.form = req.form || {};
    const paramName = parameter.name;
    req.form[paramName] = req.form[paramName] || {};
    req.form[paramName].allowEmptyValue = true;
  }
}

// Add a header to the request
function headerBuilder({
  req,
  parameter,
  value
}) {
  req.headers = req.headers || {};
  if (typeof value !== 'undefined') {
    req.headers[parameter.name] = value;
  }
}

// Replace path paramters, with values ( ie: the URL )
function pathBuilder({
  req,
  value,
  parameter,
  baseURL
}) {
  if (value !== undefined) {
    const pathname = req.url.replace(baseURL, '');
    const resolvedPathname = (0, _openapiPathTemplating.resolve)(pathname, {
      [parameter.name]: value
    });
    req.url = baseURL + resolvedPathname;
  }
}

// Add a query to the `query` object, which will later be stringified into the URL's search
function queryBuilder({
  req,
  value,
  parameter
}) {
  req.query = req.query || {};
  if (value === false && parameter.type === 'boolean') {
    value = 'false';
  }
  if (value === 0 && ['number', 'integer'].indexOf(parameter.type) > -1) {
    value = '0';
  }
  if (value) {
    req.query[parameter.name] = {
      collectionFormat: parameter.collectionFormat,
      value
    };
  } else if (parameter.allowEmptyValue && value !== undefined) {
    const paramName = parameter.name;
    req.query[paramName] = req.query[paramName] || {};
    req.query[paramName].allowEmptyValue = true;
  }
}