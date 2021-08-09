// https://github.com/swagger-api/swagger-js/issues/1719

import path from 'path';
import fs from 'fs';
import jsYaml from 'js-yaml';

import resolveSubtree from '../../src/subtree-resolver';

const testDoc = jsYaml.load(
  fs.readFileSync(path.join('test', 'data', 'issue-1719-ref-object-reference.yaml'), 'utf8')
);

test('#1719: $ref object should not be treated as a reference (string)', async () => {
  const specPath = ['paths', '/throwError', 'post'];
  const res = await resolveSubtree(testDoc, specPath);

  expect(res.errors.length).toEqual(0);
  expect(res.spec).toHaveProperty(
    [
      'requestBody',
      'content',
      'application/json',
      'schema',
      'properties',
      'propertyOne',
      'items',
      'properties',
      'propertyTwo',
      'properties',
      '$ref',
    ],
    { type: 'string' }
  );
});
