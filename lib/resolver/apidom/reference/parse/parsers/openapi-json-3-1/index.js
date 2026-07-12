"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));
var _apidomCore = require("@swagger-api/apidom-core");
var _empty = require("@swagger-api/apidom-reference/configuration/empty");
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-1");
/* eslint-disable camelcase */

class OpenAPIJSON3_1Parser extends _empty.Parser {
  detectionRegExp = /"openapi"\s*:\s*"(?<version_json>3\.1\.(?:[1-9]\d*|0))"/;
  constructor(options = {}) {
    super({
      name: 'openapi-json-3-1-swagger-client',
      mediaTypes: new _apidomNsOpenapi.OpenAPIMediaTypes(..._apidomNsOpenapi.mediaTypes.filterByFormat('generic'), ..._apidomNsOpenapi.mediaTypes.filterByFormat('json')),
      ...options
    });
  }
  async canParse(file) {
    var _context, _context2;
    const hasSupportedFileExtension = this.fileExtensions.length === 0 ? true : (0, _includes.default)(_context = this.fileExtensions).call(_context, file.extension);
    const hasSupportedMediaType = (0, _includes.default)(_context2 = this.mediaTypes).call(_context2, file.mediaType);
    if (!hasSupportedFileExtension) return false;
    if (hasSupportedMediaType) return true;
    if (!hasSupportedMediaType) {
      try {
        const source = file.toString();
        JSON.parse(source);
        return this.detectionRegExp.test(source);
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  async parse(file) {
    if (this.sourceMap) {
      throw new _empty.ParserError("openapi-json-3-1-swagger-client parser plugin doesn't support sourceMaps option");
    }
    const parseResultElement = new _apidomCore.ParseResultElement();
    const source = file.toString();

    // allow empty files
    if (this.allowEmpty && source.trim() === '') {
      return parseResultElement;
    }
    try {
      const pojo = JSON.parse(source);
      const element = _apidomNsOpenapi.OpenApi3_1Element.refract(pojo, this.refractorOpts);
      element.classes.push('result');
      parseResultElement.push(element);
      return parseResultElement;
    } catch (error) {
      throw new _empty.ParserError(`Error parsing "${file.uri}"`, {
        cause: error
      });
    }
  }
}
var _default = exports.default = OpenAPIJSON3_1Parser;
/* eslint-enable camelcase */