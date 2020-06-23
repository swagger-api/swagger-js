module.exports = {
  name: 'two point to a cyclic node',
  spec: {
    a: {
      b: {
        $ref: '#/e',
      },
    },
    c: {
      d: {
        $ref: '#/e',
      },
    },
    e: {
      f: {
        $ref: '#/e/f',
      },
    },
  },
  output: {
    a: {
      b: {
        f: {
          $ref: '#/e/f',
        },
      },
    },
    c: {
      d: {
        f: {
          $ref: '#/e/f',
        },
      },
    },
    e: {
      f: {
        $ref: '#/e/f',
      },
    },
  },
};
