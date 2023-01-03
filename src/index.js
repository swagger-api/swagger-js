import Url from 'url';

import Http, { makeHttp, serializeRes, serializeHeaders } from './http/index.js';
import Resolver from './resolver/index.js';
import { clearCache } from './resolver/strategies/openapi-2--3-0.js';
import resolveSubtree from './subtree-resolver/index.js';
import { makeApisTagOperation } from './interfaces.js';
import { execute, buildRequest, baseUrl } from './execute/index.js';
import { opId } from './helpers/index.js';

Swagger.http = Http;
Swagger.makeHttp = makeHttp.bind(null, Swagger.http);
Swagger.resolve = Resolver;
Swagger.resolveSubtree = resolveSubtree;
Swagger.execute = execute;
Swagger.serializeRes = serializeRes;
Swagger.serializeHeaders = serializeHeaders;
Swagger.clearCache = clearCache;
Swagger.makeApisTagOperation = makeApisTagOperation;
Swagger.buildRequest = buildRequest;
Swagger.helpers = { opId };
Swagger.getBaseUrl = baseUrl;

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
    const parsed = Url.parse(specUrl);
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
