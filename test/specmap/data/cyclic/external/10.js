module.exports = {
  name: 'link to 2 cyclic nodes',
  spec: {
    x: {
      $ref: 'http://2/spec#/a'
    }
  },
  external: {
    'http://2/spec': {
      a: {
        $ref: '#/b'
      },
      b: {
        $ref: '#/a'
      }
    }
  },
  output: {
    x: {
      $ref: '#/a'
    }
  }
}
