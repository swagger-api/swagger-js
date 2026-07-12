"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomCore = require("@swagger-api/apidom-core");
var _empty = require("@swagger-api/apidom-reference/configuration/empty");
var _openapi = _interopRequireDefault(require("@swagger-api/apidom-reference/dereference/strategies/openapi-3-1"));
var _apidomNsOpenapi = _interopRequireWildcard(require("@swagger-api/apidom-ns-openapi-3-1"));
var _root = _interopRequireDefault(require("./visitors/root.js"));
/* eslint-disable camelcase */

const visitAsync = _apidomCore.visit[Symbol.for('nodejs.util.promisify.custom')];
class OpenAPI3_1SwaggerClientDereferenceStrategy extends _openapi.default {
  allowMetaPatches;
  parameterMacro;
  modelPropertyMacro;
  mode;
  ancestors;
  constructor({
    allowMetaPatches = false,
    parameterMacro = null,
    modelPropertyMacro = null,
    mode = 'non-strict',
    ancestors = [],
    ...rest
  } = {}) {
    super({
      ...rest
    });
    this.name = 'openapi-3-1-swagger-client';
    this.allowMetaPatches = allowMetaPatches;
    this.parameterMacro = parameterMacro;
    this.modelPropertyMacro = modelPropertyMacro;
    this.mode = mode;
    this.ancestors = [...ancestors];
  }
  async dereference(file, options) {
    const namespace = (0, _apidomCore.createNamespace)(_apidomNsOpenapi.default);
    const immutableRefSet = options.dereference.refSet ?? new _empty.ReferenceSet();
    const mutableRefsSet = new _empty.ReferenceSet();
    let refSet = immutableRefSet;
    let reference;
    if (!immutableRefSet.has(file.uri)) {
      reference = new _empty.Reference({
        uri: file.uri,
        value: file.parseResult
      });
      immutableRefSet.add(reference);
    } else {
      // pre-computed refSet was provided as configuration option
      reference = immutableRefSet.find(ref => ref.uri === file.uri);
    }

    /**
     * Clone refSet due the dereferencing process being mutable.
     * We don't want to mutate the original refSet and the references.
     */
    if (options.dereference.immutable) {
      immutableRefSet.refs.map(ref => new _empty.Reference({
        ...ref,
        value: (0, _apidomCore.cloneDeep)(ref.value)
      })).forEach(ref => mutableRefsSet.add(ref));
      reference = mutableRefsSet.find(ref => ref.uri === file.uri);
      refSet = mutableRefsSet;
    }
    const rootVisitor = new _root.default({
      reference,
      namespace,
      options,
      allowMetaPatches: this.allowMetaPatches,
      ancestors: this.ancestors,
      modelPropertyMacro: this.modelPropertyMacro,
      mode: this.mode,
      parameterMacro: this.parameterMacro
    });
    const dereferencedElement = await visitAsync(refSet.rootRef.value, rootVisitor, {
      keyMap: _apidomNsOpenapi.keyMap,
      nodeTypeGetter: _apidomNsOpenapi.getNodeType
    });

    /**
     * If immutable option is set, replay refs from the refSet.
     */
    if (options.dereference.immutable) {
      mutableRefsSet.refs.filter(ref => ref.uri.startsWith('immutable://')).map(ref => new _empty.Reference({
        ...ref,
        uri: ref.uri.replace(/^immutable:\/\//, '')
      })).forEach(ref => immutableRefSet.add(ref));
    }

    /**
     * Release all memory if this refSet was not provided as an configuration option.
     * If provided as configuration option, then provider is responsible for cleanup.
     */
    if (options.dereference.refSet === null) {
      immutableRefSet.clean();
    }
    mutableRefsSet.clean();
    return dereferencedElement;
  }
}
var _default = exports.default = OpenAPI3_1SwaggerClientDereferenceStrategy;
/* eslint-enable camelcase */