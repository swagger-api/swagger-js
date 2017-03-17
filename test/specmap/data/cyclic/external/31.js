module.exports = {
  name: 'link to 3 cyclic nodes that use absolute reference',
  spec: {
    x: {
      $ref: 'http://6/spec1#/a'
    }
  },
  external: {
    'http://6/spec1': {
      a: {
        b: {
          $ref: 'http://6/spec2#/c'
        }
      }
    },
    'http://6/spec2': {
      c: {
        d: {
          $ref: 'http://6/spec3#/e'
        }
      }
    },
    'http://6/spec3': {
      e: {
        f: {
          $ref: 'http://6/spec1#/a'
        }
      }
    }
  },
  output: {
    x: {
      b: {
        d: {
          f: {
            $ref: 'http://6/spec1#/a'
          }
        }
      }
    }
  }
}
