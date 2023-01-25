/**
 * This script simulates `overrides` package.json field
 * in older npm versions that doesn't support it.
 *
 * Older versions of npm match the package overrides by name and version,
 * instead of just name (this is how new `override` package.json field works).
 */
/* eslint-disable import/no-dynamic-require */

const fs = require('fs');
const path = require('path');

const rootPckg = require(path.join(__dirname, '..', 'package.json'));
const apidomReferencePckgPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@swagger-api',
  'apidom-reference',
  'package.json'
);
const apidomReferencePckg = require(apidomReferencePckgPath);

const {
  overrides: { '@swagger-api/apidom-reference': overrides },
} = rootPckg;
const overridesList = Object.keys(overrides).filter((key) => key.startsWith('@swagger-api/'));

overridesList.forEach((override) => {
  if (Object.hasOwn(apidomReferencePckg.dependencies, override)) {
    apidomReferencePckg.dependencies[override] = '=0.0.1';
  }
});

fs.writeFileSync(apidomReferencePckgPath, JSON.stringify(apidomReferencePckg, null, 2));
