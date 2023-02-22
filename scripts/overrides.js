/**
 * This script uses package.json `overrides` field and remove all
 * unnecessary dependencies of ApiDOM from npm bundling.
 * The mechanism is fully idempotent.
 *
 * Dependencies are only removed when using following override notation:
 *
 * ```
 *  "dep": {
 *    ".": "dep-override"
 *  }
 * ```
 */
const fs = require('node:fs');
const path = require('node:path');

const rootPckgJSON = require(path.join(__dirname, '..', 'package.json')); // eslint-disable-line import/no-dynamic-require
const { overrides: rootOverrides } = rootPckgJSON;
const swaggerApiOverrides = Object.fromEntries(
  Object.entries(rootOverrides).filter(([pckgName]) => pckgName.startsWith('@swagger-api'))
);

const readPckg = (pckgName) => {
  const pckgPath = path.join(__dirname, '..', 'node_modules', pckgName, 'package.json');

  return JSON.parse(fs.readFileSync(pckgPath, { encoding: 'utf-8' }));
};

const writePckg = (pckgName, pckgJSON) => {
  const pckgPath = path.join(__dirname, '..', 'node_modules', pckgName, 'package.json');

  return fs.writeFileSync(pckgPath, JSON.stringify(pckgJSON, null, 2));
};

const removeDeps = (pckgName, overrides) => {
  const pckgJSON = readPckg(pckgName);

  Object.entries(overrides).forEach(([dep, override]) => {
    if (typeof override === 'object') {
      delete pckgJSON?.dependencies[dep];
    }
  });

  return writePckg(pckgName, pckgJSON);
};

Object.entries(swaggerApiOverrides).forEach(([pckgName]) => {
  removeDeps(pckgName, swaggerApiOverrides[pckgName]);
});
