import expect, {spyOn, createSpy} from 'expect'
import resolve from '../src/subtree-resolver'

describe('subtree $ref resolver', function () {
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
  it.skip('should resolve circular $refs')
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
  it.skip('should normalize Swagger 2.0 securities')
  it.skip('should normalize Swagger 2.0 produces')
  it.skip('should normalize Swagger 2.0 consumes')
  it.skip('should resolve allOf correctly')
  it.skip('should resolve complex allOf correctly')
})
