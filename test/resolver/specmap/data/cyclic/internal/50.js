module.exports = {
  spec: {
    a: {
      b: {
        $ref: '#/c',
      },
    },
    c: {
      d: {
        $ref: '#/a',
      },
    },
    e: {
      $ref: '#/f',
    },
    f: {
      $ref: '#/a',
    },
  },
  output: {
    a: {
      b: {
        d: {
          $ref: '#/a',
        },
      },
    },
    c: {
      d: {
        $ref: '#/a',
      },
    },
    e: {
      b: {
        d: {
          $ref: '#/a',
        },
      },
    },
    f: {
      b: {
        d: {
          $ref: '#/a',
        },
      },
    },
  },
};
