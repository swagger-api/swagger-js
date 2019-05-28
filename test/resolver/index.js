// Test runner
//

import YAML from '@kyleshockey/js-yaml'
import fs from 'fs'
import Path from 'path'
import expect from 'expect'
import nock from "nock"

import Swagger from '../../src/index'

const testDocuments = fs
  .readdirSync(Path.join(__dirname))
  .filter(path => path.endsWith('yaml'))
  .map(path => ({
    path: `${path}`,
    contentString: fs.readFileSync(`${__dirname}/${path}`, 'utf8'),
  }))
  .map(doc => ({
    path: doc.path,
    content: YAML.safeLoad(doc.contentString)
  }))


testDocuments.forEach((doc) => {
  const {path, content} = doc
  const {meta = {}, cases = []} = content

  const rootDescribe = meta.skip ? describe.skip : describe

  rootDescribe(`declarative resolver case suite - ${meta.title || path}`, function () {
    if (cases && cases.length) {
      return cases.forEach((currentCase) => {
        beforeEach(() => {
          nock.disableNetConnect()

          const nockScope = nock(`http://mock.swagger.dev`)

          if (currentCase.documents) {
            Object.keys(currentCase.documents).forEach((key) => {
              const docContent = currentCase.documents[key]
              nockScope
                .get(`/${key}`)
                .reply(200, docContent, {
                  'Content-Type': 'application/yaml'
                })
            })
          }
        })

        if (currentCase.name) {
          describe(currentCase.name || '', function () {
            return assertCaseExpectations(currentCase, async () => getValueForAction(currentCase.action))
          })
        }
        else {
          // else, just do the assertions under the root describe block
          return assertCaseExpectations(currentCase, async () => getValueForAction(currentCase.action))
        }

        afterEach(() => {
          nock.cleanAll()
          nock.enableNetConnect()
        })
      })
    }
  })
})

async function getValueForAction(action) {
  switch (action.type) {
    case 'resolve':
      const client = await Swagger(action.config)
      return client.spec
    default:
      throw new Error('case did not specify a valid action type')
  }
}

async function assertCaseExpectations(currentCase, resultGetter) {
  currentCase.assertions.forEach((assertion) => {
    const itFn = assertion.skip ? it.skip : it
    // if (assertion.output.match !== undefined) {
    //   itFn('should match expected error output', function () {
    //     expect(result).toMatch(assertion.output.match)
    //   })
    // }

    // if (assertion.output.length !== undefined) {
    //   itFn('should have expected array length', function () {
    //     expect(result).toBeAn(Array)
    //     expect(result.length).toBe(assertion.output.length)
    //   })
    // }

    if (assertion.equal !== undefined) {
      itFn('should equal expected value', async function () {
        expect(await resultGetter()).toEqual(assertion.equal)
      })
    }
  })

}
