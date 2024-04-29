module.exports = {
  name: 'a few hops to an internally cyclic doc',
  spec: {
    x: {
      $ref: 'http://0.0.0.8/spec1#/a',
    },
  },
  external: {
    'http://0.0.0.8/spec1': {
      a: {
        $ref: 'http://0.0.0.8/spec2#/b',
      },
    },
    'http://0.0.0.8/spec2': {
      b: {
        $ref: 'http://0.0.0.8/spec3#/c',
      },
    },
    'http://0.0.0.8/spec3': {
      c: {
        d: {
          $ref: '#/c',
        },
      },
    },
  },
  output: {
    x: {
      d: {
        $ref: 'http://0.0.0.8/spec3#/c',
      },
    },
  },
};
