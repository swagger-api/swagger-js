"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.clearCache = clearCache;
exports.default = void 0;
var _resolve = _interopRequireDefault(require("./resolve.js"));
var _normalize = _interopRequireDefault(require("./normalize.js"));
var _index = require("../../specmap/index.js");
function clearCache() {
  _index.plugins.refs.clearCache();
}
const genericStrategy = {
  name: 'generic',
  match() {
    return true;
  },
  normalize(spec) {
    const {
      spec: normalized
    } = (0, _normalize.default)({
      spec
    });
    return normalized;
  },
  async resolve(options) {
    return (0, _resolve.default)(options);
  }
};
var _default = exports.default = genericStrategy;