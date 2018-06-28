import xmock from 'xmock'
import resolve from '../src/subtree-resolver'

describe('subtree $ref resolver', () => {
  let xapp

  beforeAll(() => {
    xapp = xmock()
  })

  afterAll(() => {
    xapp.restore()
  })

  beforeEach(() => {
    // refs.clearCache()
  })

  test(
    'should resolve a subtree of an object, and return the targeted subtree',
    async () => {
      const input = {
        a: {
          this: 'is my object'
        },
        b: {
          description: 'here is my stuff!',
          contents: {
            $ref: '#/a'
          }
        }
      }

      const res = await resolve(input, ['b'])

      expect(res).toEqual({
        errors: [],
        spec: {
          description: 'here is my stuff!',
          contents: {
            this: 'is my object',
            $$ref: '#/a'
          }
        }
      })
    }
  )

  test(
    'should resolve circular $refs when a baseDoc is provided',
    async () => {
      const input = {
        one: {
          $ref: '#/two'
        },
        two: {
          a: {
            $ref: '#/three'
          }
        },
        three: {
          b: {
            $ref: '#/two'
          }
        }
      }

      const res = await resolve(input, ['one'], {
        baseDoc: 'http://example.com/swagger.json',
        returnEntireTree: true
      })

      expect(res).toEqual({
        errors: [],
        spec: {
          one: {
            $$ref: '#/two',
            a: {
              $$ref: '#/three',
              b: {
                $ref: '#/two'
              }
            }
          },
          two: {
            a: {
              $ref: '#/three'
            }
          },
          three: {
            b: {
              $ref: '#/two'
            }
          }
        }
      })
    }
  )

  test('should return null when the path is invalid', async () => {
    const input = {
      a: {
        this: 'is my object'
      },
      b: {
        description: 'here is my stuff!',
        contents: {
          $ref: '#/a'
        }
      }
    }

    const res = await resolve(input, ['asdfgh'])

    expect(res).toEqual({
      errors: [],
      spec: null
    })
  })
  test('should not resolve an untargeted subtree', async () => {
    const input = {
      a: {
        this: 'is my object'
      },
      b: {
        description: 'here is my stuff!',
        contents: {
          $ref: '#/a'
        }
      },
      c: {
        $ref: '#/a'
      }
    }

    const res = await resolve(input, ['b'], {
      returnEntireTree: true
    })

    expect(res).toEqual({
      errors: [],
      spec: {
        a: {
          this: 'is my object'
        },
        b: {
          description: 'here is my stuff!',
          contents: {
            this: 'is my object',
            $$ref: '#/a'
          }
        },
        c: {
          $ref: '#/a'
        }
      }
    })
  })
  test('should normalize Swagger 2.0 consumes', async () => {
    const input = {
      swagger: '2.0',
      consumes: ['application/json'],
      paths: {
        '/': {
          get: {
            description: 'I should have a consumes value...'
          }
        }
      }
    }

    const res = await resolve(input, ['b'], {
      returnEntireTree: true
    })

    expect(res).toEqual({
      errors: [],
      spec: {
        $$normalized: true,
        swagger: '2.0',
        consumes: ['application/json'],
        paths: {
          '/': {
            get: {
              consumes: ['application/json'],
              description: 'I should have a consumes value...'
            }
          }
        }
      }
    })
  })
  test('should normalize Swagger 2.0 produces', async () => {
    const input = {
      swagger: '2.0',
      produces: ['application/json'],
      paths: {
        '/': {
          get: {
            description: 'I should have a produces value...'
          }
        }
      }
    }

    const res = await resolve(input, ['b'], {
      returnEntireTree: true
    })

    expect(res).toEqual({
      errors: [],
      spec: {
        $$normalized: true,
        swagger: '2.0',
        produces: ['application/json'],
        paths: {
          '/': {
            get: {
              produces: ['application/json'],
              description: 'I should have a produces value...'
            }
          }
        }
      }
    })
  })
  test('should normalize Swagger 2.0 parameters', async () => {
    const input = {
      swagger: '2.0',
      parameters: {
        petId: {
          name: 'petId',
          in: 'path',
          description: 'ID of pet to return',
          required: true,
          type: 'integer',
          format: 'int64'
        }
      },
      paths: {
        '/': {
          parameters: [
            {
              $ref: '#/parameters/petId'
            }
          ],
          get: {
            parameters: [
              {
                name: 'name',
                in: 'formData',
                description: 'Updated name of the pet',
                required: false,
                type: 'string'
              },
              {
                name: 'status',
                in: 'formData',
                description: 'Updated status of the pet',
                required: false,
                type: 'string'
              }
            ]
          }
        }
      }
    }

    const res = await resolve(input, ['paths', '/', 'get'], {
      returnEntireTree: true
    })

    expect(res).toEqual({
      errors: [],
      spec: {
        $$normalized: true,
        swagger: '2.0',
        parameters: {
          petId: {
            name: 'petId',
            in: 'path',
            description: 'ID of pet to return',
            required: true,
            type: 'integer',
            format: 'int64'
          }
        },
        paths: {
          '/': {
            parameters: [
              {
                $ref: '#/parameters/petId'
              }
            ],
            get: {
              parameters: [
                {
                  name: 'name',
                  in: 'formData',
                  description: 'Updated name of the pet',
                  required: false,
                  type: 'string'
                },
                {
                  name: 'status',
                  in: 'formData',
                  description: 'Updated status of the pet',
                  required: false,
                  type: 'string'
                },
                {
                  name: 'petId',
                  in: 'path',
                  description: 'ID of pet to return',
                  required: true,
                  type: 'integer',
                  format: 'int64',
                  $$ref: '#/parameters/petId'
                }
              ]
            }
          }
        }
      }
    })
  })

  test('should normalize Swagger 2.0 that use multiple $refs', async () => {
    const input = {
      swagger: '2.0',
      paths: {
        '/': {
          parameters: [
            {
              $ref: '#/parameters/One'
            },
            {
              $ref: '#/parameters/Two'
            }
          ],
          get: {
            summary: 'has no operation parameters'
          },
          delete: {
            summary: 'has own operation parameters',
            parameters: [
              {
                name: 'Three',
                in: 'query'
              },
              {
                name: 'Four',
                in: 'query'
              }
            ]
          }
        }
      },
      parameters: {
        One: {
          type: 'string',
          name: 'One',
          in: 'query'
        },
        Two: {
          type: 'string',
          name: 'Two',
          in: 'query'
        }
      }
    }

    const res = await resolve(input, ['paths', '/'], {
      returnEntireTree: true
    })

    expect(res).toEqual({
      errors: [],
      spec: {
        $$normalized: true,
        swagger: '2.0',
        paths: {
          '/': {
            parameters: [
              {
                type: 'string',
                name: 'One',
                in: 'query',
                $$ref: '#/parameters/One'
              },
              {
                type: 'string',
                name: 'Two',
                in: 'query',
                $$ref: '#/parameters/Two'
              }
            ],
            get: {
              summary: 'has no operation parameters',
              parameters: [
                {
                  type: 'string',
                  name: 'One',
                  in: 'query',
                  $$ref: '#/parameters/One'
                },
                {
                  type: 'string',
                  name: 'Two',
                  in: 'query',
                  $$ref: '#/parameters/Two'
                }
              ]
            },
            delete: {
              summary: 'has own operation parameters',
              parameters: [
                {
                  name: 'Three',
                  in: 'query'
                },
                {
                  name: 'Four',
                  in: 'query'
                },
                {
                  type: 'string',
                  name: 'One',
                  in: 'query',
                  $$ref: '#/parameters/One'
                },
                {
                  type: 'string',
                  name: 'Two',
                  in: 'query',
                  $$ref: '#/parameters/Two'
                }
              ]
            }
          }
        },
        parameters: {
          One: {
            type: 'string',
            name: 'One',
            in: 'query'
          },
          Two: {
            type: 'string',
            name: 'Two',
            in: 'query'
          }
        }
      }
    })
  })

  test('should normalize idempotently', async () => {
    const input = {
      swagger: '2.0',
      parameters: {
        petId: {
          name: 'petId',
          in: 'path',
          description: 'ID of pet to return',
          required: true,
          type: 'integer',
          format: 'int64'
        }
      },
      paths: {
        '/': {
          parameters: [
            {
              $ref: '#/parameters/petId'
            }
          ],
          get: {
            parameters: [
              {
                name: 'name',
                in: 'formData',
                description: 'Updated name of the pet',
                required: false,
                type: 'string'
              },
              {
                name: 'status',
                in: 'formData',
                description: 'Updated status of the pet',
                required: false,
                type: 'string'
              }
            ]
          }
        }
      }
    }

    const intermediate = await resolve(input, ['paths', '/', 'get'], {
      returnEntireTree: true
    })

    const res = await resolve(intermediate.spec, ['paths', '/', 'get'], {
      returnEntireTree: true
    })

    expect(res).toEqual({
      errors: [],
      spec: {
        swagger: '2.0',
        $$normalized: true,
        parameters: {
          petId: {
            name: 'petId',
            in: 'path',
            description: 'ID of pet to return',
            required: true,
            type: 'integer',
            format: 'int64'
          }
        },
        paths: {
          '/': {
            parameters: [
              {
                $ref: '#/parameters/petId'
              }
            ],
            get: {
              parameters: [
                {
                  name: 'name',
                  in: 'formData',
                  description: 'Updated name of the pet',
                  required: false,
                  type: 'string'
                },
                {
                  name: 'status',
                  in: 'formData',
                  description: 'Updated status of the pet',
                  required: false,
                  type: 'string'
                },
                {
                  name: 'petId',
                  in: 'path',
                  description: 'ID of pet to return',
                  required: true,
                  type: 'integer',
                  format: 'int64',
                  $$ref: '#/parameters/petId'
                }
              ]
            }
          }
        }
      }
    })
  })

  test('should handle this odd $ref/allOf combination', async () => {
    const input = {
      definitions: {
        one: {
          $ref: '#/definitions/two'
        },
        two: {
          type: 'array',
          items: {
            $ref: '#/definitions/three'
          }
        },
        three: {
          allOf: [
            {
              properties: {
                alternate_product_code: {
                  $ref: '#/definitions/three'
                }
              }
            }
          ]
        }
      }
    }

    const res = await resolve(input, ['definitions'])

    // throw new Error(res.errors[0])
    expect(res).toEqual({
      errors: [],
      spec: {
        one: {
          $$ref: '#/definitions/two',
          type: 'array',
          items: {
            $$ref: '#/definitions/three',
            properties: {
              alternate_product_code: {
                $ref: '#/definitions/three'
              }
            }
          }
        },
        two: {
          type: 'array',
          items: {
            $$ref: '#/definitions/three',
            properties: {
              alternate_product_code: {
                $ref: '#/definitions/three'
              }
            }
          }
        },
        three: {
          properties: {
            alternate_product_code: {
              $ref: '#/definitions/three'
            }
          }
        }
      }
    })
  })

  test('should resolve complex allOf correctly', async () => {
    const input = {
      definitions: {
        Simple1: {
          type: 'object',
          properties: {
            id1: {
              type: 'integer',
              format: 'int64'
            }
          }
        },
        Simple2: {
          type: 'object',
          properties: {
            id2: {
              type: 'integer',
              format: 'int64'
            }
          }
        },
        Composed: {
          allOf: [
            {
              $ref: '#/definitions/Simple1'
            },
            {
              $ref: '#/definitions/Simple2'
            }
          ]
        }
      }
    }

    const res = await resolve(input, ['definitions', 'Composed'])

    expect(res).toEqual({
      errors: [],
      spec: {
        type: 'object',
        properties: {
          id1: {
            type: 'integer',
            format: 'int64'
          },
          id2: {
            type: 'integer',
            format: 'int64'
          }
        }
      }
    })
  })
  test('should fully resolve across remote documents correctly', async () => {
    const input = {
      foo: {
        bar: {
          $ref: './remote.json'
        }
      }
    }

    xmock().get('http://example.com/remote.json', function (req, res, next) {
      xmock().restore()
      return res.send({
        baz: {
          $ref: '#/remoteOther'
        },
        remoteOther: {
          result: 'it works!'
        }
      })
    })

    const res = await resolve(input, [], {
      baseDoc: 'http://example.com/main.json'
    })

    expect(res).toEqual({
      errors: [],
      spec: {
        foo: {
          bar: {
            $$ref: './remote.json',
            baz: {
              $$ref: '#/remoteOther',
              result: 'it works!'
            },
            remoteOther: {
              result: 'it works!'
            }
          }
        }
      }
    })
  })
})
