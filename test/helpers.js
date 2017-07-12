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

    it('should return the operation object, given an explicit operationId with special characters', function () {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: {operationId: 'A.Very_Special-operationID!'}
          }
        }
      }

      // When
      const op = getOperationRaw(spec, 'A.Very_Special-operationID!')

      // Then
      expect(op).toInclude({
        operation: spec.paths['/one'].get,
        pathName: '/one',
        method: 'GET'
      })
    })

    it('should return null, given an explicit operationId that does not exist', function () {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: {operationId: 'getOne'}
          }
        }
      }

      // When
      const op = getOperationRaw(spec, 'ThisOperationIdDoesNotExist')

      // Then
      expect(op).toEqual(null)
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
      it('should create unique operationIds when explicit operationIds are duplicates, and preserve originals', function () {
        const input = {spec: {
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
            },
            '/baz': {
              get: {
                operationId: 'test'
              }
            }
          }
        }}

        const res = normalizeSwagger(input)
        const fooRes = res.spec.paths['/foo'].get
        const barRes = res.spec.paths['/bar'].get
        const bazRes = res.spec.paths['/baz'].get

        // Then
        expect(fooRes.operationId).toEqual('test1')
        expect(barRes.operationId).toEqual('test2')
        expect(bazRes.operationId).toEqual('test3')
        expect(fooRes.__originalOperationId).toEqual('test')
        expect(barRes.__originalOperationId).toEqual('test')
        expect(bazRes.__originalOperationId).toEqual('test')
      })

      it('should add the normalized operation id to the spec, if a non-normalized id exists', function () {
        // Given
        const spec = {spec: {
          paths: {
            '/foo': {
              get: {
                operationId: 'something with spaces'
              }
            },
          }
        }}

        // When
        const normalizedSpec = normalizeSwagger(spec)
        const id = normalizedSpec.spec.paths['/foo'].get.operationId

        // Then
        expect(id).toEqual('something_with_spaces')
      })

      it('should add __originalOperationId for non-duplicate, normal operationIds', function () {
        // Given
        const input = {spec: {
          paths: {
            '/foo': {
              get: {
                operationId: 'fooOperation'
              }
            },
            '/bar': {
              get: {
                operationId: 'barOperation'
              }
            },
            '/baz': {
              get: {
                operationId: 'bazOperation'
              }
            },
          }
        }}

        // When
        const result = normalizeSwagger(input)
        const fooOperation = input.spec.paths['/foo'].get
        const barOperation = input.spec.paths['/bar'].get
        const bazOperation = input.spec.paths['/baz'].get

        // Then
        expect(fooOperation.operationId).toEqual('fooOperation')
        expect(fooOperation.__originalOperationId).toEqual('fooOperation')

        expect(barOperation.operationId).toEqual('barOperation')
        expect(barOperation.__originalOperationId).toEqual('barOperation')

        expect(bazOperation.operationId).toEqual('bazOperation')
        expect(bazOperation.__originalOperationId).toEqual('bazOperation')
      })

      it('should add __originalOperationId for non-duplicate, abnormal operationIds', function () {
        // Given
        const input = {spec: {
          paths: {
            '/foo': {
              get: {
                operationId: 'foo!Operation'
              }
            },
            '/bar': {
              get: {
                operationId: 'bar!Operation'
              }
            },
            '/baz': {
              get: {
                operationId: 'baz!Operation'
              }
            },
          }
        }}

        // When
        const result = normalizeSwagger(input)
        const fooOperation = input.spec.paths['/foo'].get
        const barOperation = input.spec.paths['/bar'].get
        const bazOperation = input.spec.paths['/baz'].get

        // Then
        expect(fooOperation.operationId).toEqual('foo_Operation')
        expect(fooOperation.__originalOperationId).toEqual('foo!Operation')

        expect(barOperation.operationId).toEqual('bar_Operation')
        expect(barOperation.__originalOperationId).toEqual('bar!Operation')

        expect(bazOperation.operationId).toEqual('baz_Operation')
        expect(bazOperation.__originalOperationId).toEqual('baz!Operation')
      })

      it('should add the original operation id to the spec, if a non-normalized id exists', function () {
        // Given
        const spec = {spec: {
          paths: {
            '/foo': {
              get: {
                operationId: 'something with spaces'
              }
            },
          }
        }}

        // When
        const normalizedSpec = normalizeSwagger(spec)
        const originalId = normalizedSpec.spec.paths['/foo'].get.__originalOperationId

        // Then
        expect(originalId).toEqual('something with spaces')
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
