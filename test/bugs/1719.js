// https://github.com/swagger-api/swagger-js/issues/1719

import path from 'path';
import fs from 'fs';
import jsYaml from 'js-yaml';

import resolveSubtree from '../../src/subtree-resolver';

const testDoc = jsYaml.safeLoad(
  fs.readFileSync(path.join('test', 'data', 'swos-123-ref-object-reference.yaml'), 'utf8')
);

test('1719: $ref object should not be treated as a reference (string)', async () => {
  const specPath = ['paths', '/throwError', 'post'];
  const res = await resolveSubtree(testDoc, specPath);

  expect(res.errors.length).toEqual(0);

  expect(res.spec).toEqual(
    expect.objectContaining({
      requestBody: expect.objectContaining({
        content: expect.objectContaining({
          'application/json': expect.objectContaining({
            schema: expect.objectContaining({
              properties: expect.objectContaining({
                references: expect.objectContaining({
                  properties: expect.objectContaining({
                    billingDetails: expect.objectContaining({
                      items: expect.objectContaining({
                        properties: expect.objectContaining({
                          contact: expect.objectContaining({
                            anyOf: expect.arrayContaining([
                              expect.objectContaining({
                                properties: expect.objectContaining({
                                  $ref: { type: 'string' },
                                }),
                              }),
                            ]),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    })
  );
});
