/* eslint-disable camelcase */
import { options } from '@swagger-api/apidom-reference/configuration/empty';
import FileResolver from '@swagger-api/apidom-reference/resolve/resolvers/file';
import BinaryParser from '@swagger-api/apidom-reference/parse/parsers/binary';
import OpenApi3_1ResolveStrategy from '@swagger-api/apidom-reference/resolve/strategies/openapi-3-1';

import JsonParser from '../../../../../../../../src/helpers/apidom/reference/parse/parsers/json/index.js';
import YamlParser from '../../../../../../../../src/helpers/apidom/reference/parse/parsers/yaml-1-2/index.js';
import OpenApiJson3_1Parser from '../../../../../../../../src/helpers/apidom/reference/parse/parsers/openapi-json-3-1/index.js';
import OpenApiYaml3_1Parser from '../../../../../../../../src/helpers/apidom/reference/parse/parsers/openapi-yaml-3-1/index.js';
import HttpResolverSwaggerClient from '../../../../../../../../src/helpers/apidom/reference/resolve/resolvers/http-swagger-client/index.js';
import OpenApi3_1SwaggerClientDereferenceStrategy from '../../../../../../../../src/helpers/apidom/reference/dereference/strategies/openapi-3-1-swagger-client/index.js';

export const beforeAll = () => {
  // configure custom parser plugins globally
  options.parse.parsers = [
    OpenApiJson3_1Parser({ allowEmpty: false, sourceMap: false }),
    OpenApiYaml3_1Parser({ allowEmpty: false, sourceMap: false }),
    JsonParser({ allowEmpty: false, sourceMap: false }),
    YamlParser({ allowEmpty: false, sourceMap: false }),
    BinaryParser({ allowEmpty: false, sourceMap: false }),
  ];

  // configure custom resolver plugins globally
  options.resolve.resolvers = [FileResolver({ fileAllowList: ['*'] }), HttpResolverSwaggerClient()];

  // configure custom resolver strategies globally
  options.resolve.strategies = [OpenApi3_1ResolveStrategy()];

  // configure custom dereference strategy globally
  options.dereference.strategies = [OpenApi3_1SwaggerClientDereferenceStrategy()];
};

export const afterAll = () => {
  options.parse.parsers = [];
  options.resolve.resolvers = [];
  options.resolve.strategies = [];
  options.dereference.strategies = [];
};
/* eslint-enable camelcase */
