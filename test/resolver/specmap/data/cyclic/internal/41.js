module.exports = {
  name: '3-node cycle in object',
  spec: {
    a: {
      $ref: '#/defs/d1',
    },
    defs: {
      d1: {
        d1k: {
          $ref: '#/defs/d2',
        },
      },
      d2: {
        d2k: {
          $ref: '#/defs/d3',
        },
      },
      d3: {
        d3k: {
          $ref: '#/defs/d1',
        },
      },
    },
  },
  output: {
    a: {
      d1k: {
        d2k: {
          d3k: {
            $ref: '#/defs/d1',
          },
        },
      },
    },
    defs: {
      d1: {
        d1k: {
          d2k: {
            d3k: {
              $ref: '#/defs/d1',
            },
          },
        },
      },
      d2: {
        d2k: {
          d3k: {
            $ref: '#/defs/d1',
          },
        },
      },
      d3: {
        d3k: {
          $ref: '#/defs/d1',
        },
      },
    },
  },
};
