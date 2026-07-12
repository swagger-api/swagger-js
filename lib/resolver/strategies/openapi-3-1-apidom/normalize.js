"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.pojoAdapter = exports.default = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-1");
var _opId = _interopRequireDefault(require("../../../helpers/op-id.js"));
var _resolve = _interopRequireDefault(require("./resolve.js"));
/* eslint-disable camelcase */

const normalize = element => {
  if (!(0, _apidomCore.isObjectElement)(element)) return element;
  const plugins = [(0, _apidomNsOpenapi.refractorPluginNormalizeOperationIds)({
    operationIdNormalizer: (operationId, path, method) => (0, _opId.default)({
      operationId
    }, path, method, {
      v2OperationIdCompatibilityMode: false
    })
  }), (0, _apidomNsOpenapi.refractorPluginNormalizeParameters)(), (0, _apidomNsOpenapi.refractorPluginNormalizeSecurityRequirements)(), (0, _apidomNsOpenapi.refractorPluginNormalizeParameterExamples)(), (0, _apidomNsOpenapi.refractorPluginNormalizeHeaderExamples)()];
  const normalized = (0, _apidomCore.dispatchRefractorPlugins)(element, plugins, {
    toolboxCreator: _apidomNsOpenapi.createToolbox,
    visitorOptions: {
      keyMap: _apidomNsOpenapi.keyMap,
      nodeTypeGetter: _apidomNsOpenapi.getNodeType
    }
  });
  return normalized;
};

/**
 * This adapter allow to perform normalization on Plain Old JavaScript Objects.
 * The function adapts the `normalize` function interface and is able to accept
 * Plain Old JavaScript Objects and returns Plain Old JavaScript Objects.
 */
const pojoAdapter = normalizeFn => spec => {
  const openApiElement = _apidomNsOpenapi.OpenApi3_1Element.refract(spec);
  openApiElement.classes.push('result');
  const normalized = normalizeFn(openApiElement);
  const value = (0, _apidomCore.toValue)(normalized);

  /**
   * We're setting the cache here to avoid repeated refracting
   * in `openapi-3-1-apidom` strategy resolve method.
   */
  _resolve.default.cache.set(value, normalized);
  return (0, _apidomCore.toValue)(normalized);
};
exports.pojoAdapter = pojoAdapter;
var _default = exports.default = normalize;
/* eslint-enable camelcase */