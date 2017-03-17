module.exports = {
  name: 'link to a cyclic node',
  spec: {
    x: {
      $ref: 'http://1/spec#/a'
    }
  },
  external: {
    'http://1/spec': {
      a: {
        b: {
          $ref: '#/a'
        }
      }
    }
  },
  output: {
    x: {
      b: {
        $ref: '#/a'
      }
    }
  }
}
