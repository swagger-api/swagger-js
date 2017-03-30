import expect from 'expect'
import xmock from 'xmock'

import Swagger from '../src'

describe('resolver', () => {
  afterEach(function () {
    // Restore all xhr/http mocks
    xmock().restore()
    // Clear the http cache
    Swagger.clearCache()
  })

  it('should expose a resolver function', () => {
    expect(Swagger.resolve).toBeA(Function)
  })

  it('should be able to resolve simple $refs', () => {
    // Given
    const spec = {
      one: {
        uno: 1,
        $ref: '#/two'
      },
      two: {
        duos: 2
      }
    }

    // When
    return Swagger.resolve({spec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        one: {
          duos: 2
        },
        two: {
          duos: 2
        }
      })
    }
  })

  it('should resolve the url, if no spec provided', function () {
    // Given
    const url = 'http://example.com/swagger.json'
    xmock().get(url, (req, res) => res.send({one: 1}))

    // When
    return Swagger.resolve({baseDoc: url, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        one: 1
      })
    }
  })

  it('should be able to resolve simple allOf', () => {
    // Given
    const spec = {
      allOf: [
        {uno: 1},
        {duos: 2}
      ]
    }

    // When
    return Swagger.resolve({spec})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        uno: 1,
        duos: 2
      })
    }
  })

  it('should be able to resolve simple allOf', () => {
    // Given
    const spec = {
      allOf: [
        {uno: 1},
        {duos: 2}
      ]
    }

    // When
    return Swagger.resolve({spec, allowMetaPatches: false})
      .then(handleResponse)

    // Then
    function handleResponse(obj) {
      expect(obj.errors).toEqual([])
      expect(obj.spec).toEqual({
        uno: 1,
        duos: 2
      })
    }
  })
})
