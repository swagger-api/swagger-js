module.exports = {
  name: 'two nodes point to a cyclic node',
  spec: {
    a: {
      $ref: '#/c/d',
    },
    b: {
      $ref: '#/c/d',
    },
    c: {
      d: {
        $ref: '#/c/d',
      },
    },
  },
  output: {
    a: {
      $ref: '#/c/d',
    },
    b: {
      $ref: '#/c/d',
    },
    c: {
      d: {
        $ref: '#/c/d',
      },
    },
  },
};
