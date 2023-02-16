import YAML, { JSON_SCHEMA } from 'js-yaml';
import { from, ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';

const YamlParser = Parser.compose({
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
        throw new ParserError(
          "yaml-1-2-swagger-client parser plugin doesn't support sourceMaps option"
        );
      }

      const parseResultElement = new ParseResultElement();
      const source = file.toString();

      try {
        const pojo = YAML.load(source, { schema: JSON_SCHEMA });

        if (this.allowEmpty && typeof pojo === 'undefined') {
          return parseResultElement;
        }

        const element = from(pojo);
        element.classes.push('result');
        parseResultElement.push(element);
        return parseResultElement;
      } catch (error) {
        throw new ParserError(`Error parsing "${file.uri}"`, { cause: error });
      }
    },
  },
});

export default YamlParser;
