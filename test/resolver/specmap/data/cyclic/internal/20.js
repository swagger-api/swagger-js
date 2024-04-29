module.exports = {
  name: 'cycle among 2 nodes',
  spec: {
    a: {
      $ref: '#/a',
    },
    b: {
      $ref: '#/b',
    },
  },
};
