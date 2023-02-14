/* eslint-disable camelcase */
import YAML, { JSON_SCHEMA } from 'js-yaml';
import { ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';
import {
  mediaTypes,
  OpenApi3_1Element,
  OpenAPIMediaTypes,
} from '@swagger-api/apidom-ns-openapi-3-1';

const OpenApiYaml3_1Parser = Parser.compose({
  props: {
    name: 'openapi-yaml-3-1-swagger-client',
    fileExtensions: ['.yaml', '.yml'],
    mediaTypes: new OpenAPIMediaTypes(
      ...mediaTypes.filterByFormat('generic'),
      ...mediaTypes.filterByFormat('yaml')
    ),
    detectionRegExp:
      /(?<YAML>^(["']?)openapi\2\s*:\s*(["']?)(?<version_yaml>3\.1\.(?:[1-9]\d*|0))\3(?:\s+|$))|(?<JSON>"openapi"\s*:\s*"(?<version_json>3\.1\.(?:[1-9]\d*|0))")/m,
  },
  methods: {
    async canParse(file) {
      const hasSupportedFileExtension =
        this.fileExtensions.length === 0 ? true : this.fileExtensions.includes(file.extension);
      const hasSupportedMediaType = this.mediaTypes.includes(file.mediaType);

      if (!hasSupportedFileExtension) return false;
      if (hasSupportedMediaType) return true;
      if (!hasSupportedMediaType) {
        try {
          const source = file.toString();
          YAML.load(source);
          return this.detectionRegExp.test(source);
        } catch (error) {
          return false;
        }
      }
      return false;
    },

    async parse(file) {
      if (this.sourceMap) {
        throw new ParserError(
          "openapi-yaml-3-1-swagger-client parser plugin doesn't support sourceMaps option"
        );
      }

      const parseResultElement = new ParseResultElement();
      const source = file.toString();

      try {
        const pojo = YAML.load(source, { schema: JSON_SCHEMA });

        if (this.allowEmpty && typeof pojo === 'undefined') {
          return parseResultElement;
        }

        const element = OpenApi3_1Element.refract(pojo, this.refractorOpts);
        element.classes.push('result');
        parseResultElement.push(element);
        return parseResultElement;
      } catch (error) {
        throw new ParserError(`Error parsing "${file.uri}"`, error);
      }
    },
  },
});

export default OpenApiYaml3_1Parser;
/* eslint-enable camelcase */
