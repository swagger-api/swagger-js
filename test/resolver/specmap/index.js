import * as undici from 'undici';
import cloneDeep from 'lodash/cloneDeep';
import traverse from 'traverse';

import mapSpec, { SpecMap, plugins } from '../../../src/resolver/specmap/index.js';
import lib from '../../../src/resolver/specmap/lib/index.js';

describe('specmap', () => {
  let testContext;
  let mockAgent;
  let originalGlobalDispatcher;

  beforeEach(() => {
    testContext = {};
    mockAgent = new undici.MockAgent();
    originalGlobalDispatcher = undici.getGlobalDispatcher();
    undici.setGlobalDispatcher(mockAgent);
  });

  afterEach(() => {
    undici.setGlobalDispatcher(originalGlobalDispatcher);
    mockAgent = null;
    originalGlobalDispatcher = null;
  });

  describe('#dispatch', () => {
    test('should pass the spec through', () =>
      mapSpec({
        spec: { bob: true },
        plugins: [],
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: { bob: true },
        });
      }));

    test('should call plugins with patches', (done) => {
      mapSpec({
        spec: { one: 1 },
        plugins: [
          {
            specMap: (patches) => {
              try {
                expect(patches).toEqual([
                  {
                    op: 'add',
                    path: [],
                    value: { one: 1 },
                  },
                ]);
                done();
              } catch (e) {
                done(e);
              }
            },
          },
        ],
      });
    });

    test('should include a library of functions, including `add` ', (done) => {
      mapSpec({
        spec: { bob: true },
        plugins: [
          {
            specMap(patches, specmap) {
              expect(typeof specmap.add).toBe('function');
              done();
            },
          },
        ],
      });
    });

    test('should accept simple functions for plugins', (done) => {
      mapSpec({
        spec: { one: 1 },
        plugins: [
          (patches) => {
            try {
              expect(patches).toEqual([
                {
                  op: 'add',
                  path: [],
                  value: { one: 1 },
                },
              ]);
            } catch (e) {
              done(e);
            }
            done();
          },
        ],
      });
    });

    test('allows synchronous calls (no Promise)', () =>
      mapSpec({
        spec: { here: true },
        plugins: [(patches, specMap) => !specMap.hasRun() && specMap.add(['alsoHere'], true)],
      }).then((result) => {
        expect(result).toEqual({
          errors: [],
          spec: {
            here: true,
            alsoHere: true,
          },
        });
      }));

    test('should block until promises resolve before running next plugin', () => {
      const p1 = (patches, specmap) => {
        if (specmap.hasRun()) {
          return undefined;
        }
        return specmap.replace(
          ['val'],
          new Promise((resolve) => {
            setTimeout(() => {
              resolve('some val');
            }, 50);
          })
        );
      };

      const p2 = (patches, specmap) => {
        if (specmap.hasRun()) {
          return undefined;
        }
        if (
          patches[1].value !== 'some val' &&
          patches[2].value !== 'some val' &&
          patches[3].value !== 'some val'
        ) {
          return [new Error('Promises not yet resolved')];
        }

        return undefined;
      };

      return mapSpec({
        spec: {},
        plugins: [p1, p1, p1, p2],
      }).then((result) => {
        expect(result).toEqual({
          errors: [],
          spec: { val: 'some val' },
        });
      });
    });

    test('should not block the first plugin if it is executed multiple times at once', () => {
      let hasRunTwice = false;
      const p1 = (patches, specmap) => {
        if (!specmap.hasRun()) {
          return [
            specmap.add(['val1'], 'some val1'),
            specmap.add(
              ['val2'],
              new Promise((resolve) => {
                setTimeout(() => resolve('some val2'), 50);
              })
            ),
          ];
        }
        if (!hasRunTwice) {
          hasRunTwice = true;
          // We expect this to run immediately with the val1 patch,
          // but without the val2 patch because the promise hasn't been resolved.
          if (patches[0].value !== 'some val1' || patches[1] != null) {
            return [new Error('Should not block')];
          }
        }

        return undefined;
      };

      return mapSpec({
        spec: {},
        plugins: [p1],
      }).then((result) => {
        expect(result).toEqual({
          errors: [],
          spec: { val1: 'some val1', val2: 'some val2' },
        });
      });
    });

    test('records errors after each plugin', () =>
      mapSpec({
        spec: { here: true },
        plugins: [
          {
            specMap() {
              if (!this.hasRun) {
                this.hasRun = true;
                return [new Error('This is not working'), new TypeError('wrong type')];
              }
              return undefined;
            },
            toString() {
              return 'Mocha test';
            },
          },
        ],
      }).then((result) => {
        expect(result).toEqual({
          errors: [new Error('This is not working'), new TypeError('wrong type')],
          spec: { here: true },
        });
      }));

    test('should record errors and mutations', () => {
      let hasRun = false;
      return mapSpec({
        spec: { two: 1 },
        plugins: [
          (patch, specmap) => {
            if (hasRun) {
              return undefined;
            }
            hasRun = true;
            return [new Error('This is not working'), specmap.replace(['two'], 2)];
          },
        ],
      }).then((result) => {
        expect(result).toEqual({
          errors: [new Error('This is not working')],
          spec: {
            two: 2,
          },
        });
      });
    });

    test('should allow a plugin to process its own mutations', () => {
      return mapSpec({
        spec: { counter: 1 },
        plugins: [incrementIf],
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: { counter: 10 },
        });
      });

      function incrementIf(patches, specmap) {
        return specmap.forEachNewPrimitive(patches, (val, key, path) => {
          if (key === 'counter') {
            const count = specmap.get(path);
            if (count < 10) {
              return specmap.replace(path, count + 1);
            }
          }
          return undefined;
        });
      }
    });

    test('should have a delightful API, exposed through `lib`', () => {
      function increment(patches, specmap) {
        if (specmap.hasRun()) {
          return undefined;
        }
        return specmap.forEachNewPrimitive(patches, (val, key, path) => {
          const count = specmap.get(path);
          return specmap.replace(path, count + 1);
        });
      }

      function addFour(patches, specmap) {
        const fourPath = ['middle', 'four'];
        if (!specmap.get(fourPath)) {
          return specmap.add(fourPath, 4);
        }

        return undefined;
      }

      return mapSpec({
        spec: {
          one: 1,
          middle: {
            two: 2,
            deep: {
              three: 3,
            },
          },
        },
        plugins: [addFour, increment],
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: {
            one: 2,
            middle: {
              two: 3,
              deep: {
                three: 4,
              },
              four: 5,
            },
          },
        });
      });
    });

    describe('#getLib', () => {
      test('.add should return a JSON-Patch add object', () => {
        const map = new SpecMap();
        expect(typeof map.getLib).toBe('function');
        expect(map.getLib().add('/one', 1)).toEqual({ op: 'add', path: '/one', value: 1 });
      });

      describe('.get', () => {
        beforeEach(() => {
          testContext.obj = {
            one: 1,
            deep: {
              ly: {
                nested: 'works',
              },
            },
            arrays: ['could', 'alsoWork'],
          };

          testContext.specMap = new SpecMap({
            debugLevel: 'verbose',
            spec: testContext.obj,
          });
        });

        test('should allow simple queries', () => {
          expect(testContext.specMap.getLib().get(['one'])).toEqual(1);
        });

        test('should return `undefined` for invalid queries', () => {
          expect(testContext.specMap.getLib().get(['does', 'not', 'exist'])).toEqual(undefined);
        });

        test('should allow deep queries', () => {
          expect(testContext.specMap.getLib().get(['deep', 'ly'])).toEqual({
            nested: 'works',
          });
        });

        test('should allow querying arrays', () => {
          expect(testContext.specMap.getLib().get(['arrays', 1])).toEqual('alsoWork');
        });

        test('should allow getting the root object, with []', () => {
          expect(testContext.specMap.getLib().get([])).toEqual(testContext.obj);
        });
      });
    });

    describe('#nextPlugin', () => {
      test('should return a plugin', () => {
        const map = new SpecMap({
          plugins: [() => 'josh'],
        });

        const fn = map.nextPlugin();
        expect(fn()).toEqual('josh');
      });

      test('should handle multiple plugins', () =>
        mapSpec({
          spec: { one: 1 },
          plugins: [
            () => {
              /* do nothing */
            },
            (patches, specmap) => {
              if (specmap.get(['two']) !== 2) {
                return specmap.add(['two'], 2);
              }
              return undefined;
            },
            {
              key: 'one',
              plugin: (val, key, fullPath, specmap) => {
                if (val !== 10) {
                  return specmap.replace(fullPath, val + 1);
                }
                return undefined;
              },
            },
          ],
        }).then((res) => {
          expect(res.errors).toEqual([]);
          expect(res.spec).toEqual({ one: 10, two: 2 });
        }));

      test('should handle multiple plugins, with the same key', () =>
        mapSpec({
          spec: { one: 1 },
          plugins: [
            {
              key: 'one',
              name: '1st',
              plugin: (val, key, fullPath, specmap) => {
                if (val < 3) {
                  return specmap.replace(fullPath, val + 1);
                }
                return undefined;
              },
            },
            {
              key: 'one',
              name: '2nd',
              plugin: (val, key, fullPath, specmap) => {
                if (val < 4) {
                  return specmap.replace(fullPath, val + 1);
                }
                return undefined;
              },
            },
          ],
        }).then((res) => {
          expect(res.errors).toEqual([]);
          expect(res.spec).toEqual({ one: 4 });
        }));
    });

    describe('plugins', () => {
      describe('$refs', () => {
        test('should resolve internal $refs', () =>
          mapSpec({
            spec: {
              nested: { one: 1 },
              another: { $ref: '#/nested' },
            },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res).toEqual({
              errors: [],
              spec: {
                nested: { one: 1 },
                another: { one: 1 },
              },
            });
          }));

        test('should resolve internal $refs in arrays', () =>
          mapSpec({
            spec: {
              nested: { one: 1 },
              another: [{ $ref: '#/nested' }],
            },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res).toEqual({
              errors: [],
              spec: {
                nested: { one: 1 },
                another: [{ one: 1 }],
              },
            });
          }));

        test('should resolve internal $refs that points to object inside an array', () =>
          mapSpec({
            spec: {
              nested: [{ one: 1 }],
              another: { $ref: '#/nested' },
            },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res).toEqual({
              errors: [],
              spec: {
                nested: [{ one: 1 }],
                another: [{ one: 1 }],
              },
            });
          }));

        test('should resolve internal $refs that points to item inside an array', () =>
          mapSpec({
            spec: {
              nested: [{ one: 1 }],
              another: { $ref: '#/nested/0/one' },
            },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res).toEqual({
              errors: [],
              spec: {
                nested: [{ one: 1 }],
                another: 1,
              },
            });
          }));

        test('should resolve a $ref without a pointer', () => {
          plugins.refs.docCache['http://some-path'] = {
            one: 1,
          };

          return mapSpec({
            spec: {
              $ref: 'http://some-path',
            },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res).toEqual({
              errors: [],
              spec: {
                one: 1,
              },
            });
          });
        });

        test('should fail if we cannot resolve a ref', () =>
          mapSpec({
            spec: {
              nested: { one: 1 },
              another: { $ref: '#/not/here' },
            },
            context: { baseDoc: 'some-path' },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res.spec).toEqual({
              nested: { one: 1 },
              another: { $ref: '#/not/here' },
            });
            expect(res.errors[0].$ref).toEqual('#/not/here');
            expect(res.errors[0].pointer).toEqual('/not/here');
            expect(res.errors[0].baseDoc).toEqual('some-path');
          }));

        test('should resolve petstore-simple', () => {
          const spec = cloneDeep(require('./data/specs/petstore-simple.json')); // eslint-disable-line global-require
          const resolvedSpec = cloneDeep(require('./data/specs/petstore-simple-resolved.json')); // eslint-disable-line global-require
          const initialRefCount = countRefs(spec);
          expect(initialRefCount).toEqual(9);

          return mapSpec({
            spec,
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res.errors).toEqual([]);
            expect(countRefs(res.spec)).toBeLessThan(initialRefCount);
            expect(countRefs(res.spec)).toEqual(0);

            expect(res).toEqual({
              errors: [],
              spec: resolvedSpec,
            });
          });
        });

        test('should retain local $refs', () =>
          mapSpec({
            spec: {
              one: { a: 1, $ref: '#/two' },
              two: { b: 2 },
            },
            allowMetaPatches: true,
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res.spec.one.$$ref).toEqual('#/two');
            expect(res.spec.two.$$ref).toEqual(undefined);
          }));

        describe('allowMetaPatches = true', () => {
          test('should retain external $refs', () => {
            plugins.refs.clearCache();
            const mockPool = mockAgent.get('http://example.com');
            mockPool
              .intercept({ path: '/common.json' })
              .reply(
                200,
                { works: { yay: true } },
                { headers: { 'Content-Type': 'application/json' } }
              );

            return mapSpec({
              spec: { a: 1, $ref: 'http://example.com/common.json#/works' },
              plugins: [plugins.refs],
              allowMetaPatches: true,
            }).then((res) => {
              expect(res.spec.$$ref).toEqual('http://example.com/common.json#/works');
            });
          });

          test('should rewrite $$ref artifacts inside external $refs', () => {
            plugins.refs.clearCache();
            const mockPool = mockAgent.get('http://example.com');
            mockPool.intercept({ path: '/common.json' }).reply(
              200,
              {
                works: {
                  one: { a: 1, $ref: '#/works/two' },
                  two: { b: 2 },
                },
              },
              { headers: { 'Content-Type': 'application/json' } }
            );

            return mapSpec({
              spec: { a: 1, $ref: 'http://example.com/common.json#/works' },
              plugins: [plugins.refs],
              allowMetaPatches: true,
            }).then((res) => {
              expect(res.spec.$$ref).toEqual('http://example.com/common.json#/works');
              expect(res.spec.one.$$ref).toEqual('http://example.com/common.json#/works/two');
            });
          });
        });

        test('should resolve external $refs', () => {
          plugins.refs.clearCache();
          const mockPool = mockAgent.get('http://example.com');
          mockPool
            .intercept({ path: '/common.json' })
            .reply(
              200,
              { works: { yay: true } },
              { headers: { 'Content-Type': 'application/json' } }
            );

          return mapSpec({
            spec: { $ref: 'http://example.com/common.json#/works' },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res.errors).toEqual([]);
            expect(res.spec).toEqual({ yay: true });
          });
        });

        test('should store the absolute path, in context', () => {
          plugins.refs.clearCache();
          const mockPool = mockAgent.get('http://example.com');
          mockPool.intercept({ path: '/common.json' }).reply(
            200,
            {
              works: {
                whoop: true,
              },
              almost: {
                $ref: '#/works',
              },
            },
            { headers: { 'Content-Type': 'application/json' } }
          );

          return mapSpec({
            context: {
              baseDoc: 'http://example.com/parent/me.json',
            },
            spec: {
              $ref: '../common.json#/almost',
            },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res.errors).toEqual([]);
            expect(res.spec).toEqual({
              whoop: true,
            });
          });
        });

        test('should use absPath for the context, not refPath', () => {
          plugins.refs.clearCache();
          const mockPool = mockAgent.get('http://example.com');
          mockPool.intercept({ path: '/models.json' }).reply(
            200,
            {
              Parent: {
                parent: true,
                child: {
                  $ref: '#/Child',
                },
              },
              Child: {
                child: true,
              },
            },
            { headers: { 'Content-Type': 'application/json' } }
          );

          return mapSpec({
            context: {
              baseDoc: 'http://example.com/base.json',
            },
            spec: {
              $ref: 'models.json#/Parent',
            },
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res.errors).toEqual([]);
            expect(res.spec).toEqual({
              parent: true,
              child: {
                child: true,
              },
            });
          });
        });

        test('should resolve a complex spec', () => {
          const spec = cloneDeep(require('./data/specs/example.json')); // eslint-disable-line global-require
          const underten = cloneDeep(require('./data/specs/example-underten.json')); // eslint-disable-line global-require
          const resolved = cloneDeep(require('./data/specs/example.resolved.json')); // eslint-disable-line global-require
          const mockPool = mockAgent.get('http://example.com');
          mockPool
            .intercept({ path: '/underten' })
            .reply(200, underten, { headers: { 'Content-Type': 'application/json' } });

          return mapSpec({
            spec,
            plugins: [plugins.refs],
          }).then((res) => {
            expect(res).toEqual({
              errors: [],
              spec: resolved,
            });
          });
        });
      });
    });

    describe('keywords in properties', () => {
      test('should ignore $ref and allOf in properties', () =>
        mapSpec({
          plugins: [plugins.refs, plugins.allOf],
          spec: {
            properties: {
              $ref: {
                type: 'string',
              },
              allOf: {
                type: 'string',
              },
            },
          },
        }).then((res) => {
          expect(res.errors.length).toEqual(0);
          expect(res.spec).toEqual({
            properties: {
              $ref: {
                type: 'string',
              },
              allOf: {
                type: 'string',
              },
            },
          });
        }));

      test('should merge sub-properties', () =>
        mapSpec({
          plugins: [plugins.refs, plugins.allOf],
          spec: {
            properties: {
              test: {
                type: 'object',
                properties: {
                  color: {
                    type: 'integer',
                  },
                },
              },
            },
          },
        }).then((res) => {
          expect(res.errors.length).toEqual(0);
          expect(res.spec).toEqual({
            properties: {
              test: {
                type: 'object',
                properties: {
                  color: {
                    type: 'integer',
                  },
                },
              },
            },
          });
        }));
    });

    describe('context', () => {
      test('should allow access to root context (options supplied to SpecMap)', (done) => {
        mapSpec({
          spec: {
            top: { middle: { leaf: 'hi' } },
          },
          context: { name: 'root' },
          plugins: [
            (patches, inst) => {
              expect(inst.getContext(['top', 'middle']).name).toEqual('root');
              done();
            },
          ],
        });
      });

      test('should set / get context for a given path', (done) => {
        mapSpec({
          spec: {},
          patches: [lib.context(['one', 'two'], { hey: 'ho' })],
          context: { hello: 'hi' },
          showDebug: true,
          plugins: [
            (patches, inst) => {
              expect(inst.getContext(['one', 'two']).hello).toEqual('hi');
              expect(inst.getContext(['one', 'two']).hey).toEqual('ho');
              done();
            },
          ],
        });
      });
    });
  });
});

function countRefs(obj) {
  return traverse(obj).reduce(function callback(acc) {
    if (this.key === '$ref') {
      return acc + 1;
    }
    return acc;
  }, 0);
}
