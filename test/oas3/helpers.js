import { isOAS3, isSwagger2 } from '../../src/helpers/index.js';

describe('helpers - OpenAPI Specification 3.0', () => {
  describe('isOAS3', () => {
    test('should recognize supported OpenAPI 3.0 versions', () => {
      // When
      const spec = {
        openapi: '3.0.0',
      };

      // Then
      expect(isOAS3(spec)).toEqual(true);
    });
    test('should reject a swagger 2 signature', () => {
      // When
      const spec = {
        swagger: '2.0',
      };

      // Then
      expect(isOAS3(spec)).toEqual(false);
    });
  });
  describe('isSwagger2', () => {
    test('should recognize supported Swagger 2.0 versions', () => {
      // When
      const spec = {
        swagger: '2.0',
      };

      // Then
      expect(isSwagger2(spec)).toEqual(true);
    });
    test('should reject a swagger 1.0 signature', () => {
      // When
      const spec = {
        swagger: '1.0',
      };

      // Then
      expect(isSwagger2(spec)).toEqual(false);
    });
  });
});
