import cloneDeep from 'lodash/cloneDeep'
import assign from 'lodash/assign'
import Http, {makeHttp, serializeRes, serializeHeaders} from './http'
import Resolver, {clearCache} from './resolver'
import {makeApisTagOperation} from './interfaces'
import {execute, buildRequest, PARAMETER_BUILDERS} from './execute'

Swagger.http = Http
Swagger.makeHttp = makeHttp.bind(null, Swagger.http)
Swagger.resolve = Resolver
Swagger.execute = execute
Swagger.serializeRes = serializeRes
Swagger.serializeHeaders = serializeHeaders
Swagger.clearCache = clearCache
Swagger.parameterBuilders = PARAMETER_BUILDERS // Add this to the execute call
Swagger.makeApisTagOperation = makeApisTagOperation
Swagger.buildRequest = buildRequest

function Swagger(url, opts = {}) {
  // Allow url as a separate argument
  if (typeof url === 'string') {
    opts.url = url
  }
  else {
    opts = url
  }

  if (!(this instanceof Swagger)) {
    return new Swagger(opts)
  }

  assign(this, opts)

  const prom = this.resolve()
    .then(() => {
      if (!this.disableInterfaces) {
        assign(this, Swagger.makeApisTagOperation(this))
      }

      return this
    })

  // Expose this instance on the promise that gets returned
  prom.client = this
  return prom
}

module.exports = Swagger

Swagger.prototype = {

  http: Http,

  execute(argHash) {
    return Swagger.execute({
      spec: this.spec,
      http: this.http.bind(this),
      securities: {authorized: this.authorizations},
      ...argHash
    })
  },

  resolve() {
    return Swagger.resolve({
      http: this.http,
      spec: this.spec,
      url: this.url,
      allowMetaPatches: this.allowMetaPatches
    }).then((obj) => {
      this.originalSpec = this.spec
      this.spec = obj.spec
      this.errors = obj.errors
      return this
    })
  }
}
