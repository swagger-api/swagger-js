import expect, {spyOn, createSpy} from 'expect'
import resolve from '../src/subtree-resolver'

describe.only('subtree $ref resolver', function () {
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
})
