// Ensure you've built SwaggerJS
const Swagger = require('../dist')

const json = {
  one: {
    one: 1,
  },
  two: {
    two: 2
  },
  all: [
    {$ref: '#/one'},
    {$ref: '#/two'},
    {three: 3},
  ]
}

Swagger({spec: json}).then((jx) => {
  console.log(jx.spec)
})
