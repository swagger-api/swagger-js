import xmock from 'xmock';

import mapSpec, { plugins } from '../../src/specmap/index.js';

describe('allOf', () => {
  afterEach(() => {
    xmock().restore();
  });

  test('should resolve simple allOf', () =>
    mapSpec({
      spec: {
        allOf: [{ one: 1 }, { two: 2 }],
      },
      plugins: [plugins.allOf],
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: 1,
          two: 2,
        },
      });
    }));

  test('should return empty object when you pass nothing to allOf', (done) => {
    mapSpec({
      spec: { allOf: [] },
      plugins: [plugins.allOf],
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {},
      });
      done();
    });
  });

  test('should resolve local $refs in allOf', () =>
    mapSpec({
      spec: {
        allOf: [{ one: { $ref: '#/bar' } }, { two: 2 }],
        bar: { baz: 4 },
      },
      plugins: [plugins.refs, plugins.allOf],
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: { baz: 4 },
          two: 2,
          bar: { baz: 4 },
        },
      });
    }));

  test('should not overwrite properties that are already present', () =>
    mapSpec({
      spec: {
        original: 'yes',
        allOf: [
          {
            original: 'no',
            notOriginal: 'yes',
          },
        ],
      },
      plugins: [plugins.refs, plugins.allOf],
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          original: 'yes',
          notOriginal: 'yes',
        },
      });
    }));

  test('should set $$ref values', () =>
    mapSpec({
      allowMetaPatches: true,
      spec: {
        Pet: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
        },
        Cat: {
          allOf: [
            { $ref: '#/Pet' },
            {
              type: 'object',
              properties: {
                meow: {
                  type: 'string',
                },
              },
            },
          ],
        },
        Animal: {
          type: 'object',
          properties: {
            pet: {
              $ref: '#/Pet',
            },
            cat: {
              $ref: '#/Cat',
            },
          },
        },
      },
      plugins: [plugins.refs, plugins.allOf],
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          Pet: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
          Cat: {
            properties: {
              meow: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
            },
            type: 'object',
          },
          Animal: {
            type: 'object',
            properties: {
              pet: {
                $$ref: '#/Pet',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
                type: 'object',
              },
              cat: {
                $$ref: '#/Cat',
                properties: {
                  meow: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                },
                type: 'object',
              },
            },
          },
        },
      });
    }));

  test('should return error if allOf is not an array', () =>
    mapSpec({
      spec: {
        allOf: {},
      },
      plugins: [plugins.allOf],
    }).then((res) => {
      expect(res.errors[0].message).toEqual('allOf must be an array');
      expect(res.errors[0].fullPath).toEqual(['allOf']);
      expect(res.spec).toEqual({ allOf: {} });
    }));

  test('should ignore "allOf" in freely named Swagger key positions', () => {
    const spec = {
      parameters: {
        allOf: {
          a: 123,
        },
      },
      responses: {
        allOf: {
          a: 123,
        },
      },
      definitions: {
        allOf: {
          a: 123,
        },
      },
      securityDefinitions: {
        allOf: {
          a: 123,
        },
      },
      properties: {
        allOf: {
          a: 123,
        },
      },
    };

    return mapSpec({
      spec,
      plugins: [plugins.allOf],
    }).then((res) => {
      expect(res.errors).toEqual([]);
      expect(res.spec).toEqual(spec);
    });
  });

  test('should throw error if allOf has a non-object item', () =>
    mapSpec({
      spec: {
        allOf: [{ one: 1 }, 2],
      },
      plugins: [plugins.allOf],
    }).then((res) => {
      expect(res.errors[0].message).toEqual('Elements in allOf must be objects');
      expect(res.errors[0].fullPath).toEqual(['allOf']);
      expect(res.spec).toEqual({ one: 1 });
    }));

  test('should merge allOf items, deeply', () =>
    mapSpec({
      spec: {
        allOf: [
          { one: { two: { half: true } } }, // eslint-disable-line object-curly-spacing
          { one: { two: { otherHalf: true } } }, // eslint-disable-line object-curly-spacing
        ],
      },
      plugins: [plugins.allOf],
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: {
            two: {
              half: true,
              otherHalf: true,
            },
          },
        },
      });
    }));

  test('should resolve nested allOf', () =>
    mapSpec({
      spec: {
        allOf: [
          {
            allOf: [{ two: 2 }],
          },
          { one: 1 },
          {
            allOf: [
              { three: 3 },
              {
                allOf: [{ four: 4 }, { five: 5 }],
              },
            ],
          },
        ],
      },
      plugins: [plugins.allOf],
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          one: 1,
          two: 2,
          three: 3,
          four: 4,
          five: 5,
        },
      });
    }));

  test('should handle external $refs inside allOf', () => {
    xmock().get('http://example.com', (req, res) => {
      setTimeout(() => res.send({ fromRemote: true }), 20);
    });

    return mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      spec: {
        allOf: [{ $ref: 'http://example.com/' }, { fromLocal: true }],
      },
    }).then((res) => {
      expect(res.errors).toEqual([]);
      expect(res.spec).toEqual({
        fromLocal: true,
        fromRemote: true,
      });
    });
  });

  test('should support nested allOfs with $refs', async () => {
    const res = await mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      spec: {
        definitions: {
          D: {
            type: 'object',
            properties: {
              z: {
                type: 'string',
                description: 'Some Z string',
              },
            },
          },
          C: {
            type: 'object',
            properties: {
              d: {
                title: 'D',
                allOf: [
                  {
                    description: 'Some D',
                  },
                  {
                    $ref: '#/definitions/D',
                  },
                ],
              },
            },
          },
          B: {
            type: 'object',
            properties: {
              c: {
                title: 'C',
                allOf: [
                  {
                    description: 'Some C',
                  },
                  {
                    $ref: '#/definitions/C',
                  },
                ],
              },
            },
          },
          A: {
            type: 'object',
            properties: {
              b: {
                title: 'B',
                allOf: [
                  {
                    $ref: '#/definitions/B',
                  },
                  {
                    description: 'Some B',
                  },
                ],
              },
            },
          },
        },
      },
    });

    // To show the error, unfortunately, the expect call doesn't pretty print it nicely
    // console.log(res.errors[0])
    expect(res.errors).toEqual([]);
    expect(res.spec).toEqual({
      definitions: {
        D: {
          type: 'object',
          properties: { z: { type: 'string', description: 'Some Z string' } },
        },
        C: {
          type: 'object',
          properties: {
            d: {
              description: 'Some D',
              type: 'object',
              properties: { z: { type: 'string', description: 'Some Z string' } },
              title: 'D',
            },
          },
        },
        B: {
          type: 'object',
          properties: {
            c: {
              description: 'Some C',
              type: 'object',
              properties: {
                d: {
                  description: 'Some D',
                  type: 'object',
                  properties: { z: { type: 'string', description: 'Some Z string' } },
                  title: 'D',
                },
              },
              title: 'C',
            },
          },
        },
        A: {
          type: 'object',
          properties: {
            b: {
              type: 'object',
              properties: {
                c: {
                  description: 'Some C',
                  type: 'object',
                  properties: {
                    d: {
                      description: 'Some D',
                      type: 'object',
                      properties: { z: { type: 'string', description: 'Some Z string' } },
                      title: 'D',
                    },
                  },
                  title: 'C',
                },
              },
              description: 'Some B',
              title: 'B',
            },
          },
        },
      },
    });
  });

  test('deepmerges arrays inside of an `allOf`', () =>
    mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      showDebug: true,
      spec: {
        definitions: {
          one: {
            allOf: [
              {
                $ref: '#/definitions/two',
              },
              {
                type: 'object',
                required: ['a', 'b'],
                properties: {
                  nested: {
                    type: 'object',
                    required: ['e'],
                  },
                },
              },
            ],
          },
          two: {
            allOf: [
              {
                type: 'object',
                required: ['c', 'd'],
                properties: {
                  nested: {
                    type: 'object',
                    required: ['f'],
                  },
                },
              },
            ],
          },
        },
      },
    }).then((res) => {
      expect(res.errors).toEqual([]);
      expect(res.spec).toEqual({
        definitions: {
          one: {
            type: 'object',
            required: ['c', 'd', 'a', 'b'],
            properties: {
              nested: {
                type: 'object',
                required: ['f', 'e'],
              },
            },
          },
          two: {
            type: 'object',
            required: ['c', 'd'],
            properties: {
              nested: {
                type: 'object',
                required: ['f'],
              },
            },
          },
        },
      });
    }));

  test('should handle case, with an `allOf` referencing an `allOf` ', () =>
    mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      showDebug: true,
      spec: {
        definitions: {
          one: {
            allOf: [
              {
                $ref: '#/definitions/two',
              },
              {
                type: 'object',
              },
            ],
          },
          two: {
            allOf: [
              {
                type: 'object',
              },
            ],
          },
        },
      },
    }).then((res) => {
      expect(res.errors).toEqual([]);
      expect(res.spec).toEqual({
        definitions: {
          one: {
            type: 'object',
          },
          two: {
            type: 'object',
          },
        },
      });
    }));

  // https://github.com/swagger-api/swagger-ui/issues/4175
  test('should suppress merging examples when composing a schema', async () => {
    const res = await mapSpec({
      plugins: [plugins.refs, plugins.allOf],
      spec: {
        definitions: {
          Pet: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
            example: {
              name: 'my pet',
            },
          },
          Cat: {
            allOf: [
              { $ref: '#/definitions/Pet' },
              {
                type: 'object',
                properties: {
                  meow: {
                    type: 'string',
                  },
                },
                example: {
                  name: 'my cat',
                  meow: 'meow',
                },
              },
            ],
          },
          PetCat: {
            allOf: [{ $ref: '#/definitions/Pet' }, { $ref: '#/definitions/Cat' }],
            properties: {
              id: {
                type: 'string',
              },
            },
            example: {
              id: '1',
            },
          },
        },
      },
    });
    expect(res.errors).toEqual([]);
    expect(res.spec).toEqual({
      definitions: {
        Pet: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          example: {
            name: 'my pet',
          },
        },
        Cat: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            meow: {
              type: 'string',
            },
          },
          example: {
            name: 'my cat',
            meow: 'meow',
          },
        },
        PetCat: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
            meow: {
              type: 'string',
            },
          },
          example: {
            id: '1',
          },
        },
      },
    });
  });
});
