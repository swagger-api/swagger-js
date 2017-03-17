// Ensure you've built SwaggerJS
const Swagger = require('../dist')

const json = {
  one: {
    one: 1,
  },
  dest: {
    $ref: '#/one'
  }
}

Swagger({spec: json}).then((jx) => {
  console.log(jx.spec)
  console.log('$$ref', jx.spec.dest.$$ref)
})
