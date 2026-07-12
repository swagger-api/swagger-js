"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.absolutifyPointer = absolutifyPointer;
exports.generateAbsoluteRefPatches = generateAbsoluteRefPatches;
exports.isFreelyNamed = isFreelyNamed;
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));
var _legacy = _interopRequireDefault(require("neotraverse/legacy"));
var _empty = require("@swagger-api/apidom-reference/configuration/empty");
var _constants = require("../../constants.js");
// This will match if the direct parent's key exactly matches an item.
const freelyNamedKeyParents = ['properties'];

// This will match if the grandparent's key exactly matches an item.
// NOTE that this is for finding non-free paths!
const nonFreelyNamedKeyGrandparents = ['properties'];

// This will match if the joined parent path exactly matches an item.
//
// This is mostly useful for filtering out root-level reusable item names,
// for example `["definitions", "$ref"]`
const freelyNamedPaths = [
// Swagger 2.0
'definitions', 'parameters', 'responses', 'securityDefinitions',
// OpenAPI 3.0
'components/schemas', 'components/responses', 'components/parameters', 'components/securitySchemes'];

// This will match if any of these items are substrings of the joined
// parent path.
//
// Warning! These are powerful. Beware of edge cases.
const freelyNamedAncestors = ['schema/example', 'items/example'];
function isFreelyNamed(parentPath) {
  const parentKey = parentPath[parentPath.length - 1];
  const grandparentKey = parentPath[parentPath.length - 2];
  const parentStr = parentPath.join('/');
  return (
    // eslint-disable-next-line max-len
    freelyNamedKeyParents.indexOf(parentKey) > -1 && nonFreelyNamedKeyGrandparents.indexOf(grandparentKey) === -1 || freelyNamedPaths.indexOf(parentStr) > -1 || freelyNamedAncestors.some(el => parentStr.indexOf(el) > -1)
  );
}
function generateAbsoluteRefPatches(obj, basePath, {
  specmap,
  getBaseUrlForNodePath = path => specmap.getContext([...basePath, ...path]).baseDoc,
  targetKeys = ['$ref', '$$ref']
} = {}) {
  const patches = [];
  (0, _legacy.default)(obj).forEach(function callback() {
    if ((0, _includes.default)(targetKeys).call(targetKeys, this.key) && typeof this.node === 'string') {
      const nodePath = this.path; // this node's path, relative to `obj`
      const fullPath = basePath.concat(this.path);
      const absolutifiedRefValue = absolutifyPointer(this.node, getBaseUrlForNodePath(nodePath));
      patches.push(specmap.replace(fullPath, absolutifiedRefValue));
    }
  });
  return patches;
}
function absolutifyPointer(pointer, baseUrl) {
  const [urlPart, fragmentPart] = pointer.split('#');
  const safeBaseUrl = baseUrl ?? '';
  const safeUrlPart = urlPart ?? '';
  let newRefUrlPart;
  if (!_empty.url.isHttpUrl(safeBaseUrl)) {
    const absoluteBaseUrl = _empty.url.resolve(_constants.DEFAULT_BASE_URL, safeBaseUrl);
    const absoluteRefUrlPart = _empty.url.resolve(absoluteBaseUrl, safeUrlPart);
    const rawRefUrlPart = absoluteRefUrlPart.replace(_constants.DEFAULT_BASE_URL, '');
    newRefUrlPart = safeUrlPart.startsWith('/') ? rawRefUrlPart : rawRefUrlPart.substring(1);
  } else {
    newRefUrlPart = _empty.url.resolve(safeBaseUrl, safeUrlPart);
  }
  return fragmentPart ? `${newRefUrlPart}#${fragmentPart}` : newRefUrlPart;
}