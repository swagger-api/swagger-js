module.exports = {
  name: 'link to 3 cyclic nodes',
  spec: {
    x: {
      $ref: 'http://0.0.0.3/spec#/defs/d1',
    },
  },
  external: {
    'http://0.0.0.3/spec': {
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
  },
  output: {
    x: {
      d1k: {
        d2k: {
          d3k: {
            $ref: 'http://0.0.0.3/spec#/defs/d1',
          },
        },
      },
    },
  },
};
