/* eslint-disable camelcase */
import { toValue, transclude, ParseResultElement } from '@swagger-api/apidom-core';
import {
  compile as jsonPointerCompile,
  evaluate as jsonPointerEvaluate,
  EvaluationJsonPointerError,
  InvalidJsonPointerError,
} from '@swagger-api/apidom-json-pointer';
import { OpenApi3_1Element, mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';
import {
  dereferenceApiDOM,
  url,
  ReferenceSet,
  Reference,
} from '@swagger-api/apidom-reference/configuration/empty';
import BinaryParser from '@swagger-api/apidom-reference/parse/parsers/binary';
import OpenApi3_1ResolveStrategy from '@swagger-api/apidom-reference/resolve/strategies/openapi-3-1';

import { DEFAULT_BASE_URL } from '../../../constants.js';
import * as optionsUtil from '../../utils/options.js';
import normalize from './normalize.js';
import HttpResolverSwaggerClient from '../../apidom/reference/resolve/resolvers/http-swagger-client/index.js';
import JsonParser from '../../apidom/reference/parse/parsers/json/index.js';
import YamlParser from '../../apidom/reference/parse/parsers/yaml-1-2/index.js';
import OpenApiJson3_1Parser from '../../apidom/reference/parse/parsers/openapi-json-3-1/index.js';
import OpenApiYaml3_1Parser from '../../apidom/reference/parse/parsers/openapi-yaml-3-1/index.js';
import OpenApi3_1SwaggerClientDereferenceStrategy from '../../apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

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
  } = options;
  try {
    const { cache } = resolveOpenAPI31Strategy;

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
    const openApiElementReference = Reference({ uri: baseURI, value: openApiParseResultElement });
    const refSet = ReferenceSet({ refs: [openApiElementReference] });
    if (jsonPointer !== '') refSet.rootRef = null; // reset root reference as we want fragment to become the root reference

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
          HttpResolverSwaggerClient({
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
        strategies: [OpenApi3_1ResolveStrategy()],
      },
      parse: {
        mediaType: mediaTypes.latest(),
        parsers: [
          OpenApiJson3_1Parser({ allowEmpty: false, sourceMap: false }),
          OpenApiYaml3_1Parser({ allowEmpty: false, sourceMap: false }),
          JsonParser({ allowEmpty: false, sourceMap: false }),
          YamlParser({ allowEmpty: false, sourceMap: false }),
          BinaryParser({ allowEmpty: false, sourceMap: false }),
        ],
      },
      dereference: {
        maxDepth: 100,
        strategies: [
          OpenApi3_1SwaggerClientDereferenceStrategy({
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
      },
    });
    const transcluded = transclude(fragmentElement, dereferenced, openApiElement);
    const normalized = skipNormalization ? transcluded : normalize(transcluded);

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
