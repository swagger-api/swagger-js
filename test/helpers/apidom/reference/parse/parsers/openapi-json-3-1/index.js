import fs from 'node:fs';
import path from 'node:path';
import { isParseResultElement } from '@swagger-api/apidom-core';
import { File, ParserError } from '@swagger-api/apidom-reference/configuration/empty';
import { mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';

// eslint-disable-next-line camelcase
import OpenApiJson3_1Parser from '../../../../../../../src/helpers/apidom/reference/parse/parsers/openapi-json-3-1/index.js';

describe('OpenApiJson3_1Parser', () => {
  describe('canParser', () => {
    describe('given file with .json extension', () => {
      describe('and with proper media type', () => {
        test('should return true', async () => {
          const file1 = File({
            uri: '/path/to/openapi.json',
            mediaType: mediaTypes.latest('generic'),
          });
          const file2 = File({
            uri: '/path/to/openapi.json',
            mediaType: mediaTypes.latest('json'),
          });
          const parser = OpenApiJson3_1Parser();

          expect(await parser.canParse(file1)).toBe(true);
          expect(await parser.canParse(file2)).toBe(true);
        });
      });

      describe('and with improper media type', () => {
        test('should return false', async () => {
          const file = File({
            uri: '/path/to/openapi.json',
            mediaType: 'application/vnd.aai.asyncapi+json;version=2.5.0',
          });
          const parser = OpenApiJson3_1Parser();

          expect(await parser.canParse(file)).toBe(false);
        });
      });
    });

    describe('given file with unknown extension', () => {
      test('should return false', async () => {
        const file = File({
          uri: '/path/to/openapi.yaml',
          mediaType: mediaTypes.latest('json'),
        });
        const parser = OpenApiJson3_1Parser();

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with no extension', () => {
      test('should return false', async () => {
        const file = File({
          uri: '/path/to/openapi',
          mediaType: mediaTypes.latest('json'),
        });
        const parser = OpenApiJson3_1Parser();

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with supported extension', () => {
      describe('and file data is buffer and can be detected as OpenAPI 3.1.0', () => {
        test('should return true', async () => {
          const url = path.join(__dirname, 'fixtures', 'sample-api.json');
          const file = File({
            uri: '/path/to/open-api.json',
            data: fs.readFileSync(url),
          });
          const parser = OpenApiJson3_1Parser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });

      describe('and file data is string and can be detected as OpenAPI 3.1.0', () => {
        test('should return true', async () => {
          const url = path.join(__dirname, 'fixtures', 'sample-api.json');
          const file = File({
            uri: '/path/to/open-api.json',
            data: fs.readFileSync(url).toString(),
          });
          const parser = OpenApiJson3_1Parser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });
    });
  });

  describe('parse', () => {
    describe('given OpenApi 3.1.x JSON data', () => {
      test('should return parse result', async () => {
        const url = path.join(__dirname, 'fixtures', 'sample-api.json');
        const data = fs.readFileSync(url).toString();
        const file = File({
          url,
          data,
          mediaType: mediaTypes.latest('json'),
        });
        const parser = OpenApiJson3_1Parser();
        const parseResult = await parser.parse(file);

        expect(isParseResultElement(parseResult)).toBe(true);
      });
    });

    describe('given OpenApi 3.1.x JSON data as buffer', () => {
      test('should return parse result', async () => {
        const url = path.join(__dirname, 'fixtures', 'sample-api.json');
        const data = fs.readFileSync(url);
        const file = File({
          url,
          data,
          mediaType: mediaTypes.latest('json'),
        });
        const parser = OpenApiJson3_1Parser();
        const parseResult = await parser.parse(file);

        expect(isParseResultElement(parseResult)).toBe(true);
      });
    });

    describe('given data that is not an OpenApi 3.1.x JSON data', () => {
      test('should coerce to string and parse', async () => {
        const file = File({
          uri: '/path/to/file.json',
          data: 1,
          mediaType: mediaTypes.latest('json'),
        });
        const parser = OpenApiJson3_1Parser();
        const parseResult = await parser.parse(file);
        const numberElement = parseResult.get(0);

        expect(isParseResultElement(parseResult)).toBe(true);
        expect(numberElement.equals(1)).toBe(true);
      });
    });

    describe('given empty file', () => {
      test('should return empty parse result', async () => {
        const file = File({
          uri: '/path/to/file.json',
          data: '',
          mediaType: mediaTypes.latest('json'),
        });
        const parser = OpenApiJson3_1Parser();
        const parseResult = await parser.parse(file);

        expect(isParseResultElement(parseResult)).toBe(true);
        expect(parseResult.isEmpty).toBe(true);
      });
    });

    describe('sourceMap', () => {
      describe('given sourceMap enabled', () => {
        test('should throw error', () => {
          const file = File({ uri: '/path/to/file.json', data: '{"prop": "val"}' });
          const parser = OpenApiJson3_1Parser({ sourceMap: true });
          const parseWithSourceMap = () => parser.parse(file);

          expect(parseWithSourceMap).rejects.toThrow(
            new ParserError(
              "openapi-json-3-1-swagger-client parser plugin doesn't support sourceMaps option"
            )
          );
        });
      });

      describe('given sourceMap disabled', () => {
        test('should not decorate ApiDOM with source maps', async () => {
          const url = path.join(__dirname, 'fixtures', 'sample-api.json');
          const data = fs.readFileSync(url).toString();
          const file = File({
            url,
            data,
            mediaType: mediaTypes.latest('json'),
          });
          const parser = OpenApiJson3_1Parser();
          const parseResult = await parser.parse(file);

          expect(parseResult.api.meta.get('sourceMap')).toBeUndefined();
        });
      });
    });
  });
});
