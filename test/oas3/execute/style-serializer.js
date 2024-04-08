import { escape } from 'querystring';

import { encodeCharacters, valueEncoder } from '../../../src/execute/oas3/style-serializer.js';

describe('OAS3 style serializer', () => {
  describe('encodeCharacters', () => {
    test('should correctly encode ASCII characters', () => {
      const tested = (str) => encodeCharacters(str);

      expect(tested('!')).toEqual('%21');
      expect(tested('#')).toEqual('%23');
      expect(tested('$')).toEqual('%24');
      expect(tested('&')).toEqual('%26');
      expect(tested("'")).toEqual('%27');
      expect(tested('(')).toEqual('%28');
      expect(tested(')')).toEqual('%29');
      expect(tested('*')).toEqual('%2A');
      expect(tested('+')).toEqual('%2B');
      expect(tested(',')).toEqual('%2C');
      expect(tested('/')).toEqual('%2F');
      expect(tested(':')).toEqual('%3A');
      expect(tested(';')).toEqual('%3B');
      expect(tested('=')).toEqual('%3D');
      expect(tested('?')).toEqual('%3F');
      expect(tested('@')).toEqual('%40');
      expect(tested('[')).toEqual('%5B');
      expect(tested(']')).toEqual('%5D');
      expect(tested('%')).toEqual('%25');
      expect(tested('\n')).toEqual('%0A');
    });

    test('should correctly encode non-ASCII characters', () => {
      const tested = (str) => encodeCharacters(str);
      expect(tested('♥')).toEqual('%E2%99%A5');
      expect(tested('テスト')).toEqual('%E3%83%86%E3%82%B9%E3%83%88');
      expect(tested('𩸽')).toEqual('%F0%A9%B8%BD');
      expect(tested('🍣')).toEqual('%F0%9F%8D%A3');
      expect(tested('👩‍👩‍👧‍👧')).toEqual(
        '%F0%9F%91%A9%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A7%E2%80%8D%F0%9F%91%A7'
      );
    });
  });

  describe('valueEncoder', () => {
    test('should correctly encode primitive values with escape set to `reserved`', () => {
      const tested = (value) => valueEncoder(value, 'reserved');

      expect(tested(123)).toEqual('123');
      expect(tested('a#b$c%d[e]_~1')).toEqual(escape('a#b$c%d[e]_~1'));
      expect(tested(false)).toEqual('false');
    });

    test('should correctly encode primitive values with escape set to `unsafe`', () => {
      const tested = (value) => valueEncoder(value, 'unsafe');

      expect(tested(123)).toEqual('123');
      expect(tested('a#b$c%d[e]_~1')).toEqual(`a#b$c${escape('%')}d[e]_~1`);
      expect(tested(false)).toEqual(escape('false'));
    });

    test('should correctly encode objects with escape set to `reserved`', () => {
      const tested = (value) => valueEncoder(value, 'reserved');

      expect(tested({ a: 'a#b$c%d[e]_~1' })).toEqual(escape('{"a":"a#b$c%d[e]_~1"}'));
      expect(tested({ a: { b: { c: 'd' } } })).toEqual(escape('{"a":{"b":{"c":"d"}}}'));
      expect(tested({ a: 123 })).toEqual(escape('{"a":123}'));
      expect(tested({ a: false })).toEqual(escape('{"a":false}'));
    });

    test('should correctly encode objects with escape set to `unsafe`', () => {
      const tested = (value) => valueEncoder(value, 'unsafe');

      expect(tested({ a: 'a#b$c%d[e]_~1' })).toEqual(
        `${escape('{"a"')}:${escape('"')}a#b$c${escape('%')}d[e]_~1${escape('"}')}`
      );
      expect(tested({ a: { b: { c: 'd' } } })).toEqual(
        `${escape('{"a"')}:${escape('{"b"')}:${escape('{"c"')}:${escape('"d"}}}')}`
      );
      expect(tested({ a: 123 })).toEqual(`${escape('{"a"')}:${escape('123}')}`);
      expect(tested({ a: false })).toEqual(`${escape('{"a"')}:${escape('false}')}`);
    });

    test('should correctly encode arrays with escape set to `reserved`', () => {
      const tested = (value) => valueEncoder(value, 'reserved');

      expect(tested([1, 2, 3])).toEqual(escape('[1,2,3]'));
      expect(tested(['1', '2', 'a#b$c%d[e]_~1'])).toEqual(escape('["1","2","a#b$c%d[e]_~1"]'));
      expect(
        tested([
          {
            a: {
              b: 'c',
            },
          },
        ])
      ).toEqual(escape('[{"a":{"b":"c"}}]'));
      expect(
        tested([
          [
            {
              a: {
                b: 'c',
              },
            },
          ],
        ])
      ).toEqual(escape('[[{"a":{"b":"c"}}]]'));
    });

    test('should correctly encode arrays with escape set to `unsafe`', () => {
      const tested = (value) => valueEncoder(value, 'unsafe');

      expect(tested([1, 2, 3])).toEqual('[1,2,3]');
      expect(tested(['1', '2', 'a#b$c%d[e]_~1'])).toEqual(
        `[${escape('"1"')},${escape('"2"')},${escape('"')}a#b$c${escape('%')}d[e]_~1${escape('"')}]`
      );
      expect(
        tested([
          {
            a: {
              b: 'c',
            },
          },
        ])
      ).toEqual(`[${escape('{"a"')}:${escape('{"b"')}:${escape('"c"}}')}]`);
      expect(
        tested([
          [
            {
              a: {
                b: 'c',
              },
            },
          ],
        ])
      ).toEqual(`[[${escape('{"a"')}:${escape('{"b"')}:${escape('"c"}}')}]]`);
    });

    test('should skip encoding if `escape` is not set', () => {
      const tested = (value) => valueEncoder(value);

      expect(tested('!')).toEqual('!');
      expect(tested('#')).toEqual('#');
      expect(tested('$')).toEqual('$');
      expect(tested('&')).toEqual('&');
      expect(tested("'")).toEqual("'");
      expect(tested('(')).toEqual('(');
      expect(tested(')')).toEqual(')');
      expect(tested('*')).toEqual('*');
      expect(tested('+')).toEqual('+');
      expect(tested(',')).toEqual(',');
      expect(tested('/')).toEqual('/');
      expect(tested(':')).toEqual(':');
      expect(tested(';')).toEqual(';');
      expect(tested('=')).toEqual('=');
      expect(tested('?')).toEqual('?');
      expect(tested('@')).toEqual('@');
      expect(tested('[')).toEqual('[');
      expect(tested(']')).toEqual(']');
      expect(tested('\n')).toEqual('\n');

      // Non-ASCII
      expect(tested('♥')).toEqual('♥');
      expect(tested('テスト')).toEqual('テスト');
      expect(tested('𩸽')).toEqual('𩸽');
      expect(tested('🍣')).toEqual('🍣');
      expect(tested('👩‍👩‍👧‍👧')).toEqual('👩‍👩‍👧‍👧');

      // Primitive
      expect(tested(123)).toEqual('123');
      expect(tested(false)).toEqual('false');

      // Objects
      expect(tested({ a: 'a#b$c%d[e]_~1' })).toEqual('{"a":"a#b$c%d[e]_~1"}');
      expect(tested({ a: { b: { c: 'd' } } })).toEqual('{"a":{"b":{"c":"d"}}}');
      expect(tested({ a: 123 })).toEqual('{"a":123}');
      expect(tested({ a: false })).toEqual('{"a":false}');

      // Arrays
      expect(tested([1, 2, 3])).toEqual('[1,2,3]');
      expect(tested(['1', '2', 'a#b$c%d[e]_~1'])).toEqual('["1","2","a#b$c%d[e]_~1"]');
      expect(
        tested([
          {
            a: {
              b: 'c',
            },
          },
          {
            d: {
              e: 'f',
            },
          },
        ])
      ).toEqual('[{"a":{"b":"c"}},{"d":{"e":"f"}}]');
      expect(
        tested([
          [
            {
              a: {
                b: 'c',
              },
            },
          ],
        ])
      ).toEqual('[[{"a":{"b":"c"}}]]');
    });
  });
});
