import {
  isOpenAPI30,
  isOpenAPI31,
  isOpenAPI3,
  isOpenAPI2,
  isSwagger2,
} from '../../src/helpers/openapi-predicates.js';

describe('helpers', () => {
  describe('OpenAPI predicates', () => {
    describe('isOpenAPI30', () => {
      test('should detect OpenAPI 3.0.x versions in forward compatible way', () => {
        expect(isOpenAPI30({ openapi: '3.0.0' })).toBe(true);
        expect(isOpenAPI30({ openapi: '3.0.1' })).toBe(true);
        expect(isOpenAPI30({ openapi: '3.0.2' })).toBe(true);
        expect(isOpenAPI30({ openapi: '3.0.3' })).toBe(true);
        expect(isOpenAPI30({ openapi: '3.0.4' })).toBe(true);
        expect(isOpenAPI30({ openapi: '3.0.25' })).toBe(true);
      });

      test('should reject other OpenAPI versions', () => {
        expect(isOpenAPI30({ openapi: '3.1.0' })).toBe(false);
        expect(isOpenAPI30({ swagger: '2.0' })).toBe(false);
      });

      test('should reject values that are not OpenAPI spec', () => {
        expect(isOpenAPI30(null)).toBe(false);
        expect(isOpenAPI30(undefined)).toBe(false);
        expect(isOpenAPI30({})).toBe(false);
      });
    });

    describe('isOpenAPI31', () => {
      test('should detect OpenAPI 3.1.x versions in forward compatible way', () => {
        expect(isOpenAPI31({ openapi: '3.1.0' })).toBe(true);
        expect(isOpenAPI31({ openapi: '3.1.1' })).toBe(true);
        expect(isOpenAPI31({ openapi: '3.1.25' })).toBe(true);
      });

      test('should reject other OpenAPI versions', () => {
        expect(isOpenAPI31({ openapi: '3.0.0' })).toBe(false);
        expect(isOpenAPI31({ swagger: '2.0' })).toBe(false);
      });

      test('should reject values that are not OpenAPI spec', () => {
        expect(isOpenAPI31(null)).toBe(false);
        expect(isOpenAPI31(undefined)).toBe(false);
        expect(isOpenAPI31({})).toBe(false);
      });
    });

    describe('isOpenAPI3', () => {
      test('should detect OpenAPI 3.x.y versions', () => {
        expect(isOpenAPI3({ openapi: '3.0.0' })).toBe(true);
        expect(isOpenAPI3({ openapi: '3.0.1' })).toBe(true);
        expect(isOpenAPI3({ openapi: '3.0.2' })).toBe(true);
        expect(isOpenAPI3({ openapi: '3.0.3' })).toBe(true);
        expect(isOpenAPI3({ openapi: '3.0.4' })).toBe(true);
        expect(isOpenAPI3({ openapi: '3.1.0' })).toBe(true);
        expect(isOpenAPI3({ openapi: '3.1.1' })).toBe(true);
      });

      test('should accept OpenAPI 3.2.x versions', () => {
        expect(isOpenAPI3({ openapi: '3.2.0' })).toBe(true);
        expect(isOpenAPI3({ openapi: '3.2.1' })).toBe(true);
      });

      test('should reject other OpenAPI versions', () => {
        expect(isOpenAPI3({ swagger: '2.0' })).toBe(false);
      });

      test('should reject values that are not OpenAPI spec', () => {
        expect(isOpenAPI3(null)).toBe(false);
        expect(isOpenAPI3(undefined)).toBe(false);
        expect(isOpenAPI3({})).toBe(false);
      });
    });

    describe('isOpenAPI2', () => {
      test('should detect OpenAPI 2.0 versions', () => {
        expect(isOpenAPI2({ swagger: '2.0' })).toBe(true);
      });

      test('should reject other OpenAPI versions', () => {
        expect(isOpenAPI2({ openapi: '3.0.0' })).toBe(false);
        expect(isOpenAPI2({ openapi: '3.1.0' })).toBe(false);
      });

      test('should reject values that are not OpenAPI spec', () => {
        expect(isOpenAPI2(null)).toBe(false);
        expect(isOpenAPI2(undefined)).toBe(false);
        expect(isOpenAPI2({})).toBe(false);
      });

      describe('should be aliased by isSwagger2', () => {
        test('should detect OpenAPI 2.0 versions', () => {
          expect(isSwagger2({ swagger: '2.0' })).toBe(true);
        });

        test('should reject other OpenAPI versions', () => {
          expect(isSwagger2({ openapi: '3.0.0' })).toBe(false);
          expect(isSwagger2({ openapi: '3.1.0' })).toBe(false);
        });

        test('should reject values that are not OpenAPI spec', () => {
          expect(isSwagger2(null)).toBe(false);
          expect(isSwagger2(undefined)).toBe(false);
          expect(isSwagger2({})).toBe(false);
        });
      });
    });
  });
});
