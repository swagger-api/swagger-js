import path from 'node:path';
/* eslint-disable camelcase */
import { toValue, StringElement } from '@swagger-api/apidom-core';
import { OpenApi3_1Element } from '@swagger-api/apidom-ns-openapi-3-1';

import normalize, {
  pojoAdapter,
} from '../../../../../src/resolver/strategies/openapi-3-1-apidom/normalize.js';

const fixturesPath = path.join(__dirname, '__fixtures__');

/**
 * This test suite only guarantees that normalization works for OpenAPI 3.1.0.
 * Complete coverage of all use-cases including corner-cases are covered
 * upstream in ApiDOM.
 */

describe('helpers', () => {
  describe('normalize', () => {
    describe('OpenAPI 3.1', () => {
      describe('given denormalized Header Object examples', () => {
        test('should normalize', () => {
          const spec = globalThis.loadJsonFile(path.join(fixturesPath, 'header-examples.json'));
          const openApiElement = OpenApi3_1Element.refract(spec);
          const normalized = normalize(openApiElement);

          expect(toValue(normalized)).toMatchSnapshot();
        });
      });

      describe('given denormalized Parameter Object examples', () => {
        test('should normalize', () => {
          const spec = globalThis.loadJsonFile(path.join(fixturesPath, 'parameter-examples.json'));
          const openApiElement = OpenApi3_1Element.refract(spec);
          const normalized = normalize(openApiElement);

          expect(toValue(normalized)).toMatchSnapshot();
        });
      });

      describe('given denormalized Operation.id fields', () => {
        test('should normalize', () => {
          const spec = globalThis.loadJsonFile(path.join(fixturesPath, 'operation-ids.json'));
          const openApiElement = OpenApi3_1Element.refract(spec);
          const normalized = normalize(openApiElement);

          expect(toValue(normalized)).toMatchSnapshot();
        });
      });

      describe('given denormalized Parameter Objects', () => {
        test('should normalize', () => {
          const spec = globalThis.loadJsonFile(path.join(fixturesPath, 'parameters.json'));
          const openApiElement = OpenApi3_1Element.refract(spec);
          const normalized = normalize(openApiElement);

          expect(toValue(normalized)).toMatchSnapshot();
        });
      });

      describe('given denormalized Security Requirements Objects', () => {
        test('should normalize', () => {
          const spec = globalThis.loadJsonFile(
            path.join(fixturesPath, 'security-requirements.json')
          );
          const openApiElement = OpenApi3_1Element.refract(spec);
          const normalized = normalize(openApiElement);

          expect(toValue(normalized)).toMatchSnapshot();
        });
      });

      describe('given denormalized Servers Objects', () => {
        test('should normalize', () => {
          const spec = globalThis.loadJsonFile(path.join(fixturesPath, 'servers.json'));
          const openApiElement = OpenApi3_1Element.refract(spec);
          const normalized = normalize(openApiElement);

          expect(toValue(normalized)).toMatchSnapshot();
        });
      });

      describe('given element non compatible with ObjectElement', () => {
        test('should skip normalization', () => {
          const element = new StringElement('test');
          const normalized = normalize(element);

          expect(normalized).toEqual(element);
        });
      });

      describe('given spec is already normalized', () => {
        test('should skip normalization', () => {
          const spec = globalThis.loadJsonFile(path.join(fixturesPath, 'servers.json'));
          const openApiElement = OpenApi3_1Element.refract(spec);
          const normalized = normalize(openApiElement);
          const doubleNormalized = normalize(openApiElement);

          expect(normalized).toEqual(doubleNormalized);
        });
      });
    });
  });

  describe('pojoAdapter', () => {
    test('should returned cached normalized POJO', () => {
      const spec = globalThis.loadJsonFile(path.join(fixturesPath, 'parameters.json'));
      const openApiElement = OpenApi3_1Element.refract(spec);
      const normalized1 = pojoAdapter(normalize)(openApiElement);
      const normalized2 = toValue(pojoAdapter(normalize)(openApiElement));

      expect(normalized1).toEqual(normalized2);
    });
  });
});
/* eslint-enable camelcase */
