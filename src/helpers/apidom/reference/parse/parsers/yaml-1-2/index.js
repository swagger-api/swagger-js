import YAML, { JSON_SCHEMA } from 'js-yaml';
import { from, ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';

const YamlParser = Parser.compose(Parser, {
  props: {
    name: 'yaml-1-2-swagger-client',
    fileExtensions: ['.yaml', '.yml'],
    mediaTypes: ['text/yaml', 'application/yaml'],
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
          YAML.load(file.toString(), { schema: JSON_SCHEMA });
          return true;
        } catch (error) {
          return false;
        }
      }
      return false;
    },

    async parse(file) {
      if (this.sourceMap) {
        // eslint-disable-next-line no-console
        console.warn("yaml-1-2-swagger-client parser plugin doesn't support sourceMaps option");
      }

      const source = file.toString();

      try {
        const element = from(YAML.load(source, { schema: JSON_SCHEMA }));
        const parseResultElement = new ParseResultElement();

        element.classes.push('result');
        parseResultElement.push(element);
        return parseResultElement;
      } catch (error) {
        throw new ParserError(`Error parsing "${file.uri}"`, error);
      }
    },
  },
});

export default YamlParser;
