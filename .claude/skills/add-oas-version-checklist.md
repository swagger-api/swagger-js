# Add OAS Version - Quick Checklist

Use this checklist when adding support for a new OpenAPI/Swagger version.

## Pre-Implementation

- [ ] Identify new version number (e.g., 4.0.0)
- [ ] Review specification for breaking changes
- [ ] Decide on resolution strategy (SpecMap vs new library)
- [ ] Determine if execution logic changes
- [ ] Identify required dependencies
- [ ] Create feature branch: `feat/add-openapi-X-Y-support`

## Dependencies

- [ ] Add parser/resolver libraries to package.json
- [ ] Update .nvmrc if Node.js version changes
- [ ] Update .github/workflows/nodejs.yml if needed
- [ ] Run `npm install`

## Version Detection

- [ ] Add `isOpenAPIXY()` predicate to `src/helpers/openapi-predicates.js`
- [ ] Test version detection regex
- [ ] Update `src/execute/index.js` version check if needed

## Resolver Strategy

### Simple Approach (Using SpecMap)
- [ ] Create `src/resolver/strategies/openapi-X-Y/index.js`
- [ ] Implement `match()`, `resolve()`, `normalize()` methods
- [ ] Delegate to generic strategy if minimal differences

### Complex Approach (New Library)
- [ ] Create `src/resolver/strategies/openapi-X-Y-{library}/` directory
- [ ] Implement custom parsers:
  - [ ] `src/helpers/{library}/reference/parse/parsers/json/index.js`
  - [ ] `src/helpers/{library}/reference/parse/parsers/yaml/index.js`
  - [ ] `src/helpers/{library}/reference/parse/parsers/openapi-json-X-Y/index.js`
  - [ ] `src/helpers/{library}/reference/parse/parsers/openapi-yaml-X-Y/index.js`
- [ ] Implement HTTP resolver:
  - [ ] `src/helpers/{library}/reference/resolve/resolvers/http-swagger-client/index.js`
- [ ] Implement dereference strategy:
  - [ ] `src/helpers/{library}/reference/dereference/strategies/openapi-X-Y-swagger-client/index.js`
- [ ] Create main strategy files:
  - [ ] `src/resolver/strategies/openapi-X-Y-{library}/index.js`
  - [ ] `src/resolver/strategies/openapi-X-Y-{library}/resolve.js`
  - [ ] `src/resolver/strategies/openapi-X-Y-{library}/normalize.js`

## Register Strategy

- [ ] Update `src/resolver/index.js` to include new strategy (add FIRST in array)
- [ ] Update `src/index.js` to export strategy in `Swagger.resolveStrategies`
- [ ] Expose library components as public API (if new library used)

## Execution Logic (if needed)

- [ ] Create `src/execute/openapi-X-Y/index.js`
- [ ] Implement parameter builders:
  - [ ] `buildPathParameter()`
  - [ ] `buildQueryParameter()`
  - [ ] `buildHeaderParameter()`
  - [ ] `buildCookieParameter()`
- [ ] Update `src/execute/index.js` to use new builders
- [ ] Handle new security schemes (if applicable)
- [ ] Update server URL templating (if applicable)

## Testing

### Test Structure
- [ ] Create `test/resolver/strategies/openapi-X-Y/` directory
- [ ] Create `test/resolver/strategies/openapi-X-Y/__fixtures__/` directory
- [ ] Create `test/resolver/strategies/openapi-X-Y/normalize/` directory
- [ ] Create `test/execute/openapi-X-Y.js`
- [ ] Create `test/resolver/{library}/` (if new library)

### Test Fixtures
- [ ] Create `__fixtures__/petstore.json`
- [ ] Create fixtures for $ref resolution
- [ ] Create fixtures for circular references
- [ ] Create fixtures for parameter macros
- [ ] Create fixtures for security schemes

### Resolver Tests
- [ ] Test version matching
- [ ] Test local spec resolution
- [ ] Test external $ref resolution
- [ ] Test circular reference handling
- [ ] Test parameter normalization
- [ ] Test operation ID normalization
- [ ] Test security normalization
- [ ] Test `skipNormalization` option
- [ ] Test `useCircularStructures` option
- [ ] Test `allowMetaPatches` option

### Execution Tests
- [ ] Test execution with operationId
- [ ] Test execution with pathName + method
- [ ] Test query parameter handling
- [ ] Test path parameter handling
- [ ] Test header parameter handling
- [ ] Test request body handling
- [ ] Test security handling
- [ ] Test client instance API (tags interface)

### Library Tests (if new library)
- [ ] Test HTTP resolver
- [ ] Test JSON parser detection
- [ ] Test YAML parser detection
- [ ] Test OAS X.Y JSON parser detection
- [ ] Test OAS X.Y YAML parser detection
- [ ] Test dereference strategy

### Run Tests
- [ ] `npm run test:unit` passes
- [ ] `npm run test:unit:coverage` shows good coverage (90%+)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] `npm run test:artifact` passes

## Documentation

- [ ] Update README.md:
  - [ ] Add version to compatibility list
  - [ ] Add usage example
- [ ] Update CLAUDE.md:
  - [ ] Add to project overview
  - [ ] Add to resolver strategies section
  - [ ] Add architectural details
  - [ ] Update key files reference
- [ ] Create migration guide (if breaking changes):
  - [ ] `docs/migration/X.Y.md`
- [ ] Update CHANGELOG.md:
  - [ ] Add new version entry
  - [ ] List features added
  - [ ] List changes made
  - [ ] List deprecations (if any)

## Build Configuration

- [ ] Update `config/webpack/browser.config.babel.js` (if needed)
- [ ] Update `babel.config.js` (if needed)
- [ ] Update `package.json` browser field (if needed)
- [ ] Build all targets:
  - [ ] `npm run build:umd:browser`
  - [ ] `npm run build:commonjs`
  - [ ] `npm run build:es`
- [ ] Verify bundle sizes acceptable
- [ ] Run `npm run analyze:umd:browser`

## Commits

- [ ] Commit 1: Dependencies
  ```
  chore(deps): integrate {Library} into codebase
  ```
- [ ] Commit 2: Parsers
  ```
  feat(resolve): add {Library} parsers for OpenAPI X.Y
  ```
- [ ] Commit 3: Resolver
  ```
  feat(resolve): add {Library} HTTP resolver
  ```
- [ ] Commit 4: Dereference Strategy
  ```
  feat: add OpenAPI X.Y dereference strategy
  ```
- [ ] Commit 5: Normalization
  ```
  feat(normalization): introduce normalization for OpenAPI X.Y
  ```
- [ ] Commit 6: Main Resolution
  ```
  feat(resolver): add support for OpenAPI X.Y resolution
  ```
- [ ] Commit 7: Subtree Resolver
  ```
  feat(subtree-resolver): adapt to support OpenAPI X.Y
  ```
- [ ] Commit 8: Tests
  ```
  test(resolver): add tests for OpenAPI X.Y resolution
  ```
- [ ] Commit 9: Integration
  ```
  feat: expose {Library} components as public API
  ```
- [ ] Commit 10: Documentation
  ```
  docs: add documentation for OpenAPI X.Y support
  ```

## Pull Request

- [ ] Run final checks:
  - [ ] `npm run lint:fix`
  - [ ] `npm test`
  - [ ] `npm run build`
- [ ] Push branch
- [ ] Create PR with description
- [ ] Fill out PR checklist
- [ ] Request reviews
- [ ] Address review comments
- [ ] Ensure CI passes
- [ ] Merge after approval

## Post-Merge

- [ ] Monitor CI/CD release workflow
- [ ] Verify npm package published
- [ ] Test with swagger-ui
- [ ] Update related projects
- [ ] Announce on community channels
- [ ] Update documentation sites

## Success Metrics

- [ ] All tests passing (100%)
- [ ] 90%+ code coverage for new code
- [ ] Bundle size increase <5%
- [ ] No breaking changes
- [ ] Documentation complete
- [ ] CI/CD passing
- [ ] swagger-ui integration working

---

**Last Updated:** 2026-01-23