module.exports = {
  name: 'point to ancestor',
  spec: {
    a: {
      b: {
        c: {
          $ref: '#/a/b/c',
        },
      },
    },
  },
};
