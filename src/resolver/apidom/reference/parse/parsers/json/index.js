import { from, ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';

class JSONParser extends Parser {
  constructor(options = {}) {
    super({
      name: 'json-swagger-client',
      mediaTypes: ['application/json'],
      ...options,
    });
  }

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
  }

  async parse(file) {
    if (this.sourceMap) {
      throw new ParserError("json-swagger-client parser plugin doesn't support sourceMaps option");
    }

    const parseResultElement = new ParseResultElement();
    const source = file.toString();

    // allow empty files
    if (this.allowEmpty && source.trim() === '') {
      return parseResultElement;
    }

    try {
      const element = from(JSON.parse(source));
      element.classes.push('result');
      parseResultElement.push(element);
      return parseResultElement;
    } catch (error) {
      throw new ParserError(`Error parsing "${file.uri}"`, { cause: error });
    }
  }
}

export default JSONParser;
