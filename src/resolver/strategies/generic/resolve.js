import mapSpec, { plugins } from '../../specmap/index.js';
import { makeFetchJSON } from '../../utils/index.js';
import * as optionsUtil from '../../utils/options.js';

export default async function resolveGenericStrategy(options) {
  const {
    spec,
    mode,
    allowMetaPatches = true,
    pathDiscriminator,
    modelPropertyMacro,
    parameterMacro,
    requestInterceptor,
    responseInterceptor,
    skipNormalization = false,
    useCircularStructures,
    strategies,
  } = options;

  const retrievalURI = optionsUtil.retrievalURI(options);
  const httpClient = optionsUtil.httpClient(options);
  const strategy = strategies.find((strg) => strg.match(spec));

  return doResolve(spec);

  async function doResolve(_spec) {
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
    const result = await mapSpec({
      spec: _spec,
      context: { baseDoc: retrievalURI },
      plugins: plugs,
      allowMetaPatches, // allows adding .meta patches, which include adding `$$ref`s to the spec
      pathDiscriminator, // for lazy resolution
      parameterMacro,
      modelPropertyMacro,
      useCircularStructures,
    });

    result.spec = skipNormalization ? result.spec : strategy.normalize(result.spec);

    return result;
  }
}
