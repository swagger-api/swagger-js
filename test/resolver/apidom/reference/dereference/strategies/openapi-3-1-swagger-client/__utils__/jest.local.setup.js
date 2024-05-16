/* eslint-disable camelcase */
import { options } from '@swagger-api/apidom-reference/configuration/empty';
import FileResolver from '@swagger-api/apidom-reference/resolve/resolvers/file';
import BinaryParser from '@swagger-api/apidom-reference/parse/parsers/binary';
import OpenAPI3_1ResolveStrategy from '@swagger-api/apidom-reference/resolve/strategies/openapi-3-1';
import OpenAPI3_1DereferenceStrategy from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1';

import JSONParser from '../../../../../../../../src/resolver/apidom/reference/parse/parsers/json/index.js';
import YAMLParser from '../../../../../../../../src/resolver/apidom/reference/parse/parsers/yaml-1-2/index.js';
import OpenAPIJSON3_1Parser from '../../../../../../../../src/resolver/apidom/reference/parse/parsers/openapi-json-3-1/index.js';
import OpenAPIYAML3_1Parser from '../../../../../../../../src/resolver/apidom/reference/parse/parsers/openapi-yaml-3-1/index.js';
import HTTPResolverSwaggerClient from '../../../../../../../../src/resolver/apidom/reference/resolve/resolvers/http-swagger-client/index.js';
import OpenAPI3_1SwaggerClientDereferenceStrategy from '../../../../../../../../src/resolver/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

export const beforeAll = () => {
  // configure custom parser plugins globally
  options.parse.parsers = [
    new OpenAPIJSON3_1Parser({ allowEmpty: false, sourceMap: false }),
    new OpenAPIYAML3_1Parser({ allowEmpty: false, sourceMap: false }),
    new JSONParser({ allowEmpty: false, sourceMap: false }),
    new YAMLParser({ allowEmpty: false, sourceMap: false }),
    new BinaryParser({ allowEmpty: false, sourceMap: false }),
  ];

  // configure custom resolver plugins globally
  options.resolve.resolvers = [
    new FileResolver({ fileAllowList: ['*'] }),
    new HTTPResolverSwaggerClient(),
  ];

  // configure custom resolver strategies globally
  options.resolve.strategies = [new OpenAPI3_1ResolveStrategy()];

  // configure custom dereference strategy globally
  options.dereference.strategies = [
    new OpenAPI3_1SwaggerClientDereferenceStrategy(),
    new OpenAPI3_1DereferenceStrategy(),
  ];
};

export const afterAll = () => {
  options.parse.parsers = [];
  options.resolve.resolvers = [];
  options.resolve.strategies = [];
  options.dereference.strategies = [];
};
/* eslint-enable camelcase */
