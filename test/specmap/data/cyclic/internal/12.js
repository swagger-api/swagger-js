module.exports = {
  name: 'point to a node that eventually points to its ancestor',
  spec: {
    c: {
      d: {
        e: {
          $ref: '#/c/d',
        },
      },
    },
    a: {
      b: {
        $ref: '#/c/d/e',
      },
    },
  },
  output: {
    a: {
      b: {
        $ref: '#/c/d',
      },
    },
    c: {
      d: {
        e: {
          $ref: '#/c/d',
        },
      },
    },
  },
};
