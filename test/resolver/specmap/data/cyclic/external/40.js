module.exports = {
  name: 'link to 2 cyclic nodes that use relative reference',
  spec: {
    x: {
      $ref: 'http://0.0.0.7/spec1#/a',
    },
  },
  external: {
    'http://0.0.0.7/spec1': {
      a: {
        b: {
          $ref: '../spec2#/c',
        },
      },
    },
    'http://0.0.0.7/spec2': {
      c: {
        d: {
          $ref: '../spec1#/a',
        },
      },
    },
  },
  output: {
    x: {
      b: {
        d: {
          $ref: 'http://0.0.0.7/spec1#/a',
        },
      },
    },
  },
};
