"use strict";

exports.__esModule = true;
exports.default = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
const trimParseResult = elementPath => elementPath.slice(2);

/**
 * Transforms ApiDOM traversal meta information into
 * SwaggerClient compatible path.
 *
 * SwaggerClient path is a list of JSON Pointer tokens.
 */
const toPath = elementPath => {
  const elementPathSanitized = trimParseResult(elementPath);
  return elementPathSanitized.reduce((path, element, index) => {
    if ((0, _apidomCore.isMemberElement)(element)) {
      const token = String((0, _apidomCore.toValue)(element.key));
      path.push(token);
    } else if ((0, _apidomCore.isArrayElement)(elementPathSanitized[index - 2])) {
      const token = elementPathSanitized[index - 2].content.indexOf(element);
      path.push(token);
    }
    return path;
  }, []);
};
var _default = exports.default = toPath;