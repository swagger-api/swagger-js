import { Buffer } from 'node:buffer';
import { isParseResultElement } from '@swagger-api/apidom-core';
import { File, ParserError } from '@swagger-api/apidom-reference/configuration/empty';

import JSONParser from '../../../../../../../src/resolver/apidom/reference/parse/parsers/json/index.js';

describe('JSONParser', () => {
  describe('canParse', () => {
    describe('given file with .json extension', () => {
      test('should return true', async () => {
        const file = new File({ uri: '/path/to/file.json', data: '{"a":"b"}' });
        const parser = new JSONParser();

        expect(await parser.canParse(file)).toBe(true);
      });
    });

    describe('given file with unknown extension', () => {
      test('should return false', async () => {
        const file = new File({ uri: '/path/to/file.yaml' });
        const parser = new JSONParser();

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with no extension', () => {
      test('should return false', async () => {
        const file = new File({ uri: '/path/to/file' });
        const parser = new JSONParser();

        expect(await parser.canParse(file)).toBe(false);
      });
    });

    describe('given file with supported extension', () => {
      describe('and file data is buffer and can be detected as JSON', () => {
        test('should return true', async () => {
          const file = new File({
            uri: '/path/to/json-file.json',
            data: Buffer.from('{"a":"b"}'),
          });
          const parser = new JSONParser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });

      describe('and file data is string and can be detected as JSON', () => {
        test('should return true', async () => {
          const file = new File({
            uri: '/path/to/json-file.json',
            data: '{"a":"b"}',
          });
          const parser = new JSONParser();

          expect(await parser.canParse(file)).toBe(true);
        });
      });
    });
  });

  describe('parse', () => {
    describe('given generic JSON data', () => {
      test('should return parse result', async () => {
        const file = new File({ uri: '/path/to/file.json', data: '{"prop": "val"}' });
        const parser = new JSONParser();
        const result = await parser.parse(file);
        const objElement = result.get(0);

        expect(isParseResultElement(result)).toBe(true);
        expect(objElement.get('prop').equals('val')).toBe(true);
      });
    });

    describe('given generic JSON data as buffer', () => {
      test('should return parse result', async () => {
        const file = new File({ uri: '/path/to/file.json', data: Buffer.from('{"prop": "val"}') });
        const parser = new JSONParser();
        const result = await parser.parse(file);
        const objElement = result.get(0);

        expect(isParseResultElement(result)).toBe(true);
        expect(objElement.get('prop').equals('val')).toBe(true);
      });
    });

    describe('given data that is not a generic JSON data', () => {
      test('should coerce to string and parse', async () => {
        const file = new File({ uri: '/path/to/file.json', data: 1 });
        const parser = new JSONParser();
        const result = await parser.parse(file);
        const numberElement = result.get(0);

        expect(isParseResultElement(result)).toBe(true);
        expect(numberElement.equals(1)).toBe(true);
      });
    });

    describe('given empty file', () => {
      test('should return empty parse result', async () => {
        const file = new File({ uri: '/path/to/file.json', data: '' });
        const parser = new JSONParser();
        const result = await parser.parse(file);

        expect(isParseResultElement(result)).toBe(true);
        expect(result.isEmpty).toBe(true);
      });
    });

    describe('sourceMap', () => {
      describe('given sourceMap enabled', () => {
        test('should throw error', async () => {
          const file = new File({ uri: '/path/to/file.json', data: '{"prop": "val"}' });
          const parser = new JSONParser({ sourceMap: true });
          const parseWithSourceMapThunk = () => parser.parse(file);

          await expect(parseWithSourceMapThunk()).rejects.toThrow(
            new ParserError("json-swagger-client parser plugin doesn't support sourceMaps option")
          );
        });
      });

      describe('given sourceMap disabled', () => {
        test('should not decorate ApiDOM with source maps', async () => {
          const file = new File({ uri: '/path/to/file.json', data: '{"prop": "val"}' });
          const parser = new JSONParser({ sourceMap: false });
          const result = await parser.parse(file);
          const objElement = result.get(0);

          expect(objElement.meta.get('sourceMap')).toBeUndefined();
        });
      });
    });
  });
});
