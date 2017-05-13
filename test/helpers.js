import expect from 'expect'
import {
  normalizeSwagger, getOperationRaw, idFromPathMethod, pathMethodFromId
} from '../src/helpers'

describe('helpers', function () {
  describe('idFromPathMethod', function () {
    it('should return get_one as an operationId', function () {
      // When
      const id = idFromPathMethod('/one', 'get')

      // Then
      expect(id).toEqual('get_one')
    })
  })

  describe('getOperationRaw', function () {
    it('should return the operation object, given an explicit operationId', function () {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: {operationId: 'op1'}
          }
        }
      }

      // When
      const op = getOperationRaw(spec, 'op1')

      // Then
      expect(op).toInclude({
        operation: spec.paths['/one'].get,
        pathName: '/one',
        method: 'GET'
      })
    })

    it('should return the operationObj, given a generated operationId', function () {
      // Given`
      const spec = {
        paths: {
          '/two': {
            get: {
              description: 'an operation'
            }
          },
        }
      }

      // When
      const op = getOperationRaw(spec, 'get_two')

      // Then
      expect(op).toInclude({
        operation: spec.paths['/two'].get,
        pathName: '/two',
        method: 'GET'
      })
    })

    it('should return the operationObj, given a generated legacy operationId', function () {
      // Given`
      const spec = {
        paths: {
          '/two': {
            get: {
              description: 'an operation'
            }
          },
        }
      }

      // When
      const op = getOperationRaw(spec, 'get-/two')

      // Then
      expect(op).toInclude({
        operation: spec.paths['/two'].get,
        pathName: '/two',
        method: 'GET'
      })
    })
  })


  describe('normalizeSwagger', function () {
    describe('operationId', function () {
      it('should create unique operationIds when explicit operationIds are duplicates', function () {
        const spec = {spec: {
          paths: {
            '/foo': {
              get: {
                operationId: 'test'
              }
            },
            '/bar': {
              get: {
                operationId: 'test'
              }
            }
          }
        }}

        const id = normalizeSwagger(spec)
        const id1 = id.spec.paths['/foo'].get.operationId
        const id2 = id.spec.paths['/bar'].get.operationId

        // Then
        expect(id1).toEqual('test1')
        expect(id2).toEqual('test2')
      })

      it('should create unique operationIds when explicit operationIds are effectively the same due to whitespace', function () {
        const spec = {spec: {
          paths: {
            '/foo': {
              get: {
                operationId: 'test'
              }
            },
            '/bar': {
              get: {
                operationId: 'te st'
              }
            },
            '/bat': {
              get: {
                operationId: 'te/st'
              }
            }
          }
        }}

        const id = normalizeSwagger(spec)
        const id1 = id.spec.paths['/foo'].get.operationId
        const id2 = id.spec.paths['/bar'].get.operationId
        const id3 = id.spec.paths['/bat'].get.operationId

        // Then
        expect(id1).toEqual('test')
        expect(id2).toEqual('te_st1')
        expect(id3).toEqual('te_st2')
      })
    })
    describe('consumes', function () {
      it('should not overwrite consumes values from the global-level when exists in operation', function () {
        const spec = {spec: {
          consumes: ['application/json'],
          paths: {
            '/two': {
              get: {
                consumes: ['application/moar-test']
              }
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          consumes: ['application/json'],
          paths: {
            '/two': {
              get: {
                consumes: ['application/moar-test']
              }
            }
          }
        }})
      })

      it('should add consumes values from the global-level when no consumes in operation', function () {
        const spec = {spec: {
          consumes: ['application/json'],
          paths: {
            '/two': {
              get: {
              }
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          consumes: ['application/json'],
          paths: {
            '/two': {
              get: {
                consumes: ['application/json']
              }
            }
          }
        }})
      })
    })

    describe('produces', function () {
      it('should not overwrite produces values from the global-level when exists in operation', function () {
        const spec = {spec: {
          produces: ['application/json'],
          paths: {
            '/two': {
              get: {
                produces: ['application/moar-test']
              }
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          produces: ['application/json'],
          paths: {
            '/two': {
              get: {
                produces: ['application/moar-test']
              }
            }
          }
        }})
      })

      it('should add produces values from the global-level when no produces in operation', function () {
        const spec = {spec: {
          produces: ['application/json'],
          paths: {
            '/two': {
              get: {
              }
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          produces: ['application/json'],
          paths: {
            '/two': {
              get: {
                produces: ['application/json']
              }
            }
          }
        }})
      })
    })

    describe('security', function () {
      it('should not overwrite security values from the global-level when exists in operation', function () {
        const spec = {spec: {
          security: ['test'],
          paths: {
            '/two': {
              get: {
                security: ['test1']
              }
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          security: ['test'],
          paths: {
            '/two': {
              get: {
                security: ['test1']
              }
            }
          }
        }})
      })

      it('should add security values from the global-level when no security in operation', function () {
        const spec = {spec: {
          security: ['test1'],
          paths: {
            '/two': {
              get: {
              }
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          security: ['test1'],
          paths: {
            '/two': {
              get: {
                security: ['test1']
              }
            }
          }
        }})
      })
    })

    describe('parameters', function () {
      it('should add parameters from path when no parameters in operation', function () {
        const spec = {spec: {
          paths: {
            '/two': {
              parameters: [{name: 'a', in: 'path'}],
              get: {}
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          paths: {
            '/two': {
              parameters: [{name: 'a', in: 'path'}],
              get: {
                parameters: [{name: 'a', in: 'path'}]
              }
            }
          }
        }})
      })

      it('should add parameters from path but not override parameters in operation', function () {
        const spec = {spec: {
          paths: {
            '/two': {
              parameters: [
                {name: 'a', in: 'path'},
                {name: 'b', in: 'path'}
              ],
              get: {
                parameters: [
                  {name: 'a', in: 'query'},
                  {name: 'c', in: 'query'}
                ]
              }
            }
          }
        }}

        const resultSpec = normalizeSwagger(spec)

        expect(resultSpec).toEqual({spec: {
          paths: {
            '/two': {
              parameters: [
                {name: 'a', in: 'path'},
                {name: 'b', in: 'path'}
              ],
              get: {
                parameters: [
                  {name: 'a', in: 'query'},
                  {name: 'c', in: 'query'},
                  {name: 'b', in: 'path'}
                ]
              }
            }
          }
        }})
      })
    })
  })
})
