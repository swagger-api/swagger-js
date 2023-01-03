import mapSpec, { plugins } from '../../specmap/index.js';
// eslint-disable-next-line camelcase
import normalizeOpenAPI2__30 from '../../helpers/normalize/openapi-2--3-0.js';
import { makeFetchJSON } from '../utils/index.js';
import * as optionsUtil from '../utils/options.js';

// Wipe out the http cache
export function clearCache() {
  plugins.refs.clearCache();
}

// eslint-disable-next-line camelcase
export default function resolveOpenAPI2_30Strategy(obj) {
  const {
    spec,
    mode,
    allowMetaPatches = true,
    pathDiscriminator,
    modelPropertyMacro,
    parameterMacro,
    requestInterceptor,
    responseInterceptor,
    skipNormalization,
    useCircularStructures,
  } = obj;

  const retrievalURI = optionsUtil.retrievalURI(obj);
  const httpClient = optionsUtil.httpClient(obj);

  return doResolve(spec);

  function doResolve(_spec) {
    if (retrievalURI) {
      plugins.refs.docCache[retrievalURI] = _spec;
    }

    // Build a json-fetcher ( ie: give it a URL and get json out )
    plugins.refs.fetchJSON = makeFetchJSON(httpClient, { requestInterceptor, responseInterceptor });

    const plugs = [plugins.refs];

    if (typeof parameterMacro === 'function') {
      plugs.push(plugins.parameters);
    }

    if (typeof modelPropertyMacro === 'function') {
      plugs.push(plugins.properties);
    }

    if (mode !== 'strict') {
      plugs.push(plugins.allOf);
    }

    // mapSpec is where the hard work happens
    return mapSpec({
      spec: _spec,
      context: { baseDoc: retrievalURI },
      plugins: plugs,
      allowMetaPatches, // allows adding .meta patches, which include adding `$$ref`s to the spec
      pathDiscriminator, // for lazy resolution
      parameterMacro,
      modelPropertyMacro,
      useCircularStructures,
      // eslint-disable-next-line camelcase
    }).then(skipNormalization ? async (a) => a : normalizeOpenAPI2__30);
  }
}
