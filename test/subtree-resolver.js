import expect, {spyOn, createSpy} from 'expect'
import xmock from 'xmock'
import resolve from '../src/subtree-resolver'

describe('subtree $ref resolver', function () {
  let xapp

  before(() => {
    xapp = xmock()
  })

  after(() => {
    xapp.restore()
  })

  beforeEach(() => {
    // refs.clearCache()
  })

  it('should resolve a subtree of an object, and return the targeted subtree', async function () {
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
  })

  it('should resolve circular $refs when a baseDoc is provided', async function () {
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
  })

  it('should return null when the path is invalid', async function () {
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
  it('should not resolve an untargeted subtree', async function () {
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
  it('should normalize Swagger 2.0 consumes', async () => {
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
  it('should normalize Swagger 2.0 produces', async () => {
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
  it('should normalize Swagger 2.0 parameters', async () => {
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

  it('should normalize idempotently', async () => {
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

  it.only('should handle this odd $ref/allOf combination', async () => {
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

  it('should resolve complex allOf correctly', async () => {
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
  it('should fully resolve across remote documents correctly', async () => {
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
