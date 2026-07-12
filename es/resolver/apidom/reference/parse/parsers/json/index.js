import _includesInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/includes";
import { from, ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';
class JSONParser extends Parser {
  constructor(options = {}) {
    super({
      name: 'json-swagger-client',
      mediaTypes: ['application/json'],
      ...options
    });
  }
  async canParse(file) {
    var _context, _context2;
    const hasSupportedFileExtension = this.fileExtensions.length === 0 ? true : _includesInstanceProperty(_context = this.fileExtensions).call(_context, file.extension);
    const hasSupportedMediaType = _includesInstanceProperty(_context2 = this.mediaTypes).call(_context2, file.mediaType);
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
      throw new ParserError(`Error parsing "${file.uri}"`, {
        cause: error
      });
    }
  }
}
export default JSONParser;