module.exports = {
  name: 'link to 3 cyclic nodes (in array)',
  spec: {
    x: {
      $ref: 'http://0.0.0.4/spec#/defs/0',
    },
  },
  external: {
    'http://0.0.0.4/spec': {
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
  },
  output: {
    x: {
      d1k: {
        d2k: {
          d3k: {
            $ref: 'http://0.0.0.4/spec#/defs/0',
          },
        },
      },
    },
  },
};
