module.exports = {
  name: 'cycle among 2 nodes',
  spec: {
    a: {
      b: {
        $ref: '#/c',
      },
    },
    c: {
      d: {
        e: {
          $ref: '#/a',
        },
      },
    },
  },
  output: {
    a: {
      b: {
        d: {
          e: {
            $ref: '#/a',
          },
        },
      },
    },
    c: {
      d: {
        e: {
          $ref: '#/a',
        },
      },
    },
  },
};
