const fs = require("fs")
const Swagger = require("./dist")

const spec = JSON.parse(fs.readFileSync(__dirname + "/api-docs.json"))

Swagger({ spec }).then((client) => {
  console.log(client)
  process.exit(0)
})
