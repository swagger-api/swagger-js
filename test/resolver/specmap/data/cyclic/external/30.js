module.exports = {
  name: 'link to cyclic nodes that use absolute reference',
  spec: {
    x: {
      $ref: 'http://0.0.0.5/spec1#/a',
    },
  },
  external: {
    'http://0.0.0.5/spec1': {
      a: {
        b: {
          $ref: 'http://0.0.0.5/spec2#/c',
        },
      },
    },
    'http://0.0.0.5/spec2': {
      c: {
        d: {
          $ref: 'http://0.0.0.5/spec1#/a',
        },
      },
    },
  },
  output: {
    x: {
      b: {
        d: {
          $ref: 'http://0.0.0.5/spec1#/a',
        },
      },
    },
  },
};
