module.exports = {
  name: 'cycle among 2 nodes',
  spec: {
    b: {
      a: {
        $ref: '#/a',
      },
    },
    a: {
      b: {
        $ref: '#/b',
      },
    },
  },
  output: {
    b: {
      a: {
        b: {
          $ref: '#/b',
        },
      },
    },
    a: {
      b: {
        $ref: '#/b',
      },
    },
  },
};
