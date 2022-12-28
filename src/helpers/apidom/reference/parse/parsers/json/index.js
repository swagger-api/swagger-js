import { from, ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';

const JsonParser = Parser.compose({
  props: {
    name: 'json-swagger-client',
    fileExtensions: ['.json'],
    mediaTypes: ['application/json'],
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
          JSON.parse(file.toString());
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
        console.warn("json-swagger-client parser plugin doesn't support sourceMaps option");
      }

      const source = file.toString();

      try {
        const element = from(JSON.parse(source));
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
export default JsonParser;
