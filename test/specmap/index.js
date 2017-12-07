import expect from 'expect'
import clone from 'clone'
import xmock from 'xmock'
import traverse from 'traverse'
import mapSpec, {SpecMap, plugins} from '../../src/specmap'
import lib from '../../src/specmap/lib'

describe('specmap', function () {
  describe('#dispatch', function () {
    it('should pass the spec through', function () {
      return mapSpec({
        spec: {bob: true},
        plugins: []
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: {bob: true}
        })
      })
    })

    it('should call plugins with patches', function (done) {
      mapSpec({
        spec: {one: 1},
        plugins: [{specMap: (patches) => {
          try {
            expect(patches).toEqual([{
              op: 'add',
              path: [],
              value: {one: 1}
            }])
            done()
          }
          catch (e) {
            return done(e)
          }
        }}]
      })
    })

    it('should include a library of functions, including `add` ', function (done) {
      mapSpec({
        spec: {bob: true},
        plugins: [{
          specMap(patches, specmap) {
            expect(specmap.add).toBeA('function')
            done()
          }
        }]
      })
    })

    it('should accept simple functions for plugins', function (done) {
      mapSpec({
        spec: {one: 1},
        plugins: [
          (patches) => {
            try {
              expect(patches).toEqual([{
                op: 'add',
                path: [],
                value: {one: 1}
              }])
            }
            catch (e) {
              return done(e)
            }
            done()
          }
        ]
      })
    })

    it('allows synchronous calls (no Promise)', function () {
      return mapSpec({
        spec: {here: true},
        plugins: [
          (patches, specMap) => {
            return !specMap.hasRun() && specMap.add(['alsoHere'], true)
          }
        ]
      }).then((result) => {
        expect(result).toEqual({
          errors: [],
          spec: {
            here: true,
            alsoHere: true
          }
        })
      })
    })

    it('should block until promises resolve before running next plugin', function () {
      const p1 = function (patches, specmap) {
        if (specmap.hasRun()) {
          return
        }
        return specmap.replace(['val'], new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve('some val')
          }, 50)
        }))
      }

      const p2 = function (patches, specmap) {
        if (specmap.hasRun()) {
          return
        }
        if (patches[1].value !== 'some val' &&
          patches[2].value !== 'some val' &&
          patches[3].value !== 'some val') {
          return [new Error('Promises not yet resolved')]
        }
      }

      return mapSpec({
        spec: {},
        plugins: [p1, p1, p1, p2]
      }).then((result) => {
        expect(result).toEqual({
          errors: [],
          spec: {val: 'some val'}
        })
      })
    })

    it('should not block the first plugin if it is executed multiple times at once', function () {
      let hasRunTwice = false
      const p1 = (patches, specmap) => {
        if (!specmap.hasRun()) {
          return [
            specmap.add(['val1'], 'some val1'),
            specmap.add(['val2'], new Promise((resolve, reject) => {
              setTimeout(() => resolve('some val2'), 50)
            }))
          ]
        }
        else if (!hasRunTwice) {
          hasRunTwice = true
          // We expect this to run immediately with the val1 patch,
          // but without the val2 patch because the promise hasn't been resolved.
          if (patches[0].value !== 'some val1' || patches[1] != null) {
            return [new Error('Should not block')]
          }
        }
      }

      return mapSpec({
        spec: {},
        plugins: [p1]
      }).then((result) => {
        expect(result).toEqual({
          errors: [],
          spec: {val1: 'some val1', val2: 'some val2'}
        })
      })
    })

    it('records errors after each plugin', function () {
      return mapSpec({
        spec: {here: true},
        plugins: [
          {
            specMap(patch) {
              if (!this.hasRun) {
                this.hasRun = true
                return [new Error('This is not working'), new TypeError('wrong type')]
              }
            },
            toString() {
              return 'Mocha test'
            }
          }
        ]
      }).then((result) => {
        expect(result).toEqual({
          errors: [
            new Error('This is not working'),
            new TypeError('wrong type')
          ],
          spec: {here: true}
        })
      })
    })

    it('should record errors and mutations', function () {
      let hasRun = false
      return mapSpec({
        spec: {two: 1},
        plugins: [
          (patch, specmap) => {
            if (hasRun) {
              return
            }
            hasRun = true
            return [
              new Error('This is not working'),
              specmap.replace(['two'], 2)
            ]
          }
        ]
      }).then((result) => {
        expect(result).toEqual({
          errors: [new Error('This is not working')],
          spec: {
            two: 2,
          }
        })
      })
    })

    it('should allow a plugin to process its own mutations', function () {
      return mapSpec({
        spec: {counter: 1},
        plugins: [incrementIf]
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: {counter: 10}
        })
      })

      function incrementIf(patches, specmap) {
        const newPatches = []
        return specmap.forEachNewPrimitive(patches, (val, key, path) => {
          if (key === 'counter') {
            const count = specmap.get(path)
            if (count < 10) {
              return specmap.replace(path, count + 1)
            }
          }
        })
      }
    })

    it('should have a delightful API, exposed through `lib`', function () {
      function increment(patches, specmap) {
        const newPatches = []

        if (specmap.hasRun()) {
          return
        }
        return specmap.forEachNewPrimitive(patches, (val, key, path) => {
          const count = specmap.get(path)
          return specmap.replace(path, count + 1)
        })
      }

      function addFour(patches, specmap) {
        const fourPath = ['middle', 'four']
        if (!specmap.get(fourPath)) {
          return specmap.add(fourPath, 4)
        }
      }

      return mapSpec({
        spec: {
          one: 1,
          middle: {
            two: 2,
            deep: {
              three: 3
            }
          }
        },
        plugins: [
          addFour,
          increment
        ]
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: {
            one: 2,
            middle: {
              two: 3,
              deep: {
                three: 4
              },
              four: 5
            }
          }
        })
      })
    })

    describe('#getLib', function () {
      it('.add should return a JSON-Patch add object', function () {
        const map = new SpecMap()
        expect(map.getLib).toBeA('function')
        expect(map.getLib().add('/one', 1)).toEqual({op: 'add', path: '/one', value: 1})
      })

      describe('.get', function () {
        beforeEach(function () {
          this.obj = {
            one: 1,
            deep: {
              ly: {
                nested: 'works'
              }
            },
            arrays: ['could', 'alsoWork']
          }

          this.specMap = new SpecMap({
            debugLevel: 'verbose',
            spec: this.obj
          })
        })

        it('should allow simple queries', function () {
          expect(this.specMap.getLib().get(['one'])).toEqual(1)
        })

        it('should return `undefined` for invalid queries', function () {
          expect(this.specMap.getLib().get(['does', 'not', 'exist'])).toEqual(undefined)
        })

        it('should allow deep queries', function () {
          expect(this.specMap.getLib().get(['deep', 'ly'])).toEqual({
            nested: 'works'
          })
        })

        it('should allow querying arrays', function () {
          expect(this.specMap.getLib().get(['arrays', 1])).toEqual('alsoWork')
        })

        it('should allow getting the root object, with []', function () {
          expect(this.specMap.getLib().get([])).toEqual(this.obj)
        })
      })
    })

    describe('#nextPlugin', function () {
      it('should return a plugin', function () {
        const map = new SpecMap({
          plugins: [() => 'josh']
        })

        const fn = map.nextPlugin()
        expect(fn()).toEqual('josh')
      })

      it('should handle multiple plugins', function () {
        return mapSpec({
          spec: {one: 1},
          plugins: [
            () => { /* do nothing */ },
            (patches, specmap) => {
              if (specmap.get(['two']) !== 2) {
                return specmap.add(['two'], 2)
              }
            },
            {
              key: 'one',
              plugin: (val, key, fullPath, specmap) => {
                if (val !== 10) {
                  return specmap.replace(fullPath, val + 1)
                }
              }
            }
          ]
        }).then((res) => {
          expect(res.errors).toEqual([])
          expect(res.spec).toEqual({one: 10, two: 2})
        })
      })

      it('should handle multiple plugins, with the same key', function () {
        return mapSpec({
          spec: {one: 1},
          plugins: [
            {
              key: 'one',
              name: '1st',
              plugin: (val, key, fullPath, specmap) => {
                if (val < 3) {
                  return specmap.replace(fullPath, val + 1)
                }
              }
            },
            {
              key: 'one',
              name: '2nd',
              plugin: (val, key, fullPath, specmap) => {
                if (val < 4) {
                  return specmap.replace(fullPath, val + 1)
                }
              }
            }
          ]
        }).then((res) => {
          expect(res.errors).toEqual([])
          expect(res.spec).toEqual({one: 4})
        })
      })
    })

    describe('plugins', function () {
      describe('$refs', function () {
        it('should resolve internal $refs', function () {
          return mapSpec({
            spec: {
              nested: {one: 1},
              another: {$ref: '#/nested'}
            },
            plugins: [plugins.refs]
          })
            .then((res) => {
              expect(res).toEqual({
                errors: [],
                spec: {
                  nested: {one: 1},
                  another: {one: 1}
                }
              })
            })
        })

        it('should resolve internal $refs in arrays', function () {
          return mapSpec({
            spec: {
              nested: {one: 1},
              another: [{$ref: '#/nested'}]
            },
            plugins: [plugins.refs]
          })
            .then((res) => {
              expect(res).toEqual({
                errors: [],
                spec: {
                  nested: {one: 1},
                  another: [{one: 1}]
                }
              })
            })
        })

        it('should resolve internal $refs that points to object inside an array', function () {
          return mapSpec({
            spec: {
              nested: [{one: 1}],
              another: {$ref: '#/nested'}
            },
            plugins: [plugins.refs]
          })
            .then((res) => {
              expect(res).toEqual({
                errors: [],
                spec: {
                  nested: [{one: 1}],
                  another: [{one: 1}]
                }
              })
            })
        })

        it('should resolve internal $refs that points to item inside an array', function () {
          return mapSpec({
            spec: {
              nested: [{one: 1}],
              another: {$ref: '#/nested/0/one'}
            },
            plugins: [plugins.refs]
          })
            .then((res) => {
              expect(res).toEqual({
                errors: [],
                spec: {
                  nested: [{one: 1}],
                  another: 1
                }
              })
            })
        })

        it('should resolve a $ref without a pointer', function () {
          plugins.refs.docCache['http://some-path'] = {
            one: 1
          }

          return mapSpec({
            spec: {
              $ref: 'http://some-path'
            },
            plugins: [plugins.refs]
          })
            .then((res) => {
              expect(res).toEqual({
                errors: [],
                spec: {
                  one: 1
                }
              })
            })
        })

        it('should fail if we cannot resolve a ref', function () {
          return mapSpec({
            spec: {
              nested: {one: 1},
              another: {$ref: '#/not/here'}
            },
            context: {baseDoc: 'some-path'},
            plugins: [plugins.refs]
          })
            .then((res) => {
              expect(res.spec).toEqual({
                nested: {one: 1},
                another: {$ref: '#/not/here'}
              })
              expect(res.errors[0].$ref).toEqual('#/not/here')
              expect(res.errors[0].pointer).toEqual('/not/here')
              expect(res.errors[0].baseDoc).toEqual('some-path')
            })
        })

        it('should resolve petstore-simple', function () {
          const spec = clone(require('./data/specs/petstore-simple.json')) // eslint-disable-line global-require
          const resolvedSpec = clone(require('./data/specs/petstore-simple-resolved.json')) // eslint-disable-line global-require
          const initialRefCount = countRefs(spec)
          expect(initialRefCount).toEqual(9)

          return mapSpec({
            spec,
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res.errors).toEqual([])
            expect(countRefs(res.spec)).toBeLessThan(initialRefCount)
            expect(countRefs(res.spec)).toEqual(0)

            expect(res).toEqual({
              errors: [],
              spec: resolvedSpec
            })
          })
        })

        it('should retain local $refs', function () {
          return mapSpec({
            spec: {
              one: {a: 1, $ref: '#/two'},
              two: {b: 2}
            },
            allowMetaPatches: true,
            plugins: [plugins.refs]
          })
            .then((res) => {
              expect(res.spec.one.$$ref).toEqual('#/two')
            })
        })

        describe('allowMetaPatches = true', function () {
          it('should retain external $refs', function () {
            plugins.refs.clearCache()
            const xapp = xmock()

            xapp.get('http://example.com/common.json', (req, res, next) => {
              res.send({works: {yay: true}})
            })

            return mapSpec({
              spec: {a: 1, $ref: 'http://example.com/common.json#/works'},
              plugins: [plugins.refs],
              allowMetaPatches: true,
            }).then((res) => {
              expect(res.spec.$$ref).toEqual('http://example.com/common.json#/works')
            }).then(() => xapp.restore())
          })

          it('should retain local $refs inside external $refs', function () {
            plugins.refs.clearCache()
            const xapp = xmock()

            xapp.get('http://example.com/common.json', (req, res, next) => {
              res.send({
                works: {
                  one: {a: 1, $ref: '#/works/two'},
                  two: {b: 2}
                }
              })
            })

            return mapSpec({
              spec: {a: 1, $ref: 'http://example.com/common.json#/works'},
              plugins: [plugins.refs],
              allowMetaPatches: true,
            }).then((res) => {
              expect(res.spec.$$ref).toEqual('http://example.com/common.json#/works')
              expect(res.spec.one.$$ref).toEqual('#/works/two')
            }).then(() => xapp.restore())
          })
        })

        it('should resolve external $refs', function () {
          plugins.refs.clearCache()
          const xapp = xmock()

          xapp.get('http://example.com/common.json', (req, res, next) => {
            res.send({works: {yay: true}})
          })

          return mapSpec({
            spec: {$ref: 'http://example.com/common.json#/works'},
            plugins: [plugins.refs]
          }).then((res) => {
            expect(res.errors).toEqual([])
            expect(res.spec).toEqual({yay: true})
          }).then(() => xapp.restore())
        })

        it('should store the absolute path, in context', function () {
          plugins.refs.clearCache()
          const xapp = xmock()

          xapp.get('http://example.com/common.json', (req, res, next) => {
            return {
              works: {
                whoop: true
              },
              almost: {
                $ref: '#/works'
              }
            }
          })

          return mapSpec({
            context: {
              baseDoc: 'http://example.com/parent/me.json'
            },
            spec: {
              $ref: '../common.json#/almost'
            },
            plugins: [plugins.refs]
          }).then((res) => {
            expect(res.errors).toEqual([])
            expect(res.spec).toEqual({
              whoop: true
            })
          }).then(() => xapp.restore())
        })

        it('should use absPath for the context, not refPath', function () {
          plugins.refs.clearCache()

          const xapp = xmock()
          xapp.get('http://example.com/models.json', (req, res, next) => {
            return {
              Parent: {
                parent: true,
                child: {
                  $ref: '#/Child'
                }
              },
              Child: {
                child: true
              }
            }
          })

          return mapSpec({
            context: {
              baseDoc: 'http://example.com/base.json'
            },
            spec: {
              $ref: 'models.json#/Parent'
            },
            plugins: [plugins.refs]
          }).then((res) => {
            expect(res.errors).toEqual([])
            expect(res.spec).toEqual({
              parent: true,
              child: {
                child: true
              }
            })
          }).then(() => xapp.restore())
        })

        it('should resolve a complex spec', function () {
          const xapp = xmock()
          const spec = clone(require('./data/specs/example.json')) // eslint-disable-line global-require
          const underten = clone(require('./data/specs/example-underten.json')) // eslint-disable-line global-require
          const resolved = clone(require('./data/specs/example.resolved.json')) // eslint-disable-line global-require

          xapp.get('http://example.com/underten', () => underten)

          return mapSpec({
            spec,
            plugins: [plugins.refs]
          }).then((res) => {
            expect(res).toEqual({
              errors: [],
              spec: resolved
            })
          }).then(() => xapp.restore())
        })
      })
    })

    describe('keywords in properties', function () {
      it('should ignore $ref and allOf in properties', function () {
        return mapSpec({
          plugins: [plugins.refs, plugins.allOf],
          spec: {
            properties: {
              $ref: {
                type: 'string'
              },
              allOf: {
                type: 'string'
              }
            }
          }
        }).then((res) => {
          expect(res.errors.length).toEqual(0)
          expect(res.spec).toEqual({
            properties: {
              $ref: {
                type: 'string'
              },
              allOf: {
                type: 'string'
              }
            }
          })
        })
      })

      it('should merge sub-properties', function () {
        return mapSpec({
          plugins: [plugins.refs, plugins.allOf],
          spec: {
            properties: {
              test: {
                type: 'object',
                properties: {
                  color: {
                    type: 'integer'
                  }
                }
              }
            }
          }
        }).then((res) => {
          expect(res.errors.length).toEqual(0)
          expect(res.spec).toEqual({
            properties: {
              test: {
                type: 'object',
                properties: {
                  color: {
                    type: 'integer'
                  }
                }
              }
            }
          })
        })
      })
    })

    describe('context', function () {
      it('should allow access to root context (options supplied to SpecMap)', function (done) {
        return mapSpec({
          spec: {
            top: {middle: {leaf: 'hi'}}
          },
          context: {name: 'root'},
          plugins: [
            (patches, inst) => {
              expect(inst.getContext(['top', 'middle']).name).toEqual('root')
              done()
            }
          ]
        })
      })

      it('should set / get context for a given path', function (done) {
        return mapSpec({
          spec: {},
          patches: [lib.context(['one', 'two'], {hey: 'ho'})],
          context: {hello: 'hi'},
          showDebug: true,
          plugins: [
            (patches, inst) => {
              expect(inst.getContext(['one', 'two']).hello).toEqual('hi')
              expect(inst.getContext(['one', 'two']).hey).toEqual('ho')
              done()
            }
          ]
        })
      })
    })
  })
})

function countRefs(obj) {
  return traverse(obj).reduce(function (acc, x) {
    if (this.key === '$ref') {
      return acc + 1
    }
    return acc
  }, 0)
}
