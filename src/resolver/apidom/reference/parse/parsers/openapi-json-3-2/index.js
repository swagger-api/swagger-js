/* eslint-disable camelcase */
import { ParseResultElement } from '@swagger-api/apidom-core';
import { ParserError, Parser } from '@swagger-api/apidom-reference/configuration/empty';
import {
  mediaTypes,
  OpenApi3_2Element,
  OpenAPIMediaTypes,
} from '@swagger-api/apidom-ns-openapi-3-2';

class OpenAPIJSON3_2Parser extends Parser {
  detectionRegExp = /"openapi"\s*:\s*"(?<version_json>3\.2\.(?:[1-9]\d*|0))"/;

  constructor(options = {}) {
    super({
      name: 'openapi-json-3-2-swagger-client',
      mediaTypes: new OpenAPIMediaTypes(
        ...mediaTypes.filterByFormat('generic'),
        ...mediaTypes.filterByFormat('json')
      ),
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
        const source = file.toString();
        JSON.parse(source);
        return this.detectionRegExp.test(source);
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  async parse(file) {
    if (this.sourceMap) {
      throw new ParserError(
        "openapi-json-3-2-swagger-client parser plugin doesn't support sourceMaps option"
      );
    }

    const parseResultElement = new ParseResultElement();
    const source = file.toString();

    // allow empty files
    if (this.allowEmpty && source.trim() === '') {
      return parseResultElement;
    }

    try {
      const pojo = JSON.parse(source);
      const element = OpenApi3_2Element.refract(pojo, this.refractorOpts);
      element.classes.push('result');
      parseResultElement.push(element);
      return parseResultElement;
    } catch (error) {
      throw new ParserError(`Error parsing "${file.uri}"`, { cause: error });
    }
  }
}

export default OpenAPIJSON3_2Parser;
/* eslint-enable camelcase */
