module.exports = {
  name: 'point to a node that eventually points to its ancestor',
  spec: {
    a: {
      b: {
        $ref: '#/c',
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
  output: {
    a: {
      b: {
        d: {
          e: {
            $ref: '#/c/d',
          },
        },
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
