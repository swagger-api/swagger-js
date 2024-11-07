import fs from 'node:fs';
import path from 'node:path';
import { isParseResultElement } from '@swagger-api/apidom-core';
import { File, ParserError } from '@swagger-api/apidom-reference/configuration/empty';
import { mediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';

// eslint-disable-next-line camelcase
import OpenAPIYaml3_1Parser from '../../../../../../../src/resolver/apidom/reference/parse/parsers/openapi-yaml-3-1/index.js';

describe('OpenAPIYaml3_1Parser', () => {
  describe('canParser', () => {
    describe('given file with .yaml extension', () => {
      describe('and with proper media type', () => {
        test('should return true', async () => {
          const file1 = new File({
            uri: '/path/to/openapi.yaml',
            mediaType: mediaTypes.latest('generic'),
          });
          const file2 = new File({
            uri: '/path/to/openapi.yaml',
            mediaType: mediaTypes.latest('yaml'),
          });
          const parser = new OpenAPIYaml3_1Parser();

          expect(await parser.canParse(file1)).toBe(true);
          expect(await parser.canParse(file2)).toBe(true);
        });
      });

      describe('and with improper media type', () => {
        test('should return false', async () => {
          const file = new File({
            uri: '/path/to/openapi.yaml',
            mediaType: 'application/vnd.aai.asyncapi+json;version=2.5.0',
          });
          const parser = new OpenAPIYaml3_1Parser();

          expect(await parser.canParse(file)).toBe(false);
        });
      });
    });

    describe('given file with .yml extension', () => {
      describe('and with proper media type', () => {
        test('should return true', async () => {
          const file1 = new File({
            uri: '/path/to/openapi.yml',
            mediaType: mediaTypes.latest('generic'),
          });
          const file2 = new File({
            uri: '/path/to/openapi.yaml',
            mediaType: mediaTypes.latest('yaml'),
          });
          const parser = new OpenAPIYaml3_1Parser();

          expect(await parser.canParse(file1)).toBe(true);
          expect(await parser.canParse(file2)).toBe(true);
        });
      });

      describe('and with improper media type', () => {
        test('should return false', async () => {
          const file = new File({
            uri: '/path/to/openapi.yaml',
            mediaType: 'application/vnd.aai.asyncapi+json;version=2.5.0',
          });
          const parser = new OpenAPIYaml3_1Parser();

          expect(await parser.canParse(file)).toBe(false);
        });
      });
    });

    describe('given file with unknown extension', () => {
      test('should return false', async () => {
        const file = new File({
          uri: '/path/to/openapi.json',
          mediaType: mediaTypes.latest('yaml'),
        });
        const parser = new OpenAPIYaml3_1Parser({ fileExtensions: ['.yaml', '.yml'] });

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with no extension', () => {
      test('should return false', async () => {
        const file = new File({
          uri: '/path/to/openapi',
          mediaType: mediaTypes.latest('yaml'),
        });
        const parser = new OpenAPIYaml3_1Parser({ fileExtensions: ['.yaml', '.yml'] });

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with supported extension', () => {
      describe('and file data is buffer and can be detected as OpenAPI 3.1.0', () => {
        test('should return true', async () => {
          const url = path.join(__dirname, '__fixtures__', 'sample-api.yaml');
          const file = new File({
            uri: '/path/to/open-api.yaml',
            data: fs.readFileSync(url),
          });
          const parser = new OpenAPIYaml3_1Parser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });

      describe('and file data is string and can be detected as OpenAPI 3.1.0', () => {
        test('should return true', async () => {
          const url = path.join(__dirname, '__fixtures__', 'sample-api.yaml');
          const file = new File({
            uri: '/path/to/open-api.yaml',
            data: fs.readFileSync(url).toString(),
          });
          const parser = new OpenAPIYaml3_1Parser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });
    });
  });

  describe('parse', () => {
    describe('given OpenApi 3.1.x YAML data', () => {
      test('should return parse result', async () => {
        const url = path.join(__dirname, '__fixtures__', 'sample-api.yaml');
        const data = fs.readFileSync(url).toString();
        const file = new File({
          url,
          data,
          mediaType: mediaTypes.latest('yaml'),
        });
        const parser = new OpenAPIYaml3_1Parser();
        const parseResult = await parser.parse(file);

        expect(isParseResultElement(parseResult)).toBe(true);
      });
    });

    describe('given OpenApi 3.1.x YAML data as buffer', () => {
      test('should return parse result', async () => {
        const url = path.join(__dirname, '__fixtures__', 'sample-api.yaml');
        const data = fs.readFileSync(url);
        const file = new File({
          url,
          data,
          mediaType: mediaTypes.latest('yaml'),
        });
        const parser = new OpenAPIYaml3_1Parser();
        const parseResult = await parser.parse(file);

        expect(isParseResultElement(parseResult)).toBe(true);
      });
    });

    describe('given data that is not an OpenApi 3.1.x YAML data', () => {
      test('should coerce to string and parse', async () => {
        const file = new File({
          uri: '/path/to/file.yaml',
          data: 1,
          mediaType: mediaTypes.latest('yaml'),
        });
        const parser = new OpenAPIYaml3_1Parser();
        const parseResult = await parser.parse(file);
        const numberElement = parseResult.get(0);

        expect(isParseResultElement(parseResult)).toBe(true);
        expect(numberElement.equals(1)).toBe(true);
      });
    });

    describe('given empty file', () => {
      test('should return empty parse result', async () => {
        const file = new File({
          uri: '/path/to/file.yaml',
          data: '',
          mediaType: mediaTypes.latest('yaml'),
        });
        const parser = new OpenAPIYaml3_1Parser();
        const parseResult = await parser.parse(file);

        expect(isParseResultElement(parseResult)).toBe(true);
        expect(parseResult.isEmpty).toBe(true);
      });
    });

    describe('sourceMap', () => {
      describe('given sourceMap enabled', () => {
        test('should throw error', async () => {
          const file = new File({ uri: '/path/to/file.yaml', data: 'prop: val' });
          const parser = new OpenAPIYaml3_1Parser({ sourceMap: true });
          const parseWithSourceMapThunk = () => parser.parse(file);

          await expect(parseWithSourceMapThunk()).rejects.toThrow(
            new ParserError(
              "openapi-yaml-3-1-swagger-client parser plugin doesn't support sourceMaps option"
            )
          );
        });
      });

      describe('given sourceMap disabled', () => {
        test('should not decorate ApiDOM with source maps', async () => {
          const url = path.join(__dirname, '__fixtures__', 'sample-api.yaml');
          const data = fs.readFileSync(url).toString();
          const file = new File({
            url,
            data,
            mediaType: mediaTypes.latest('yaml'),
          });
          const parser = new OpenAPIYaml3_1Parser();
          const parseResult = await parser.parse(file);

          expect(parseResult.api.meta.get('sourceMap')).toBeUndefined();
        });
      });
    });
  });
});
