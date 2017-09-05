import fs from 'fs'
import path from 'path'
import clone from 'clone'
import glob from 'glob'
import expect from 'expect'
import xmock from 'xmock'
import mapSpec, {plugins} from '../../src/specmap'

const refs = plugins.refs

describe('refs', function () {
  let xapp

  before(() => {
    xapp = xmock()
  })

  after(() => {
    xapp.restore()
  })

  beforeEach(() => {
    refs.clearCache()
  })

  describe('JSONRefError', function () {
    it('should contain the ref error details', function () {
      try {
        throw new refs.JSONRefError('Failed to download ref', {
          $ref: '#/one',
          basePath: 'localhost/one.json'
        })
      }
      catch (e) {
        expect(e.toString()).toEqual('JSONRefError: Failed to download ref')
        expect(e.$ref).toEqual('#/one')
        expect(e.basePath).toEqual('localhost/one.json')
      }
    })

    it('.wrapError should wrap an error in JSONRefError', function () {
      try {
        throw refs.wrapError(new Error('hi'), {$ref: '#/one', basePath: 'localhost'})
      }
      catch (e) {
        expect(e.message).toMatch(/reference/)
        expect(e.message).toMatch(/hi/)
        expect(e.$ref).toEqual('#/one')
        expect(e.basePath).toEqual('localhost')
      }
    })
  })

  describe('absoluteify', function () {
    it('should find the absolute path for a url', function () {
      const res = refs.absoluteify('/one', 'http://example.com')
      expect(res).toEqual('http://example.com/one')
    })

    describe('relative paths', function () {
      it('should think of the basePath as pointing to a document, so use the parent folder for resolution', function () {
        const res = refs.absoluteify('one.json', 'http://example.com/two.json')
        expect(res).toEqual('http://example.com/one.json')
      })

      it('should handle ../', function () {
        const res = refs.absoluteify('../one.json', 'http://example.com/two/three/four.json')
        expect(res).toEqual('http://example.com/two/one.json')
      })
    })
  })

  describe('.extract', function () {
    it('should extract a JSON-Pointer', function () {
      const subject = refs.extract('/one', {one: 1})
      expect(subject).toEqual(1)
    })

    it('should extract "" as the root obj', function () {
      const subject = refs.extract('', {one: 1})
      expect(subject).toEqual({one: 1})
    })

    it('should fail nicely', function () {
      expect(() => {
        refs.extract('/not/here', {one: 1})
      }).toThrow()
    })
  })

  describe('getDoc', function (done) {
    it('should fetch documents', function () {
      const url = 'http://example.com/common.json'

      xapp.get(url, (req, res, next) => {
        res.send({works: {yay: true}})
      })

      return refs.getDoc(url).then((doc) => {
        expect(doc).toEqual({works: {yay: true}})
      })
    })

    it('should parse YAML docs into JSON', function () {
      const url = 'http://example.com/common.yaml'

      xapp.get(url, (req, res, next) => {
        res.set('Content-Type', 'application/yaml')
        res.send('works:\n  yay: true')
      })

      return refs.getDoc(url).then((doc) => {
        expect(doc).toEqual({works: {yay: true}})
      })
    })

    it('should cache requests', function () {
      const url = 'http://example.com/common.json'

      xapp.get(url, (req, res, next) => {
        res.send({works: {yay: true}})
      })

      return refs.getDoc(url).then((doc) => {
        expect(doc).toEqual({works: {yay: true}})
      }).then(() => {
        expect(refs.docCache).toEqual({
          [url]: {works: {yay: true}}
        })

        // Change cache to verify we're using it
        refs.docCache[url].works.yay = false

        return refs.getDoc(url).then((doc) => {
          expect(doc).toEqual({works: {yay: false}})
        })
      })
    })

    it('should cache pending HTTP requests', function () {
      const url = 'http://example.com/common.json'
      xapp.get(url, () => {})

      const p1 = refs.getDoc(url)
      const p2 = refs.getDoc(url)
      const p3 = refs.docCache[url]

      expect(p1).toBe(p2).toBe(p3)
    })
  })

  describe('.extractFromDoc', function () {
    it('should extract a value from within a doc', function () {
      refs.docCache['some-path'] = {
        one: '1'
      }
      return refs.extractFromDoc('some-path', '/one')
        .then((val) => {
          expect(val).toEqual('1')
        })
    })

    it('should fail nicely', function () {
      refs.docCache['some-path'] = {
        one: '1'
      }

      return refs.extractFromDoc('some-path', '/two', '#/two')
        .then((val) => {
          throw new Error('Should have failed')
        })
        .catch((e) => {
          expect(e.pointer).toEqual('/two')
          expect(e.basePath).toNotExist()
        })
    })
  })

  describe('.absoluteify', function () {
    it('should return the absolute URL', function () {
      const res = refs.absoluteify('../', '/one/two/three.json')
      expect(res).toEqual('/one/')
    })

    it('should throw if there is no basePath, and we try to resolve a realtive url', function () {
      expect(() => {
        refs.absoluteify('../')
      }).toThrow()
    })

    it('should return the absolute URL, with a different asset', function () {
      const res = refs.absoluteify('not-three.json', '/one/two/three.json')
      expect(res).toEqual('/one/two/not-three.json')
    })
  })

  describe('.clearCache', function () {
    it('should clear the docCache', function () {
      const url = 'http://example.com/common.json'

      xapp.get(url, (req, res, next) => {
        res.send({works: {yay: true}})
      })

      return refs.getDoc(url).then((doc) => {
        expect(doc).toEqual({works: {yay: true}})
      }).then(() => {
        expect(refs.docCache).toEqual({
          [url]: {works: {yay: true}}
        })
        refs.clearCache()
        expect(refs.docCache).toEqual({})
      })
    })

    it('should clear the docCache, of particular items', function () {
      const url = 'http://example.com/common.json'
      const url2 = 'http://example.com/common2.json'

      xapp
        .get(url, (req, res, next) => {
          res.send({works: {yay: true}})
        })
        .get(url2, (req, res, next) => {
          res.send({works: {yup: true}})
        })

      return refs.getDoc(url).then((doc) => {
        expect(doc).toEqual({works: {yay: true}})
      }).then(() => {
        expect(refs.docCache).toEqual({
          [url]: {works: {yay: true}}
        })

        return refs.getDoc(url2).then((doc) => {
          expect(doc).toEqual({works: {yup: true}})
        }).then(() => {
          expect(refs.docCache).toEqual({
            [url]: {works: {yay: true}},
            [url2]: {works: {yup: true}}
          })

          refs.clearCache(url)

          expect(refs.docCache).toEqual({
            [url2]: {
              works: {yup: true}
            }
          })
        })
      })
    })
  })

  describe('.jsonPointerToArray', function () {
    it('should parse a JSON-Pointer into an array of tokens', function () {
      const subject = refs.jsonPointerToArray('/one/two/~1three')
      expect(subject).toEqual(['one', 'two', '/three'])
    })

    it('should parse if JSON-Pointer does not start with forward dash', function () {
      const subject = refs.jsonPointerToArray('one/two/~1three')
      expect(subject).toEqual(['one', 'two', '/three'])
    })

    it('should return [""] for "" and "/"', function () {
      let subject = refs.jsonPointerToArray('')
      expect(subject).toEqual([])
      subject = refs.jsonPointerToArray('/')
      expect(subject).toEqual([])
    })
  })

  describe('.unescapeJsonPointerToken', function () {
    it('should parse ~0 and ~1 in the correct order', function () {
      expect(refs.unescapeJsonPointerToken('~01 ~1 ~0 ~10')).toEqual('~1 / ~ /0')
    })

    it('should handle non-strings', function () {
      expect(refs.unescapeJsonPointerToken(1)).toEqual(1)
    })
  })

  describe('handle cyclic references', function () {
    it('should resolve references as deeply as possible', function () {
      const dir = path.join(__dirname, 'data', 'cyclic')
      const caseFiles = glob.sync(`${dir}/**/*.js`)
      const cases = caseFiles
        .sort((f1, f2) => {
          // Sorts by group ('internal', 'external') before test case number
          const group1 = f1.substring(dir.length).split(path.sep)[1]
          const group2 = f2.substring(dir.length).split(path.sep)[1]
          const no1 = Number(path.basename(f1).split('.')[0])
          const no2 = Number(path.basename(f2).split('.')[0])
          return group1.localeCompare(group2) || (no1 - no2)
        })
        .map((filename) => {
          return Object.assign({name: filename, filename}, require(filename))
        })
        .filter((testCase) => {
          return !testCase.ignore
        })

      // Runs test serially, just more convenient for debugging if a spec fails
      return new Promise((resolve, reject) => {
        function runNextTestCase(idx) {
          if (idx === cases.length) {
            return resolve()
          }

          const testCase = cases[idx]
          const spec = testCase.spec
          const output = testCase.output || clone(spec)
          const external = testCase.external || {}

          Object.keys(external).forEach((url) => {
            xapp.get(url, () => external[url])
          })

          return mapSpec({spec, plugins: [refs]})
            .then((res) => {
              expect(res.spec).toEqual(output)
            })
            .then(function () {
              runNextTestCase(idx + 1)
            })
            .catch(reject)
        }

        runNextTestCase(0)
      })
    })

    it('should handle this weird case', function () {
      return mapSpec({
        spec: {
          one: {one: 1},
          onelike: {$ref: '#/one'}, // Start with `one` and is a sibling of `/one`
        },
        plugins: [refs],
      }).then((res) => {
        expect(res.spec).toEqual({
          one: {one: 1},
          onelike: {one: 1},
        })
      })
    })

    it('should not stop if one $ref has error', function () {
      return mapSpec({
        spec: {
          valid: {data: 1},
          two: {$ref: 'invalid'},
          three: {$ref: '#/valid'}
        },
        plugins: [refs],
      }).then((res) => {
        expect(res.spec).toEqual({
          valid: {data: 1},
          two: {$ref: 'invalid'},
          three: {data: 1}
        })
      })
    })

    it('should include fullPath in invalid $ref type', function () {
      return mapSpec({
        spec: {one: {$ref: 1}},
        plugins: [refs],
      }).then((res) => {
        expect(res.errors[0].fullPath).toEqual(['one', '$ref'])
      })
    })

    it('should be able to overwrite fetchJSON', function () {
      // This is to allow downstream projects, use some proxy
      // ( or otherwise mutate the request )
      // THIS ISN'T IDEAL, need to find a better way of overwriting fetchJSON
      const spy = expect.createSpy()
      const oriFunc = plugins.refs.fetchJSON
      plugins.refs.fetchJSON = spy.andReturn(Promise.resolve(null))

      // When
      plugins.refs.getDoc('hello')

      // Then
      expect(spy.calls.length).toEqual(1)
      expect(spy.calls[0].arguments).toEqual(['hello'])

      plugins.refs.fetchJSON = oriFunc
    })
  })

  describe('deeply resolved', function () {
    it('should resolve deeply nested $refs, across documents', function () {
      xmock().get('http://example.com/doc-a', function (req, res, next) {
        xmock().restore()
        return res.send({
          two: {
            $ref: '#/three',
          },
          three: {
            $ref: '#/four',
          },
          four: {
            four: 4,
          }
        })
      })

      return mapSpec({
        plugins: [plugins.refs],
        spec: {
          $ref: 'http://example.com/doc-a#two'
        }
      }).then((res) => {
        expect(res.spec).toEqual({
          four: 4
        })
      })
    })
  })
})
