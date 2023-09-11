import path from 'node:path';
import { globSync } from 'glob';

import mapSpec, { plugins } from '../../src/specmap/index.js';

const { refs } = plugins;
const { allOf } = plugins;

describe('complex', () => {
  beforeEach(() => {
    refs.clearCache();
  });

  test('should resolve complex specs', () => {
    jest.setTimeout(100000);

    const dir = path.join(__dirname, 'data', 'complex');
    const specFiles = globSync(`${dir}/**/*.json`);
    const specs = specFiles
      .sort((f1, f2) => {
        const no1 = Number(path.basename(f1).split('.')[0]);
        const no2 = Number(path.basename(f2).split('.')[0]);
        return no1 - no2;
      })
      .map((filename) => ({ name: path.basename(filename), spec: require(filename) }));

    // Runs test serially, just more convenient for debugging if a spec fails
    return new Promise((resolve, reject) => {
      function runNextTestCase(idx) {
        if (idx === specs.length) {
          return resolve();
        }

        const spec = specs[idx];
        const startTime = new Date();
        console.log('Run', spec.name); // eslint-disable-line no-console

        return mapSpec({ spec: spec.spec, plugins: [refs, allOf] })
          .then((res) => {
            if (res.errors.length) throw res.errors[0];
            expect(res.errors.length).toEqual(0);
            const elapsed = new Date() - startTime;
            console.log('  elapsed', elapsed, 'ms'); // eslint-disable-line no-console
          })
          .then(() => runNextTestCase(idx + 1))
          .catch(reject);
      }

      runNextTestCase(0);
    });
  });
});
