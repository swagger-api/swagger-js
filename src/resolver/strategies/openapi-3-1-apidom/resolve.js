/* eslint-disable camelcase */
import {
  ParseResultElement,
  ObjectElement,
  toValue,
  transclude,
  cloneDeep,
} from '@swagger-api/apidom-core';
import {
  compile as jsonPointerCompile,
  evaluate as jsonPointerEvaluate,
  EvaluationJsonPointerError,
  InvalidJsonPointerError,
} from '@swagger-api/apidom-json-pointer';
import { mediaTypes, OpenApi3_1Element } from '@swagger-api/apidom-ns-openapi-3-1';
import {
  dereferenceApiDOM,
  url,
  ReferenceSet,
  Reference,
  options as referenceOptions,
} from '@swagger-api/apidom-reference/configuration/empty';
import BinaryParser from '@swagger-api/apidom-reference/parse/parsers/binary';
import OpenAPI3_1ResolveStrategy from '@swagger-api/apidom-reference/resolve/strategies/openapi-3-1';

import { DEFAULT_BASE_URL } from '../../../constants.js';
import * as optionsUtil from '../../utils/options.js';
import HTTPResolverSwaggerClient from '../../apidom/reference/resolve/resolvers/http-swagger-client/index.js';
import JSONParser from '../../apidom/reference/parse/parsers/json/index.js';
import YAMLParser from '../../apidom/reference/parse/parsers/yaml-1-2/index.js';
import OpenAPIJSON3_1Parser from '../../apidom/reference/parse/parsers/openapi-json-3-1/index.js';
import OpenAPIYAML3_1Parser from '../../apidom/reference/parse/parsers/openapi-yaml-3-1/index.js';
import OpenAPI3_1SwaggerClientDereferenceStrategy from '../../apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

export const circularReplacer = (refElement) => {
  const $refBaseURI = toValue(refElement.meta.get('baseURI'));
  const referencingElement = refElement.meta.get('referencingElement');

  /**
   * Removing semantics from the absolutified referencing element by
   * using generic ObjectElement to represent the reference.
   */
  return new ObjectElement(
    { $ref: $refBaseURI },
    cloneDeep(referencingElement.meta),
    cloneDeep(referencingElement.attributes)
  );
};

const resolveOpenAPI31Strategy = async (options) => {
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
    strategies,
  } = options;
  try {
    const { cache } = resolveOpenAPI31Strategy;
    const strategy = strategies.find((strg) => strg.match(spec));

    // determining BaseURI
    const cwd = url.isHttpUrl(url.cwd()) ? url.cwd() : DEFAULT_BASE_URL;
    const retrievalURI = optionsUtil.retrievalURI(options);
    const baseURI = url.resolve(cwd, retrievalURI);

    // prepare spec for dereferencing
    let openApiElement;
    if (cache.has(spec)) {
      openApiElement = cache.get(spec);
    } else {
      openApiElement = OpenApi3_1Element.refract(spec);
      openApiElement.classes.push('result');
      cache.set(spec, openApiElement);
    }

    const openApiParseResultElement = new ParseResultElement([openApiElement]);

    // prepare fragment for dereferencing
    const jsonPointer = jsonPointerCompile(pathDiscriminator);
    const jsonPointerURI = jsonPointer === '' ? '' : `#${jsonPointer}`;
    const fragmentElement = jsonPointerEvaluate(jsonPointer, openApiElement);

    // prepare reference set for dereferencing
    const openApiElementReference = new Reference({
      uri: baseURI,
      value: openApiParseResultElement,
    });
    const refSet = new ReferenceSet({ refs: [openApiElementReference] });
    if (jsonPointer !== '') refSet.rootRef = undefined; // reset root reference as we want fragment to become the root reference

    // prepare ancestors; needed for cases where fragment is not OpenAPI element
    const ancestors = [new Set([fragmentElement])];

    const errors = [];
    const dereferenced = await dereferenceApiDOM(fragmentElement, {
      resolve: {
        /**
         * swagger-client only supports resolving HTTP(S) URLs or spec objects.
         * If runtime env is detected as non-browser one,
         * and baseURI was not provided as part of resolver options,
         * then below baseURI check will make sure that constant HTTPS URL is used as baseURI.
         */
        baseURI: `${baseURI}${jsonPointerURI}`,
        resolvers: [
          new HTTPResolverSwaggerClient({
            timeout: timeout || 10000,
            redirects: redirects || 10,
          }),
        ],
        resolverOpts: {
          swaggerHTTPClientConfig: {
            requestInterceptor,
            responseInterceptor,
          },
        },
        strategies: [new OpenAPI3_1ResolveStrategy()],
      },
      parse: {
        mediaType: mediaTypes.latest(),
        parsers: [
          new OpenAPIJSON3_1Parser({ allowEmpty: false, sourceMap: false }),
          new OpenAPIYAML3_1Parser({ allowEmpty: false, sourceMap: false }),
          new JSONParser({ allowEmpty: false, sourceMap: false }),
          new YAMLParser({ allowEmpty: false, sourceMap: false }),
          new BinaryParser({ allowEmpty: false, sourceMap: false }),
        ],
      },
      dereference: {
        maxDepth: 100,
        strategies: [
          new OpenAPI3_1SwaggerClientDereferenceStrategy({
            allowMetaPatches,
            useCircularStructures,
            parameterMacro,
            modelPropertyMacro,
            mode,
            ancestors,
          }),
        ],
        refSet,
        dereferenceOpts: { errors },
        immutable: false,
        circular: useCircularStructures ? 'ignore' : 'replace',
        circularReplacer: useCircularStructures
          ? referenceOptions.dereference.circularReplacer
          : circularReplacer,
      },
    });
    const transcluded = transclude(fragmentElement, dereferenced, openApiElement);
    const normalized = skipNormalization ? transcluded : strategy.normalize(transcluded);

    return { spec: toValue(normalized), errors };
  } catch (error) {
    if (error instanceof InvalidJsonPointerError || error instanceof EvaluationJsonPointerError) {
      return { spec: null, errors: [] };
    }
    throw error;
  }
};
resolveOpenAPI31Strategy.cache = new WeakMap();

export default resolveOpenAPI31Strategy;
/* eslint-enable camelcase */
