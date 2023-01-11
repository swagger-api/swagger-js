/* eslint-disable camelcase */
import { toValue } from '@swagger-api/apidom-core';
import { OpenApi3_1Element } from '@swagger-api/apidom-ns-openapi-3-1';
import { dereferenceApiDOM, url } from '@swagger-api/apidom-reference/configuration/empty';
import BinaryParser from '@swagger-api/apidom-reference/parse/parsers/binary';
import OpenApi3_1ResolveStrategy from '@swagger-api/apidom-reference/resolve/strategies/openapi-3-1';

import * as optionsUtil from '../utils/options.js';
import normalizeOpenAPI31 from '../../helpers/normalize/openapi-3-1.js';
import HttpResolverSwaggerClient from '../../helpers/apidom/reference/resolve/resolvers/http-swagger-client/index.js';
import JsonParser from '../../helpers/apidom/reference/parse/parsers/json/index.js';
import YamlParser from '../../helpers/apidom/reference/parse/parsers/yaml-1-2/index.js';
import OpenApiJson3_1Parser from '../../helpers/apidom/reference/parse/parsers/openapi-json-3-1/index.js';
import OpenApiYaml3_1Parser from '../../helpers/apidom/reference/parse/parsers/openapi-yaml-3-1/index.js';
import OpenApi3_1SwaggerClientDereferenceStrategy from '../../helpers/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

const resolveOpenAPI31Strategy = async (options) => {
  const {
    spec,
    timeout,
    redirects,
    requestInterceptor,
    responseInterceptor,
    allowMetaPatches = false,
    useCircularStructures = false,
    skipNormalization = false,
  } = options;
  const baseURI = optionsUtil.retrievalURI(options) ?? url.cwd();
  const openApiElement = OpenApi3_1Element.refract(spec);
  const dereferenced = await dereferenceApiDOM(openApiElement, {
    resolve: {
      /**
       * swagger-client only supports resolving HTTP(S) URLs or spec objects.
       * If runtime env is detected as non-browser one,
       * and baseURI was not provided as part of resolver options,
       * then below baseURI check will make sure that constant HTTPS URL is used as baseURI.
       */
      baseURI: url.isHttpUrl(baseURI) ? baseURI : 'https://smartbear.com/',
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
      parsers: [
        OpenApiJson3_1Parser({ allowEmpty: false, sourceMap: false }),
        OpenApiYaml3_1Parser({ allowEmpty: false, sourceMap: false }),
        JsonParser({ allowEmpty: false, sourceMap: false }),
        YamlParser({ allowEmpty: false, sourceMap: false }),
        BinaryParser({ allowEmpty: false, sourceMap: false }),
      ],
    },
    dereference: {
      strategies: [
        OpenApi3_1SwaggerClientDereferenceStrategy({ allowMetaPatches, useCircularStructures }),
      ],
    },
  });
  const normalized = skipNormalization ? dereferenced : normalizeOpenAPI31(dereferenced);

  return { spec: toValue(normalized), errors: [] };
};

export default resolveOpenAPI31Strategy;
/* eslint-enable camelcase */
