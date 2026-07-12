import _includesInstanceProperty from "@babel/runtime-corejs3/core-js-stable/instance/includes";
import YAML, { JSON_SCHEMA } from 'js-yaml';
import { from, ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';
class YAMLParser extends Parser {
  constructor(options = {}) {
    super({
      name: 'yaml-1-2-swagger-client',
      mediaTypes: ['text/yaml', 'application/yaml'],
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
        YAML.load(file.toString(), {
          schema: JSON_SCHEMA
        });
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }
  async parse(file) {
    if (this.sourceMap) {
      throw new ParserError("yaml-1-2-swagger-client parser plugin doesn't support sourceMaps option");
    }
    const parseResultElement = new ParseResultElement();
    const source = file.toString();
    try {
      const pojo = YAML.load(source, {
        schema: JSON_SCHEMA
      });
      if (this.allowEmpty && typeof pojo === 'undefined') {
        return parseResultElement;
      }
      const element = from(pojo);
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
export default YAMLParser;