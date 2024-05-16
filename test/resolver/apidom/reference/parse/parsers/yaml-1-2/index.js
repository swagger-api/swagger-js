import { Buffer } from 'node:buffer';
import { isParseResultElement } from '@swagger-api/apidom-core';
import { File, ParserError } from '@swagger-api/apidom-reference/configuration/empty';

import YAMLParser from '../../../../../../../src/resolver/apidom/reference/parse/parsers/yaml-1-2/index.js';

describe('YAMLParser', () => {
  describe('canParse', () => {
    describe('given file with .yaml extension', () => {
      test('should return true', async () => {
        const file = new File({ uri: '/path/to/file.yaml', data: '{"a":"b"}' });
        const parser = new YAMLParser();

        expect(await parser.canParse(file)).toBe(true);
      });
    });

    describe('given file with .yml extension', () => {
      test('should return true', async () => {
        const file = new File({ uri: '/path/to/file.yml', data: '{"a":"b"}' });
        const parser = new YAMLParser();

        expect(await parser.canParse(file)).toBe(true);
      });
    });

    describe('given file with unknown extension', () => {
      test('should return false', async () => {
        const file = new File({ uri: '/path/to/file.txt' });
        const parser = new YAMLParser();

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with no extension', () => {
      test('should return false', async () => {
        const file = new File({ uri: '/path/to/file' });
        const parser = new YAMLParser();

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with supported extension', () => {
      describe('and file data is buffer and can be detected as YAML 1.2', () => {
        test('should return true', async () => {
          const file = new File({
            uri: '/path/to/yaml-file.yaml',
            data: Buffer.from('key: value'),
          });
          const parser = new YAMLParser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });

      describe('and file data is string and can be detected as YAML 1.2', () => {
        test('should return true', async () => {
          const file = new File({
            uri: '/path/to/yaml-file.yaml',
            data: 'key: value',
          });
          const parser = new YAMLParser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });
    });
  });

  describe('parse', () => {
    describe('given generic YAML data', () => {
      test('should return parse result', async () => {
        const file = new File({ uri: '/path/to/file.json', data: 'prop: val' });
        const parser = new YAMLParser();
        const result = await parser.parse(file);
        const objElement = result.get(0);

        expect(isParseResultElement(result)).toBe(true);
        expect(objElement.get('prop').equals('val')).toBe(true);
      });
    });

    describe('given generic YAML data as buffer', () => {
      test('should return parse result', async () => {
        const file = new File({ uri: '/path/to/file.yaml', data: Buffer.from('prop: val') });
        const parser = new YAMLParser();
        const result = await parser.parse(file);
        const objElement = result.get(0);

        expect(isParseResultElement(result)).toBe(true);
        expect(objElement.get('prop').equals('val')).toBe(true);
      });
    });

    describe('given data that is not a generic YAML data', () => {
      test('should coerce to string and parse', async () => {
        const file = new File({ uri: '/path/to/file.yaml', data: 1 });
        const parser = new YAMLParser();
        const result = await parser.parse(file);
        const numberElement = result.get(0);

        expect(isParseResultElement(result)).toBe(true);
        expect(numberElement.equals(1)).toBe(true);
      });
    });

    describe('given empty file', () => {
      test('should return empty parse result', async () => {
        const file = new File({ uri: '/path/to/file.yaml', data: '' });
        const parser = new YAMLParser();
        const result = await parser.parse(file);

        expect(isParseResultElement(result)).toBe(true);
        expect(result.isEmpty).toBe(true);
      });
    });

    describe('sourceMap', () => {
      describe('given sourceMap enabled', () => {
        test('should throw error', () => {
          const file = new File({ uri: '/path/to/file.yaml', data: 'prop: val' });
          const parser = new YAMLParser({ sourceMap: true });
          const parseWithSourceMap = () => parser.parse(file);

          expect(parseWithSourceMap()).rejects.toThrow(
            new ParserError(
              "yaml-1-2-swagger-client parser plugin doesn't support sourceMaps option"
            )
          );
        });
      });

      describe('given sourceMap disabled', () => {
        test('should not decorate ApiDOM with source maps', async () => {
          const file = new File({ uri: '/path/to/file.yaml', data: 'prop: val' });
          const parser = new YAMLParser({ sourceMap: false });
          const result = await parser.parse(file);
          const objElement = result.get(0);

          expect(objElement.meta.get('sourceMap')).toBeUndefined();
        });
      });
    });
  });
});
