'use strict';

// eslint-disable-line
const {
  default: SwaggerClient
} = require('./index.js');

// add backwards compatibility with older versions of swagger-ui
// by exporting one single symbol.
// Refs https://github.com/swagger-api/swagger-ui/issues/6210

module.exports = SwaggerClient;