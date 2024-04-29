module.exports = {
  name: '3-node cycle in array',
  spec: {
    a: {
      $ref: '#/defs/0',
    },
    defs: [
      {
        d1k: {
          $ref: '#/defs/1',
        },
      },
      {
        d2k: {
          $ref: '#/defs/2',
        },
      },
      {
        d3k: {
          $ref: '#/defs/0',
        },
      },
    ],
  },
  output: {
    a: {
      d1k: {
        d2k: {
          d3k: {
            $ref: '#/defs/0',
          },
        },
      },
    },
    defs: [
      {
        d1k: {
          d2k: {
            d3k: {
              $ref: '#/defs/0',
            },
          },
        },
      },
      {
        d2k: {
          d3k: {
            $ref: '#/defs/0',
          },
        },
      },
      {
        d3k: {
          $ref: '#/defs/0',
        },
      },
    ],
  },
};
