module.exports = {
  name: 'point to a node that eventually points to its ancestor',
  spec: {
    a: {
      $ref: '#/b/c/d',
    },
    b: {
      c: {
        d: {
          $ref: '#/b/c',
        },
      },
    },
  },
  output: {
    a: {
      $ref: '#/b/c',
    },
    b: {
      c: {
        d: {
          $ref: '#/b/c',
        },
      },
    },
  },
};
