import xmock from 'xmock'
import mapSpec, {plugins} from '../../src/specmap'

describe('allOf', () => {
  afterEach(() => {
    xmock().restore()
  })

  test('should resolve simple allOf', () => {
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

  test(
    'should return empty object when you pass nothing to allOf',
    (done) => {
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
    }
  )

  test('should resolve local $refs in allOf', () => {
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

  test('should not overwrite properties that are already present', () => {
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

  test('should set $$ref values', () => {
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
            type: 'object',
            properties: {
              name: {
                type: 'string'
              }
            }
          },
          Cat: {
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

  test('should return error if allOf is not an array', () => {
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

  test(
    'should ignore "allOf" in freely named Swagger key positions',
    () => {
      const spec = {
        parameters: {
          allOf: {
            a: 123
          }
        },
        responses: {
          allOf: {
            a: 123
          }
        },
        definitions: {
          allOf: {
            a: 123
          }
        },
        securityDefinitions: {
          allOf: {
            a: 123
          }
        },
        properties: {
          allOf: {
            a: 123
          }
        },
      }

      return mapSpec({
        spec,
        plugins: [plugins.allOf]
      }).then((res) => {
        expect(res.errors).toEqual([])
        expect(res.spec).toEqual(spec)
      })
    }
  )

  test('should throw error if allOf has a non-object item', () => {
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

  test('should merge allOf items, deeply', () => {
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

  test('should resolve nested allOf', () => {
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

  test('should handle external $refs inside allOf', () => {
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

  test('should suppport nested allOfs with $refs', () => {
    return mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      spec: {
        definitions: {
          Alpha: {
            allOf: [{type: 'object'}],
            properties: {
              one: {
                $ref: '#/definitions/Bravo'
              },
              two: {
                type: 'string'
              }
            }
          },
          Bravo: {
            allOf: [{
              type: 'object',
              properties: {
                three: {
                  type: 'string'
                }
              }
            }]
          }
        }
      }
    }).then((res) => {
      // To show the error, unfortunately, the expect call doesn't pretty print it nicely
      // console.log(res.errors[0])
      expect(res.errors).toEqual([])
      expect(res.spec).toEqual({
        definitions: {
          Alpha: {
            type: 'object',
            properties: {
              one: {
                type: 'object',
                properties: {
                  three: {
                    type: 'string',
                  }
                }
              },
              two: {
                type: 'string'
              }
            }
          },
          Bravo: {
            type: 'object',
            properties: {
              three: {
                type: 'string'
              }
            }
          }
        },
      })
    })
  })
  test('merges arrays inside of an `allOf`', () => {
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

  test(
    'should handle case, with an `allOf` referencing an `allOf` ',
    () => {
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
    }
  )
})
