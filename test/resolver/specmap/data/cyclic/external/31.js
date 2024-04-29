module.exports = {
  name: 'link to 3 cyclic nodes that use absolute reference',
  spec: {
    x: {
      $ref: 'http://0.0.0.6/spec1#/a',
    },
  },
  external: {
    'http://0.0.0.6/spec1': {
      a: {
        b: {
          $ref: 'http://0.0.0.6/spec2#/c',
        },
      },
    },
    'http://0.0.0.6/spec2': {
      c: {
        d: {
          $ref: 'http://0.0.0.6/spec3#/e',
        },
      },
    },
    'http://0.0.0.6/spec3': {
      e: {
        f: {
          $ref: 'http://0.0.0.6/spec1#/a',
        },
      },
    },
  },
  output: {
    x: {
      b: {
        d: {
          f: {
            $ref: 'http://0.0.0.6/spec1#/a',
          },
        },
      },
    },
  },
};
