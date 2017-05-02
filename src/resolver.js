import Http from './http'
import mapSpec, {plugins} from './specmap'
import {normalizeSwagger} from './helpers'

export function makeFetchJSON(http) {
  return (docPath) => {
    return http({
      url: docPath,
      loadSpec: true,
      headers: {
        Accept: 'application/json'
      }
    })
    .then((res) => {
      return res.body
    })
  }
}

// Wipe out the http cache
export function clearCache() {
  plugins.refs.clearCache()
}

export default function resolve({http, fetch, spec, url, baseDoc, mode, allowMetaPatches = true}) {
  // @TODO Swagger-UI uses baseDoc instead of url, this is to allow both
  // need to fix and pick one.
  baseDoc = baseDoc || url

  // Provide a default fetch implementation
  // TODO fetch should be removed, and http used instead
  http = fetch || http || Http

  if (!spec) {
    return makeFetchJSON(http)(baseDoc).then(doResolve)
  }

  return doResolve(spec)

  function doResolve(_spec) {
    if (baseDoc) {
      plugins.refs.docCache[baseDoc] = _spec
    }

    // Build a json-fetcher ( ie: give it a URL and get json out )
    plugins.refs.fetchJSON = makeFetchJSON(http)

    const plugs = [plugins.refs]

    if (mode !== 'strict') {
      plugs.push(plugins.allOf)
    }

    // mapSpec is where the hard work happens, see https://github.com/swagger-api/specmap for more details
    return mapSpec({
      spec: _spec,
      context: {baseDoc},
      plugins: plugs,
      allowMetaPatches // allows adding .meta patches, which include adding `$$ref`s to the spec
    }).then(normalizeSwagger)
  }
}
