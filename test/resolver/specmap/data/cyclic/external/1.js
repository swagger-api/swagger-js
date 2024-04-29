module.exports = {
  name: 'link to a cyclic node',
  spec: {
    x: {
      $ref: 'http://0.0.0.1/spec#/a',
    },
  },
  external: {
    'http://0.0.0.1/spec': {
      a: {
        b: {
          $ref: '#/a',
        },
      },
    },
  },
  output: {
    x: {
      b: {
        $ref: 'http://0.0.0.1/spec#/a',
      },
    },
  },
};
