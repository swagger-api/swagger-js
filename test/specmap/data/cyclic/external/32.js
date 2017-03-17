module.exports = {
  name: 'absolute path to itself',
  spec: {
    x: {
      $ref: 'http://9/spec1#/a'
    }
  },
  external: {
    'http://9/spec1': {
      a: {
        $ref: 'http://9/spec2#/b'
      }
    },
    'http://9/spec2': {
      b: {
        $ref: 'http://9/spec3#/c'
      }
    },
    'http://9/spec3': {
      c: {
        d: {
          $ref: 'http://9/spec3#/c'
        }
      }
    },
  },
  output: {
    x: {
      d: {
        $ref: 'http://9/spec3#/c'
      }
    }
  }
}
