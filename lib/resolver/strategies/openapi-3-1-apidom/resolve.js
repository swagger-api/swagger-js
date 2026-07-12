"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = exports.circularReplacer = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
var _modern = require("@swagger-api/apidom-json-pointer/modern");
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-1");
var _empty = require("@swagger-api/apidom-reference/configuration/empty");
var _binary = _interopRequireDefault(require("@swagger-api/apidom-reference/parse/parsers/binary"));
var _openapi = _interopRequireDefault(require("@swagger-api/apidom-reference/resolve/strategies/openapi-3-1"));
var _constants = require("../../../constants.js");
var optionsUtil = _interopRequireWildcard(require("../../utils/options.js"));
var _index = _interopRequireDefault(require("../../apidom/reference/resolve/resolvers/http-swagger-client/index.js"));
var _index2 = _interopRequireDefault(require("../../apidom/reference/parse/parsers/json/index.js"));
var _index3 = _interopRequireDefault(require("../../apidom/reference/parse/parsers/yaml-1-2/index.js"));
var _index4 = _interopRequireDefault(require("../../apidom/reference/parse/parsers/openapi-json-3-1/index.js"));
var _index5 = _interopRequireDefault(require("../../apidom/reference/parse/parsers/openapi-yaml-3-1/index.js"));
var _index6 = _interopRequireDefault(require("../../apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js"));
/* eslint-disable camelcase */

const circularReplacer = refElement => {
  const $refBaseURI = (0, _apidomCore.toValue)(refElement.meta.get('baseURI'));
  const referencingElement = refElement.meta.get('referencingElement');

  /**
   * Removing semantics from the absolutified referencing element by
   * using generic ObjectElement to represent the reference.
   */
  return new _apidomCore.ObjectElement({
    $ref: $refBaseURI
  }, (0, _apidomCore.cloneDeep)(referencingElement.meta), (0, _apidomCore.cloneDeep)(referencingElement.attributes));
};
exports.circularReplacer = circularReplacer;
const resolveOpenAPI31Strategy = async options => {
  const {
    spec,
    timeout,
    redirects,
    requestInterceptor,
    responseInterceptor,
    pathDiscriminator = [],
    allowMetaPatches = false,
    useCircularStructures = false,
    skipNormalization = false,
    parameterMacro = null,
    modelPropertyMacro = null,
    mode = 'non-strict',
    strategies
  } = options;
  try {
    const {
      cache
    } = resolveOpenAPI31Strategy;
    const strategy = strategies.find(strg => strg.match(spec));

    // determining BaseURI
    const cwd = _empty.url.isHttpUrl(_empty.url.cwd()) ? _empty.url.cwd() : _constants.DEFAULT_BASE_URL;
    const retrievalURI = optionsUtil.retrievalURI(options);
    const baseURI = _empty.url.resolve(cwd, retrievalURI);

    // prepare spec for dereferencing
    let openApiElement;
    if (cache.has(spec)) {
      openApiElement = cache.get(spec);
    } else {
      openApiElement = _apidomNsOpenapi.OpenApi3_1Element.refract(spec);
      openApiElement.classes.push('result');
      cache.set(spec, openApiElement);
    }
    const openApiParseResultElement = new _apidomCore.ParseResultElement([openApiElement]);

    // prepare fragment for dereferencing
    const jsonPointer = (0, _modern.compile)(pathDiscriminator);
    const jsonPointerURI = jsonPointer === '' ? '' : `#${jsonPointer}`;
    const fragmentElement = (0, _modern.evaluate)(openApiElement, jsonPointer);

    // prepare reference set for dereferencing
    const openApiElementReference = new _empty.Reference({
      uri: baseURI,
      value: openApiParseResultElement
    });
    const refSet = new _empty.ReferenceSet({
      refs: [openApiElementReference]
    });
    if (jsonPointer !== '') refSet.rootRef = undefined; // reset root reference as we want fragment to become the root reference

    // prepare ancestors; needed for cases where fragment is not OpenAPI element
    const ancestors = [new Set([fragmentElement])];
    const errors = [];
    const dereferenced = await (0, _empty.dereferenceApiDOM)(fragmentElement, {
      resolve: {
        /**
         * swagger-client only supports resolving HTTP(S) URLs or spec objects.
         * If runtime env is detected as non-browser one,
         * and baseURI was not provided as part of resolver options,
         * then below baseURI check will make sure that constant HTTPS URL is used as baseURI.
         */
        baseURI: `${baseURI}${jsonPointerURI}`,
        resolvers: [new _index.default({
          timeout: timeout || 10000,
          redirects: redirects || 10
        })],
        resolverOpts: {
          swaggerHTTPClientConfig: {
            requestInterceptor,
            responseInterceptor
          }
        },
        strategies: [new _openapi.default()]
      },
      parse: {
        mediaType: _apidomNsOpenapi.mediaTypes.latest(),
        parsers: [new _index4.default({
          allowEmpty: false,
          sourceMap: false
        }), new _index5.default({
          allowEmpty: false,
          sourceMap: false
        }), new _index2.default({
          allowEmpty: false,
          sourceMap: false
        }), new _index3.default({
          allowEmpty: false,
          sourceMap: false
        }), new _binary.default({
          allowEmpty: false,
          sourceMap: false
        })]
      },
      dereference: {
        maxDepth: 100,
        strategies: [new _index6.default({
          allowMetaPatches,
          useCircularStructures,
          parameterMacro,
          modelPropertyMacro,
          mode,
          ancestors
        })],
        refSet,
        dereferenceOpts: {
          errors
        },
        immutable: false,
        circular: useCircularStructures ? 'ignore' : 'replace',
        circularReplacer: useCircularStructures ? _empty.options.dereference.circularReplacer : circularReplacer
      }
    });
    const transcluded = (0, _apidomCore.transclude)(fragmentElement, dereferenced, openApiElement);
    const normalized = skipNormalization ? transcluded : strategy.normalize(transcluded);
    return {
      spec: (0, _apidomCore.toValue)(normalized),
      errors
    };
  } catch (error) {
    if (error instanceof _modern.JSONPointerEvaluateError) {
      return {
        spec,
        errors: []
      };
    }
    throw error;
  }
};
resolveOpenAPI31Strategy.cache = new WeakMap();
var _default = exports.default = resolveOpenAPI31Strategy;
/* eslint-enable camelcase */