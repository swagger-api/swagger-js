// Test runner
//

import YAML from 'js-yaml';
import fs from 'fs';
import Path from 'path';
import nock from 'nock';

import Swagger from '../../src/index';

const testDocuments = fs
  .readdirSync(Path.join(__dirname))
  .filter((path) => path.endsWith('yaml'))
  .map((path) => ({
    path: `${path}`,
    contentString: fs.readFileSync(`${__dirname}/${path}`, 'utf8'),
  }))
  .map((doc) => ({
    path: doc.path,
    content: YAML.load(doc.contentString),
  }));

testDocuments.forEach((doc) => {
  const { path, content } = doc;
  const { meta = {}, cases = [] } = content;

  let rootDescribe;

  if (meta.skip) rootDescribe = describe.skip;
  else if (meta.only) rootDescribe = describe.only;
  else rootDescribe = describe;

  rootDescribe(`declarative resolver test suite - ${meta.title || path}`, () => {
    if (cases && cases.length) {
      return cases.forEach((currentCase) => {
        describe(currentCase.name || '', () => {
          beforeAll(() => {
            Swagger.clearCache();

            if (!nock.isActive()) {
              nock.activate();
            }

            nock.cleanAll();
            nock.disableNetConnect();

            const nockScope = nock('http://mock.swagger.test');

            if (currentCase.remoteDocuments) {
              Object.keys(currentCase.remoteDocuments).forEach((key) => {
                const docContent = currentCase.remoteDocuments[key];
                nockScope.get(`/${key}`).reply(200, docContent, {
                  'Content-Type': 'application/yaml',
                });
              });
            }
          });

          afterAll(nock.restore);

          assertCaseExpectations(currentCase, async () => getValueForAction(currentCase.action));
        });
      });
    }

    return undefined;
  });
});

async function getValueForAction(action) {
  switch (action.type) {
    case 'instantiateResolve': {
      const client = await Swagger(action.config);
      return {
        spec: client.spec,
        errors: client.errors,
      };
    }
    case 'resolveSubtree': {
      return Swagger.resolveSubtree(action.config.obj, action.config.path, action.config.opts);
    }
    default:
      throw new Error('case did not specify a valid action type');
  }
}

async function assertCaseExpectations(currentCase, resultGetter) {
  currentCase.assertions.forEach((assertion) => {
    let itFn;

    if (assertion.skip) itFn = it.skip;
    else if (assertion.only) itFn = it.only;
    else itFn = it;

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
      itFn('should equal expected value', async () => {
        expect(await resultGetter()).toEqual(assertion.equal);
      });
    }
  });
}
