import expect, {spyOn, createSpy} from 'expect'
import {
  mapTagOperations,
  makeApisTagOperationsOperationExecute,
  makeApisTagOperation,
  self as stubs} from '../src/interfaces'

describe('intefaces', function () {
  afterEach(function () {
    expect.restoreSpies()
  })

  describe('makeApisTagOperation', function () {
    it('should call mapTagOperations with { spec, cb:Function }', function () {
      // Given
      const spyMapTagOperations = spyOn(stubs, 'mapTagOperations')
      const spec = { }

      // When
      const interfaceValue = makeApisTagOperation({spec})

      // Then
      expect(spyMapTagOperations.calls.length).toEqual(1)
      const [arg] = spyMapTagOperations.calls[0].arguments
      expect(arg.spec).toEqual(spec)
      expect(arg.cb).toBeA(Function)
    })

    it('should pass the result of makeExecute as `cb` ', function () {
      // Given
      const spyMapTagOperations = spyOn(stubs, 'mapTagOperations')
      const spyExecute = createSpy()
      const interfaceValue = makeApisTagOperation({execute: spyExecute})
      const {cb} = spyMapTagOperations.calls[0].arguments[0]

      // When
      const executer = cb({pathName: '/one', method: 'GET'})
      executer(['param'], {option: 1})

      // Then
      expect(spyExecute.calls.length).toEqual(1)
      expect(spyExecute.calls[0].arguments[0]).toEqual({
        spec: undefined,
        operationId: undefined,
        method: 'GET',
        option: 1,
        parameters: ['param'],
        pathName: '/one'
      })
    })

    it('should expose the apis[tag][operationId]', function () {
      const interfaceValue = makeApisTagOperation({spec: {
        paths: {
          '/one': {
            get: {
              tags: ['me'],
              operationId: 'getMe'
            },
            put: {operationId: 'putMe'}
          }
        }
      }})

      expect(interfaceValue.apis.me.getMe).toBeA(Function)
      expect(interfaceValue.apis.default.putMe).toBeA(Function)
    })
  })

  describe('makeApisTagOperationsOperationExecute', function () {
    it('should call mapTagOperations with { spec, cb:Function }', function () {
      // Given
      const spyMapTagOperations = spyOn(stubs, 'mapTagOperations')
      const spec = { }

      // When
      const interfaceValue = makeApisTagOperationsOperationExecute({spec})

      // Then
      expect(spyMapTagOperations.calls.length).toEqual(1)
      const [arg] = spyMapTagOperations.calls[0].arguments
      expect(arg.spec).toEqual(spec)
      expect(arg.cb).toBeA(Function)
    })

    it('should pass the result of makeExecute as `cb` ', function () {
      // Given
      const spyMapTagOperations = spyOn(stubs, 'mapTagOperations')
      const spyExecute = createSpy()
      const interfaceValue = makeApisTagOperationsOperationExecute({execute: spyExecute})
      const {cb} = spyMapTagOperations.calls[0].arguments[0]

      // When
      const executer = cb({pathName: '/one', method: 'GET'})
      executer(['param'], {option: 1})


      // Then
      expect(spyExecute.calls.length).toEqual(1)
      expect(spyExecute.calls[0].arguments[0]).toEqual({
        spec: undefined,
        operationId: undefined,
        method: 'GET',
        option: 1,
        parameters: ['param'],
        pathName: '/one'
      })
    })

    it('should map tagOperations to execute', function () {
      const interfaceValue = makeApisTagOperationsOperationExecute({spec: {
        paths: {
          '/one': {
            get: {
              tags: ['me'],
              operationId: 'getMe'
            },
            put: {operationId: 'putMe'}
          }
        }
      }})

      expect(interfaceValue).toInclude({
        apis: {
          default: {operations: { }},
          me: {operations: {}}
        }
      })

      expect(interfaceValue.apis.me.operations.getMe.execute).toBeA(Function)
    })
  })


  describe('mapTagOperations', () => {
    it('should give default tag when there is no tag', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              operationId: 'getOne'
            }
          }
        }
      }

      // With
      const tags = mapTagOperations({spec, defaultTag: 'default'})

      // Then
      expect(tags).toEqual({
        default: {
          getOne: null
        }
      })
    })

    it('should return a hash of tags: { operationId1, ... }', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne'
            }
          }
        }
      }

      // With
      const tags = mapTagOperations({spec})

      // Then
      expect(tags).toEqual({
        alpha: {
          getOne: null
        }
      })
    })

    it('should put the result of the `cb` prop into the operation method', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne'
            }
          }
        }
      }
      const spy = createSpy().andReturn('hug')


        // With
      const tags = mapTagOperations({spec, cb: spy})

        // Then
      expect(tags).toEqual({
        alpha: {
          getOne: 'hug'
        }
      })
    })

    it('should call the `cb` prop with the operation object, the spec and the path and the method ', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne'
            }
          }
        }
      }
      const spy = createSpy()


        // With
      const tags = mapTagOperations({spec, cb: spy})

        // Then
      expect(spy.calls.length).toEqual(1)
      expect(spy.calls[0].arguments[0]).toEqual({
        operation: spec.paths.one.get,
        pathName: 'one',
        method: 'GET',
        operationId: 'getOne',
        spec
      })
    })

    it('should group multiple operations with the same tag', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha'],
              operationId: 'getOne'
            },
            post: {
              tags: ['alpha'],
              operationId: 'postOne'
            }
          }
        }
      }

      // With
      const tags = mapTagOperations({spec})

        // Then
      expect(tags).toEqual({
        alpha: {
          getOne: null,
          postOne: null
        }
      })
    })

    it('should be able to assign multiple tags', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              tags: ['alpha', 'beta'],
              operationId: 'getOne'
            },
            post: {
              tags: ['alpha'],
              operationId: 'postOne'
            }
          }
        }
      }

      // With
      const tags = mapTagOperations({spec})

        // Then
      expect(tags).toEqual({
        alpha: {
          getOne: null,
          postOne: null
        },
        beta: {
          getOne: null
        }
      })
    })

    it('should use method + path for ops without an operationId', function () {
      // Given
      const spec = {
        paths: {
          '/one': {
            get: {
              tags: ['alpha'],
            },
          }
        }
      }

      // With
      const tags = mapTagOperations({spec})

        // Then
      expect(tags).toEqual({
        alpha: {
          'get_one': null,
        }
      })
    })

    it('should put untagged operations in `defaultTag`', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              operationId: 'getOne'
            },
          }
        }
      }

      // With
      const tags = mapTagOperations({spec, defaultTag: 'hug'})

        // Then
      expect(tags).toEqual({
        hug: {
          getOne: null,
        }
      })
    })

    it('should remap duplicate operationId as ${operationId}${count} starting at 1', function () {
      // Given
      const spec = {
        paths: {
          one: {
            get: {
              operationId: 'getOne'
            },
            put: {
              operationId: 'getOne'
            },
            post: {
              operationId: 'getOne'
            }
          }
        }
      }

      // With
      let count = 1
      const tags = mapTagOperations({spec, defaultTag: 'hug', cb: () => count++})

        // Then
      expect(tags).toEqual({
        hug: {
          getOne1: 1,
          getOne2: 2,
          getOne3: 3
        }
      })
    })
  })
})
