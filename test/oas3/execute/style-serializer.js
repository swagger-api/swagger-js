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
    test('should correctly encode primitive values with `escape` set to `reserved`', () => {
      const tested = (value) => valueEncoder(value, 'reserved');

      expect(tested(123)).toEqual('123');
      expect(tested('a#b$c%d[e]_~1')).toEqual('a%23b%24c%25d%5Be%5D_~1');
      expect(tested(false)).toEqual('false');
    });

    test('should correctly encode primitive values with `escape` set to `unsafe`', () => {
      const tested = (value) => valueEncoder(value, 'unsafe');

      expect(tested(123)).toEqual('123');
      expect(tested('a#b$c%d[e]_~1')).toEqual('a#b$c%25d[e]_~1');
      expect(tested(false)).toEqual('false');
    });

    test('should correctly encode objects with `escape` set to `reserved`', () => {
      const tested = (value) => valueEncoder(value, 'reserved');

      expect(tested({ a: 'a#b$c%d[e]_~1' })).toEqual(
        '%7B%22a%22%3A%22a%23b%24c%25d%5Be%5D_~1%22%7D'
      );
      expect(tested({ a: { b: { c: 'd' } } })).toEqual(
        '%7B%22a%22%3A%7B%22b%22%3A%7B%22c%22%3A%22d%22%7D%7D%7D'
      );
      expect(tested({ a: 123 })).toEqual('%7B%22a%22%3A123%7D');
      expect(tested({ a: false })).toEqual('%7B%22a%22%3Afalse%7D');
    });

    test('should correctly encode objects with `escape` set to `unsafe`', () => {
      const tested = (value) => valueEncoder(value, 'unsafe');

      expect(tested({ a: 'a#b$c%d[e]_~1' })).toEqual('%7B%22a%22:%22a#b$c%25d[e]_~1%22%7D');
      expect(tested({ a: { b: { c: 'd' } } })).toEqual(
        '%7B%22a%22:%7B%22b%22:%7B%22c%22:%22d%22%7D%7D%7D'
      );
      expect(tested({ a: 123 })).toEqual('%7B%22a%22:123%7D');
      expect(tested({ a: false })).toEqual('%7B%22a%22:false%7D');
    });

    test('should correctly encode arrays with `escape` set to `reserved`', () => {
      const tested = (value) => valueEncoder(value, 'reserved');

      expect(tested([1, 2, 3])).toEqual('%5B1%2C2%2C3%5D');
      expect(tested(['1', '2', 'a#b$c%d[e]_~1'])).toEqual(
        '%5B%221%22%2C%222%22%2C%22a%23b%24c%25d%5Be%5D_~1%22%5D'
      );
      expect(
        tested([
          {
            a: {
              b: 'c',
            },
          },
        ])
      ).toEqual('%5B%7B%22a%22%3A%7B%22b%22%3A%22c%22%7D%7D%5D');
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
      ).toEqual('%5B%5B%7B%22a%22%3A%7B%22b%22%3A%22c%22%7D%7D%5D%5D');
    });

    test('should correctly encode arrays with `escape` set to `unsafe`', () => {
      const tested = (value) => valueEncoder(value, 'unsafe');

      expect(tested([1, 2, 3])).toEqual('[1,2,3]');
      expect(tested(['1', '2', 'a#b$c%d[e]_~1'])).toEqual(
        '[%221%22,%222%22,%22a#b$c%25d[e]_~1%22]'
      );
      expect(
        tested([
          {
            a: {
              b: 'c',
            },
          },
        ])
      ).toEqual('[%7B%22a%22:%7B%22b%22:%22c%22%7D%7D]');
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
      ).toEqual('[[%7B%22a%22:%7B%22b%22:%22c%22%7D%7D]]');
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
