import expect from 'expect'
import {
  isOAS3,
  isSwagger2
} from '../../src/helpers'

describe('helpers - OpenAPI Specification 3.0', function () {
  describe('isOAS3', function () {
    it('should recognize supported OpenAPI 3.0 versions', function () {
      // When
      const spec = {
        openapi: '3.0.0'
      }

      // Then
      expect(isOAS3(spec)).toEqual(true)
    })
    it('should reject a swagger 2 signature', function () {
      // When
      const spec = {
        swagger: '2.0'
      }

      // Then
      expect(isOAS3(spec)).toEqual(false)
    })
  })
  describe('isSwagger2', function () {
    it('should recognize supported Swagger 2.0 versions', function () {
      // When
      const spec = {
        swagger: '2.0'
      }

      // Then
      expect(isSwagger2(spec)).toEqual(true)
    })
    it('should reject a swagger 1.0 signature', function () {
      // When
      const spec = {
        swagger: '1.0'
      }

      // Then
      expect(isSwagger2(spec)).toEqual(false)
    })
  })
})
