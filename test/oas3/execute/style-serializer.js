import { valueEncoder } from '../../../src/execute/oas3/style-serializer.js';

describe('OAS3 style serializer', () => {
  describe('valueEncoder', () => {
    test('should correctly encode ASCII characters', () => {
      const tested = (str) => valueEncoder(str, true);

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
      const tested = (str) => valueEncoder(str, true);
      expect(tested('♥')).toEqual('%E2%99%A5');
      expect(tested('テスト')).toEqual('%E3%83%86%E3%82%B9%E3%83%88');
      expect(tested('𩸽')).toEqual('%F0%A9%B8%BD');
      expect(tested('🍣')).toEqual('%F0%9F%8D%A3');
      expect(tested('👩‍👩‍👧‍👧')).toEqual(
        '%F0%9F%91%A9%E2%80%8D%F0%9F%91%A9%E2%80%8D%F0%9F%91%A7%E2%80%8D%F0%9F%91%A7'
      );
    });

    test('should skip encoding if `escape` is not set to true', () => {
      const tested = (str) => valueEncoder(str);

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

      // Non-ASCII too!
      expect(tested('♥')).toEqual('♥');
      expect(tested('テスト')).toEqual('テスト');
      expect(tested('𩸽')).toEqual('𩸽');
      expect(tested('🍣')).toEqual('🍣');
      expect(tested('👩‍👩‍👧‍👧')).toEqual('👩‍👩‍👧‍👧');
    });
  });
});
