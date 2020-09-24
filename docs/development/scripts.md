# Helpful scripts

Any of the scripts below can be run by typing `npm run <script name>` in the project's root directory.

### Developing
Script name | Description
--- | ---
`lint` | Report ESLint style errors and warnings.
`lint:fix` | Automatically fix linting problems.

### Building
Script name | Description
--- | ---
`build` | Build a new set of JS assets, and output them to `/dist` and `/browser`.
`build:umd:browser` | Build `/dist/swagger-client.browser.*.js` files.
`build:common` | Build `/lib` directory containing ES5 code with commonjs imports.
`build:es` | Build `/es` directory containing ES5 code with ES6 imports

### Testing
Script name | Description
--- | ---
`test` | Run unit and bundle tests.
`test:unit` | Run unit tests in Node.
`test:unit:watch` | Run tests with change watching.
`test:artifact` | Run tests for browser and node build fragments.
`test:artifact:umd:browser` | Run tests for browser UMD webpack build fragment.
`test:artifact:commonjs` | Run tests for node commonjs fragments.
`test:artifact:es` | Run tests for ES6 imports fragments.

### Auditing

Script name | Description
--- | ---
`security-audit` | Runs npm security audit for production and development dependencies.
`security-audit:dev` | Runs npm security audit for all development dependencies with `moderate` audit level. 
`security-audit:prod` | Runs npm security audit for production dependencies with `low` audit level.
`deps:license` | Generates attribution files for production and development dependencies

