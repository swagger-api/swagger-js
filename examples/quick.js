// Ensure you've built SwaggerJS
const Swagger = require('../dist')
const jsYaml = require('@kyleshockey/js-yaml')

/**
 * This is a file, for quickly testing out functionality of SwaggerJS
 * Its not meant to represent some particular case, but rather you modify it for quick tests
 */
const yaml = `
one:
  one: 1
two:
  $ref: '#/one'
`

const json = jsYaml.safeLoad(yaml)

Swagger({spec: json}).then((jx) => {
  console.log(jx.spec)
})
