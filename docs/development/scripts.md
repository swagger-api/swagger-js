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
`build:browser` | Build `/browser/index.js` only.
`build:node` | Build `/dist/index.js` only.
`build:bundlesize` | Check if the bundle size is within allowed size range.

### Testing
Script name | Description
--- | ---
`test` | Run unit and bundle tests.
`test:unit` | Run unit tests in Node.
`test:unit:watch` | Run tests with change watching.
`test:bundle` | Run tests for browser and node build fragments.
`test:bundle:browser` | Run tests for browser build fragments.
`test:bundle:node` | Run tests for node build fragments.

### Auditing

Script name | Description
--- | ---
`security-audit` | Runs npm security audit for production and development dependencies.
`security-audit:all` | Runs npm security audit for all dependencies with `moderate` audit level. 
`security-audit:prod` | Runs npm security audit for production dependencies with `low` audit level.
`deps:license` | Generates attribution files for production and development dependencies
`deps:size` | Generates dependencies size breakdown report.

