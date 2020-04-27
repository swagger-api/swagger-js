# Helpful scripts

Any of the scripts below can be run by typing `npm run <script name>` in the project's root directory.

### Developing
Script name | Description
--- | ---
`test:lint` | Report ESLint style errors and warnings.

### Building
Script name | Description
--- | ---
`build` | Build a new set of JS assets, and output them to `/dist` and `/browser`.
`build:bundle` | Build `/browser/index.js` only.
`build:umd` | Build `/dist/index.js` only.

### Testing
Script name | Description
--- | ---
`test` | Run unit tests in Node and run ESLint in errors-only mode.
`test:lint` | Report ESLint style errors and warnings.
`test:unit` | Run unit tests in Node.
`test:unit:watch` | Run tests with change watching.
