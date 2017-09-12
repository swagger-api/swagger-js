import expect from 'expect'
import xmock from 'xmock'
import mapSpec, {plugins} from '../../src/specmap'

describe('allOf', function () {
  afterEach(() => {
    xmock().restore()
  })

  it('should resolve simple allOf', function () {
    return mapSpec({
      spec: {
        allOf: [
          {one: 1},
          {two: 2}
        ]
      },
      plugins: [plugins.allOf]
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: 1,
          two: 2
        }
      })
    })
  })

  it('should return empty object when you pass nothing to allOf', function (done) {
    return mapSpec({
      spec: {allOf: []},
      plugins: [plugins.allOf]
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {}
      })
      done()
    })
  })

  it('should resolve local $refs in allOf', function () {
    return mapSpec({
      spec: {
        allOf: [
          {one: {$ref: '#/bar'}},
          {two: 2}
        ],
        bar: {baz: 4}
      },
      plugins: [plugins.refs, plugins.allOf]
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: {baz: 4},
          two: 2,
          bar: {baz: 4}
        }
      })
    })
  })

  it('should not overwrite properties that are already present', function () {
    return mapSpec({
      spec: {
        original: 'yes',
        allOf: [
          {
            original: 'no',
            notOriginal: 'yes'
          }
        ]
      },
      plugins: [plugins.refs, plugins.allOf]
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          original: 'yes',
          notOriginal: 'yes'
        }
      })
    })
  })

  it('should set $$ref values', function () {
    return mapSpec({
      allowMetaPatches: true,
      spec: {
        Pet: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          }
        },
        Cat: {
          allOf: [
            {$ref: '#/Pet'},
            {
              type: 'object',
              properties: {
                meow: {
                  type: 'string'
                }
              }
            }
          ]
        },
        Animal: {
          type: 'object',
          properties: {
            pet: {
              $ref: '#/Pet'
            },
            cat: {
              $ref: '#/Cat'
            }
          }
        }
      },
      plugins: [plugins.refs, plugins.allOf]
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          Pet: {
            $$ref: '#/Pet',
            type: 'object',
            properties: {
              name: {
                type: 'string'
              }
            }
          },
          Cat: {
            $$ref: '#/Cat',
            properties: {
              meow: {
                type: 'string'
              },
              name: {
                type: 'string'
              }
            },
            type: 'object'
          },
          Animal: {
            type: 'object',
            properties: {
              pet: {
                $$ref: '#/Pet',
                properties: {
                  name: {
                    type: 'string'
                  }
                },
                type: 'object'
              },
              cat: {
                $$ref: '#/Cat',
                properties: {
                  meow: {
                    type: 'string'
                  },
                  name: {
                    type: 'string'
                  }
                },
                type: 'object'
              }
            }
          }
        }
      })
    })
  })

  it('should return error if allOf is not an array', function () {
    return mapSpec({
      spec: {
        allOf: {}
      },
      plugins: [plugins.allOf]
    }).then((res) => {
      expect(res.errors[0].message).toEqual('allOf must be an array')
      expect(res.errors[0].fullPath).toEqual(['allOf'])
      expect(res.spec).toEqual({allOf: {}})
    })
  })

  it('should throw error if allOf has a non-object item', function () {
    return mapSpec({
      spec: {
        allOf: [
          {one: 1},
          2
        ]
      },
      plugins: [plugins.allOf]
    }).then((res) => {
      expect(res.errors[0].message).toEqual('Elements in allOf must be objects')
      expect(res.errors[0].fullPath).toEqual(['allOf'])
      expect(res.spec).toEqual({one: 1})
    })
  })

  it('should merge allOf items, deeply', function () {
    return mapSpec({
      spec: {
        allOf: [
          { one: { two: { half: true }}}, // eslint-disable-line object-curly-spacing
          { one: { two: { otherHalf: true }}}, // eslint-disable-line object-curly-spacing
        ]
      },
      plugins: [plugins.allOf]
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: {
            two: {
              half: true,
              otherHalf: true
            }
          }
        }
      })
    })
  })

  it('should resolve nested allOf', function () {
    return mapSpec({
      spec: {
        allOf: [
          {
            allOf: [
              {two: 2}
            ]
          },
          {one: 1},
          {
            allOf: [
              {three: 3},
              {
                allOf: [
                  {four: 4},
                  {five: 5}
                ]
              }
            ]
          }
        ]
      },
      plugins: [plugins.allOf]
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: 1,
          two: 2,
          three: 3,
          four: 4,
          five: 5
        }
      })
    })
  })

  it('should handle external $refs inside allOf', function () {
    xmock().get('http://example.com', (req, res) => {
      setTimeout(() => res.send({fromRemote: true}), 20)
    })

    return mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      spec: {
        allOf: [
          {$ref: 'http://example.com/'},
          {fromLocal: true}
        ]
      }
    }).then((res) => {
      expect(res.errors).toEqual([])
      expect(res.spec).toEqual({
        fromLocal: true,
        fromRemote: true
      })
    })
  })

  it('merges arrays inside of an `allOf`', function () {
    return mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      showDebug: true,
      spec: {
        definitions: {
          one: {
            allOf: [
              {
                $ref: '#/definitions/two'
              },
              {
                type: 'object',
                required: ['a', 'b']
              }
            ]
          },
          two: {
            allOf: [
              {
                type: 'object',
                required: ['c', 'd']
              }
            ]
          }
        }
      }
    }).then((res) => {
      expect(res.errors).toEqual([])
      expect(res.spec).toEqual({
        definitions: {
          one: {
            type: 'object',
            required: ['c', 'd', 'a', 'b']
          },
          two: {
            type: 'object',
            required: ['c', 'd']
          }
        },
      })
    })
  })

  it('should handle case, with an `allOf` referencing an `allOf` ', function () {
    return mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      showDebug: true,
      spec: {
        definitions: {
          one: {
            allOf: [
              {
                $ref: '#/definitions/two'
              },
              {
                type: 'object'
              }
            ]
          },
          two: {
            allOf: [
              {
                type: 'object'
              }
            ]
          }
        }
      }
    }).then((res) => {
      expect(res.errors).toEqual([])
      expect(res.spec).toEqual({
        definitions: {
          one: {
            type: 'object',
          },
          two: {
            type: 'object',
          }
        },
      })
    })
  })
})
