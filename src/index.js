/* eslint-disable camelcase */
import Http, { makeHttp, serializeRes, serializeHeaders } from './http/index.js';
import { makeResolve } from './resolver/index.js';
import { makeResolveSubtree } from './subtree-resolver/index.js';
import genericResolveStrategy from './resolver/strategies/generic/index.js';
import openApi2ResolveStrategy, { clearCache } from './resolver/strategies/openapi-2/index.js';
import openApi30ResolveStrategy from './resolver/strategies/openapi-3-0/index.js';
import openApi31ApiDOMResolveStrategy from './resolver/strategies/openapi-3-1-apidom/index.js';
import { makeApisTagOperation } from './interfaces.js';
import { execute, buildRequest, baseUrl } from './execute/index.js';
import { opId } from './helpers/index.js';
import HttpResolverSwaggerClient from './resolver/apidom/reference/resolve/resolvers/http-swagger-client/index.js';
import JsonParser from './resolver/apidom/reference/parse/parsers/json/index.js';
import YamlParser from './resolver/apidom/reference/parse/parsers/yaml-1-2/index.js';
import OpenApiJson3_1Parser from './resolver/apidom/reference/parse/parsers/openapi-json-3-1/index.js';
import OpenApiYaml3_1Parser from './resolver/apidom/reference/parse/parsers/openapi-yaml-3-1/index.js';
import OpenApi3_1SwaggerClientDereferenceStrategy from './resolver/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

Swagger.http = Http;
Swagger.makeHttp = makeHttp.bind(null, Swagger.http);
Swagger.resolveStrategies = {
  'openapi-3-1-apidom': openApi31ApiDOMResolveStrategy,
  'openapi-3-0': openApi30ResolveStrategy,
  'openapi-2-0': openApi2ResolveStrategy,
  generic: genericResolveStrategy,
};
Swagger.resolve = makeResolve({
  strategies: [
    Swagger.resolveStrategies['openapi-3-1-apidom'],
    Swagger.resolveStrategies['openapi-3-0'],
    Swagger.resolveStrategies['openapi-2-0'],
    Swagger.resolveStrategies.generic,
  ],
});
Swagger.resolveSubtree = makeResolveSubtree({
  strategies: [
    Swagger.resolveStrategies['openapi-3-1-apidom'],
    Swagger.resolveStrategies['openapi-3-0'],
    Swagger.resolveStrategies['openapi-2-0'],
    Swagger.resolveStrategies.generic,
  ],
});
Swagger.execute = execute;
Swagger.serializeRes = serializeRes;
Swagger.serializeHeaders = serializeHeaders;
Swagger.clearCache = clearCache;
Swagger.makeApisTagOperation = makeApisTagOperation;
Swagger.buildRequest = buildRequest;
Swagger.helpers = { opId };
Swagger.getBaseUrl = baseUrl;
Swagger.apidom = {
  resolve: {
    resolvers: { HttpResolverSwaggerClient },
  },
  parse: {
    parsers: {
      JsonParser,
      YamlParser,
      OpenApiJson3_1Parser,
      OpenApiYaml3_1Parser,
    },
  },
  dereference: {
    strategies: { OpenApi3_1SwaggerClientDereferenceStrategy },
  },
};

function Swagger(url, opts = {}) {
  // Allow url as a separate argument
  if (typeof url === 'string') {
    opts.url = url;
  } else {
    opts = url;
  }

  if (!(this instanceof Swagger)) {
    return new Swagger(opts);
  }

  Object.assign(this, opts);

  const prom = this.resolve().then(() => {
    if (!this.disableInterfaces) {
      Object.assign(this, Swagger.makeApisTagOperation(this));
    }
    return this;
  });

  // Expose this instance on the promise that gets returned
  prom.client = this;
  return prom;
}

Swagger.prototype = {
  http: Http,

  execute(options) {
    this.applyDefaults();

    return Swagger.execute({
      spec: this.spec,
      http: this.http,
      securities: { authorized: this.authorizations },
      contextUrl: typeof this.url === 'string' ? this.url : undefined,
      requestInterceptor: this.requestInterceptor || null,
      responseInterceptor: this.responseInterceptor || null,
      ...options,
    });
  },

  resolve(options = {}) {
    return Swagger.resolve({
      spec: this.spec,
      url: this.url,
      http: this.http || this.fetch,
      allowMetaPatches: this.allowMetaPatches,
      useCircularStructures: this.useCircularStructures,
      requestInterceptor: this.requestInterceptor || null,
      responseInterceptor: this.responseInterceptor || null,
      skipNormalization: this.skipNormalization || false,
      ...options,
    }).then((obj) => {
      this.originalSpec = this.spec;
      this.spec = obj.spec;
      this.errors = obj.errors;
      return this;
    });
  },
};

Swagger.prototype.applyDefaults = function applyDefaults() {
  const { spec } = this;
  const specUrl = this.url;
  // TODO: OAS3: support servers here
  if (specUrl && specUrl.startsWith('http')) {
    const parsed = new URL(specUrl);
    if (!spec.host) {
      spec.host = parsed.host;
    }
    if (!spec.schemes) {
      spec.schemes = [parsed.protocol.replace(':', '')];
    }
    if (!spec.basePath) {
      spec.basePath = '/';
    }
  }
};

// add backwards compatibility with older versions of swagger-ui
// Refs https://github.com/swagger-api/swagger-ui/issues/6210
export const { helpers } = Swagger;

export default Swagger;
/* eslint-enable camelcase */
