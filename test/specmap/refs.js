import path from 'path';
import cloneDeep from 'lodash/cloneDeep';
import glob from 'glob';
import xmock from 'xmock';
import fs from 'fs';
import jsYaml from 'js-yaml';

import mapSpec, { plugins } from '../../src/specmap';

const { refs } = plugins;

describe('refs', () => {
  let xapp;

  beforeAll(() => {
    xapp = xmock();
  });

  afterAll(() => {
    xapp.restore();
  });

  beforeEach(() => {
    refs.clearCache();
  });

  describe('JSONRefError', () => {
    test('should contain the ref error details', () => {
      try {
        throw new refs.JSONRefError('Failed to download ref', {
          $ref: '#/one',
          basePath: 'localhost/one.json',
        });
      } catch (e) {
        expect(e.toString()).toEqual('JSONRefError: Failed to download ref');
        expect(e.$ref).toEqual('#/one');
        expect(e.basePath).toEqual('localhost/one.json');
      }
    });

    test('.wrapError should wrap an error in JSONRefError', () => {
      try {
        throw refs.wrapError(new Error('hi'), { $ref: '#/one', basePath: 'localhost' });
      } catch (e) {
        expect(e.message).toMatch(/reference/);
        expect(e.message).toMatch(/hi/);
        expect(e.$ref).toEqual('#/one');
        expect(e.basePath).toEqual('localhost');
      }
    });
  });

  describe('absoluteify', () => {
    test('should find the absolute path for a url', () => {
      const res = refs.absoluteify('/one', 'http://example.com');
      expect(res).toEqual('http://example.com/one');
    });

    describe('relative paths', () => {
      test('should think of the basePath as pointing to a document, so use the parent folder for resolution', () => {
        const res = refs.absoluteify('one.json', 'http://example.com/two.json');
        expect(res).toEqual('http://example.com/one.json');
      });

      test('should handle ../', () => {
        const res = refs.absoluteify('../one.json', 'http://example.com/two/three/four.json');
        expect(res).toEqual('http://example.com/two/one.json');
      });
    });
  });

  describe('.extract', () => {
    test('should extract a JSON-Pointer', () => {
      const subject = refs.extract('/one', { one: 1 });
      expect(subject).toEqual(1);
    });

    test('should extract "" as the root obj', () => {
      const subject = refs.extract('', { one: 1 });
      expect(subject).toEqual({ one: 1 });
    });

    test('should fail nicely', () => {
      expect(() => {
        refs.extract('/not/here', { one: 1 });
      }).toThrow();
    });
  });

  describe('getDoc', () => {
    test('should fetch documents', () => {
      const url = 'http://example.com/common.json';
      xapp.get(url, (req, res) => {
        res.send({ works: { yay: true } });
      });
      return refs.getDoc(url).then((doc) => {
        expect(doc).toEqual({ works: { yay: true } });
      });
    });
    test('should parse YAML docs into JSON', () => {
      const url = 'http://example.com/common.yaml';
      xapp.get(url, (req, res) => {
        res.set('Content-Type', 'application/yaml');
        res.send('works:\n  yay: true');
      });
      return refs.getDoc(url).then((doc) => {
        expect(doc).toEqual({ works: { yay: true } });
      });
    });
    test('should cache requests', () => {
      const url = 'http://example.com/common.json';
      xapp.get(url, (req, res) => {
        res.send({ works: { yay: true } });
      });
      return refs
        .getDoc(url)
        .then((doc) => {
          expect(doc).toEqual({ works: { yay: true } });
        })
        .then(() => {
          expect(refs.docCache).toEqual({
            [url]: { works: { yay: true } },
          });
          // Change cache to verify we're using it
          refs.docCache[url].works.yay = false;
          return refs.getDoc(url).then((doc) => {
            expect(doc).toEqual({ works: { yay: false } });
          });
        });
    });
    test('should cache pending HTTP requests', () => {
      const url = 'http://example.com/common.json';
      xapp.get(url, () => {});
      const p1 = refs.getDoc(url);
      const p2 = refs.getDoc(url);
      const p3 = refs.docCache[url];
      expect(p1).toBe(p2);
      expect(p1).toBe(p3);
    });
  });

  describe('.extractFromDoc', () => {
    test('should extract a value from within a doc', () => {
      refs.docCache['some-path'] = {
        one: '1',
      };
      return refs.extractFromDoc('some-path', '/one').then((val) => {
        expect(val).toEqual('1');
      });
    });

    test('should fail nicely', () => {
      refs.docCache['some-path'] = {
        one: '1',
      };

      return refs
        .extractFromDoc('some-path', '/two', '#/two')
        .then(() => {
          throw new Error('Should have failed');
        })
        .catch((e) => {
          expect(e.pointer).toEqual('/two');
          expect(e.basePath).toBeFalsy();
        });
    });
  });

  describe('.absoluteify', () => {
    test('should return the absolute URL', () => {
      const res = refs.absoluteify('../', '/one/two/three.json');
      expect(res).toEqual('/one/');
    });

    test('should throw if there is no basePath, and we try to resolve a realtive url', () => {
      expect(() => {
        refs.absoluteify('../');
      }).toThrow();
    });

    test('should return the absolute URL, with a different asset', () => {
      const res = refs.absoluteify('not-three.json', '/one/two/three.json');
      expect(res).toEqual('/one/two/not-three.json');
    });
  });

  describe('.clearCache', () => {
    test('should clear the docCache', () => {
      const url = 'http://example.com/common.json';

      xapp.get(url, (req, res) => {
        res.send({ works: { yay: true } });
      });

      return refs
        .getDoc(url)
        .then((doc) => {
          expect(doc).toEqual({ works: { yay: true } });
        })
        .then(() => {
          expect(refs.docCache).toEqual({
            [url]: { works: { yay: true } },
          });
          refs.clearCache();
          expect(refs.docCache).toEqual({});
        });
    });

    test('should clear the docCache, of particular items', () => {
      const url = 'http://example.com/common.json';
      const url2 = 'http://example.com/common2.json';

      xapp
        .get(url, (req, res) => {
          res.send({ works: { yay: true } });
        })
        .get(url2, (req, res) => {
          res.send({ works: { yup: true } });
        });

      return refs
        .getDoc(url)
        .then((doc) => {
          expect(doc).toEqual({ works: { yay: true } });
        })
        .then(() => {
          expect(refs.docCache).toEqual({
            [url]: { works: { yay: true } },
          });

          return refs
            .getDoc(url2)
            .then((doc) => {
              expect(doc).toEqual({ works: { yup: true } });
            })
            .then(() => {
              expect(refs.docCache).toEqual({
                [url]: { works: { yay: true } },
                [url2]: { works: { yup: true } },
              });

              refs.clearCache(url);

              expect(refs.docCache).toEqual({
                [url2]: {
                  works: { yup: true },
                },
              });
            });
        });
    });
  });

  describe('.jsonPointerToArray', () => {
    test('should parse a JSON-Pointer into an array of tokens', () => {
      const subject = refs.jsonPointerToArray('/one/two/~1three');
      expect(subject).toEqual(['one', 'two', '/three']);
    });

    test('should parse if JSON-Pointer does not start with forward dash', () => {
      const subject = refs.jsonPointerToArray('one/two/~1three');
      expect(subject).toEqual(['one', 'two', '/three']);
    });

    test('should return [""] for "" and "/"', () => {
      let subject = refs.jsonPointerToArray('');
      expect(subject).toEqual([]);
      subject = refs.jsonPointerToArray('/');
      expect(subject).toEqual([]);
    });
  });

  describe('.unescapeJsonPointerToken', () => {
    test('should parse ~0 and ~1 in the correct order', () => {
      expect(refs.unescapeJsonPointerToken('~01 ~1 ~0 ~10')).toEqual('~1 / ~ /0');
    });

    test('should handle non-strings', () => {
      expect(refs.unescapeJsonPointerToken(1)).toEqual(1);
    });
  });

  describe('handle cyclic references', () => {
    test('should resolve references as deeply as possible', () => {
      const dir = path.join(__dirname, 'data', 'cyclic');
      const caseFiles = glob.sync(`${dir}/**/*.js`);
      const cases = caseFiles
        .sort((f1, f2) => {
          // Sorts by group ('internal', 'external') before test case number
          const group1 = f1.replace(/\//g, path.sep).substring(dir.length).split(path.sep)[1];
          const group2 = f2.replace(/\//g, path.sep).substring(dir.length).split(path.sep)[1];
          const no1 = Number(path.basename(f1).split('.')[0]);
          const no2 = Number(path.basename(f2).split('.')[0]);
          return group1.localeCompare(group2) || no1 - no2;
        })
        .map((filename) => ({ name: filename, filename, ...require(filename) }))
        .filter((testCase) => !testCase.ignore);

      // Runs test serially, just more convenient for debugging if a spec fails
      return new Promise((resolve, reject) => {
        function runNextTestCase(idx) {
          if (idx === cases.length) {
            return resolve();
          }

          const testCase = cases[idx];
          const { spec } = testCase;
          const output = testCase.output || cloneDeep(spec);
          const external = testCase.external || {};

          Object.keys(external).forEach((url) => {
            xapp.get(url, () => external[url]);
          });

          return mapSpec({ spec, plugins: [refs] })
            .then((res) => {
              expect(res.spec).toEqual(output);
            })
            .then(() => {
              runNextTestCase(idx + 1);
            })
            .catch(reject);
        }

        runNextTestCase(0);
      });
    });

    test('should handle this weird case', () =>
      mapSpec({
        spec: {
          one: { one: 1 },
          onelike: { $ref: '#/one' }, // Start with `one` and is a sibling of `/one`
        },
        plugins: [refs],
      }).then((res) => {
        expect(res.spec).toEqual({
          one: { one: 1 },
          onelike: { one: 1 },
        });
      }));

    test('should not stop if one $ref has error', () =>
      mapSpec({
        spec: {
          valid: { data: 1 },
          two: { $ref: 'invalid' },
          three: { $ref: '#/valid' },
        },
        plugins: [refs],
      }).then((res) => {
        expect(res.spec).toEqual({
          valid: { data: 1 },
          two: { $ref: 'invalid' },
          three: { data: 1 },
        });
      }));

    describe('freely named key positions', () => {
      test('should ignore $refs in freely named Swagger positions', () =>
        mapSpec({
          spec: {
            a: 1234,
            parameters: {
              $ref: '#/a',
            },
            responses: {
              $ref: '#/a',
            },
            definitions: {
              $ref: '#/a',
            },
            securityDefinitions: {
              $ref: '#/a',
            },
            properties: {
              $ref: '#/a',
            },
          },
          plugins: [refs],
        }).then((res) => {
          expect(res.spec).toEqual({
            a: 1234,
            parameters: {
              $ref: '#/a',
            },
            responses: {
              $ref: '#/a',
            },
            definitions: {
              $ref: '#/a',
            },
            securityDefinitions: {
              $ref: '#/a',
            },
            properties: {
              $ref: '#/a',
            },
          });
          expect(res.errors).toEqual([]);
        }));
      test('should ignore root or nested $refs in OAS2 response examples', () => {
        const input = {
          swagger: '2.0',
          paths: {
            '/': {
              get: {
                responses: {
                  200: {
                    description: '',
                    examples: {
                      'application/json': {
                        $ref: '#/definitions/Foo',
                        arr: [
                          {
                            $ref: '#/definitions/Foo',
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          definitions: {
            Foo: {
              type: 'string',
            },
          },
        };

        return mapSpec({
          spec: input,
          plugins: [refs],
        }).then((res) => {
          expect(res.spec).toEqual(input);
          expect(res.errors).toEqual([]);
        });
      });
      test('should ignore root or nested $refs in schema examples', () => {
        const input = {
          spec: {
            openapi: '3.0.0',
            paths: {
              '/services': {
                get: {
                  responses: {
                    200: {
                      description: 'An array of services',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                roles: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      value: {
                                        type: 'string',
                                      },
                                      $ref: {
                                        type: 'string',
                                      },
                                      display: {
                                        type: 'string',
                                      },
                                    },
                                    example: {
                                      $ref: '#/whatever',
                                    },
                                  },
                                },
                              },
                            },
                            example: [
                              {
                                id: '1244d92f-332e-4eca-90a9-3e7d4627cf7a',
                                name: 'Licensing groups',
                                roles: [
                                  {
                                    value: '00000000023459FE',
                                    $ref: '/http://api.example.org/users/00000000023459FE',
                                    display: 'Jessica Brandenburg',
                                  },
                                ],
                              },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };

        return mapSpec({
          spec: input,
          plugins: [refs],
        }).then((res) => {
          expect(res.spec).toEqual(input);
          expect(res.errors).toEqual([]);
        });
      });
      test('should ignore root or nested $refs within OAS3 requestBody/response media type `example`', () => {
        const input = {
          openapi: '3.0.0',
          paths: {
            '/order': {
              post: {
                requestBody: {
                  content: {
                    'application/json': {
                      example: {
                        $ref: '#/components/examples/User/value',
                        user: {
                          $ref: '#/components/examples/User/value',
                        },
                        quantity: 1,
                      },
                    },
                  },
                },
                responses: {
                  200: {
                    description: 'OK',
                    content: {
                      'application/json': {
                        example: {
                          $ref: '#/components/examples/User/value',
                          user: {
                            $ref: '#/components/examples/User/value',
                          },
                          quantity: 1,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            examples: {
              User: {
                value: {
                  id: 1,
                  name: 'Sasha',
                },
              },
            },
          },
        };

        return mapSpec({
          spec: input,
          plugins: [refs],
        }).then((res) => {
          expect(res.spec).toEqual(input);
          expect(res.errors).toEqual([]);
        });
      });
      test('should ignore root or nested $refs in values of OAS3 media type `examples`', () => {
        const input = {
          openapi: '3.0.0',
          paths: {
            '/': {
              post: {
                requestBody: {
                  content: {
                    'application/json': {
                      schema: {},
                      examples: {
                        0: {
                          value: {
                            $ref: '#/components/schemas/Foo',
                            arr: [
                              {
                                $ref: '#/components/schemas/Foo',
                              },
                            ],
                          },
                        },
                      },
                    },
                  },
                },
                responses: {
                  200: {
                    description: '',
                    content: {
                      'application/json': {
                        schema: {},
                        examples: {
                          1: {
                            value: {
                              $ref: '#/components/schemas/Foo',
                              arr: [
                                {
                                  $ref: '#/components/schemas/Foo',
                                },
                              ],
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          components: {
            schemas: {
              Foo: {
                type: 'string',
              },
            },
          },
        };

        return mapSpec({
          spec: input,
          plugins: [refs],
        }).then((res) => {
          expect(res.spec).toEqual(input);
          expect(res.errors).toEqual([]);
        });
      });
      test('should ignore root or nested $refs in values of OAS3 parameter examples', () => {
        const input = jsYaml.load(
          fs.readFileSync(path.join('test', 'data', 'parameter-examples-with-refs.yaml'), 'utf8')
        );

        return mapSpec({
          spec: input,
          plugins: [refs],
        }).then((res) => {
          expect(res.spec).toEqual(input);
          expect(res.errors).toEqual([]);
        });
      });
    });

    test('should include fullPath in invalid $ref type', () =>
      mapSpec({
        spec: { one: { $ref: 1 } },
        plugins: [refs],
      }).then((res) => {
        expect(res.errors[0].fullPath).toEqual(['one', '$ref']);
      }));

    test('should be able to overwrite fetchJSON', () => {
      // This is to allow downstream projects, use some proxy
      // ( or otherwise mutate the request )
      // THIS ISN'T IDEAL, need to find a better way of overwriting fetchJSON
      const spy = jest.fn();
      const oriFunc = plugins.refs.fetchJSON;
      plugins.refs.fetchJSON = spy.mockImplementation(() => Promise.resolve(null));

      // When
      plugins.refs.getDoc('hello');

      // Then
      expect(spy.mock.calls.length).toEqual(1);
      expect(spy.mock.calls[0]).toEqual(['hello']);

      plugins.refs.fetchJSON = oriFunc;
    });
  });

  describe('deeply resolved', () => {
    test('should resolve deeply serial $refs, across documents', () => {
      xmock().get('http://example.com/doc-a', (req, res) => {
        xmock().restore();
        return res.send({
          two: {
            $ref: '#/three',
          },
          three: {
            $ref: '#/four',
          },
          four: {
            four: 4,
          },
        });
      });

      return mapSpec({
        plugins: [plugins.refs],
        spec: {
          $ref: 'http://example.com/doc-a#two',
        },
      }).then((res) => {
        expect(res.spec).toEqual({
          four: 4,
        });
      });
    });
    test('should resolve deeply nested $refs, across documents', () => {
      xmock().get('http://example.com/doc-a', (req, res) => {
        xmock().restore();
        return res.send({
          two: {
            innerTwo: {
              $ref: '#/three',
            },
          },
          three: {
            innerThree: {
              $ref: '#/four',
            },
          },
          four: {
            four: 4,
          },
        });
      });

      return mapSpec({
        plugins: [plugins.refs],
        spec: {
          result: {
            $ref: 'http://example.com/doc-a#',
          },
        },
        context: {
          baseDoc: 'http://example.com/main.json',
        },
      }).then((res) => {
        expect(res.spec).toEqual({
          result: {
            two: {
              innerTwo: {
                innerThree: {
                  four: 4,
                },
              },
            },
            three: {
              innerThree: {
                four: 4,
              },
            },
            four: {
              four: 4,
            },
          },
        });
      });
    });
  });
});
