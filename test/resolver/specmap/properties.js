import mapSpec, { plugins } from '../../../src/resolver/specmap/index.js';

describe('properties', () => {
  test('should add default value to each property', () => {
    const modelPropertyMacro = () => 'test';

    return mapSpec({
      spec: {
        properties: {
          one: {},
          two: {},
        },
      },
      plugins: [plugins.properties],
      modelPropertyMacro,
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          properties: {
            one: {
              default: 'test',
            },
            two: {
              default: 'test',
            },
          },
        },
      });
    });
  });

  test('should add default value to each property taking to account first parameter (property) passed in modelPropertyMacro', () => {
    const modelPropertyMacro = (prop) => prop.test;

    return mapSpec({
      spec: {
        properties: {
          one: {
            test: 1,
          },
          two: {
            test: 2,
          },
        },
      },
      plugins: [plugins.properties],
      modelPropertyMacro,
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          properties: {
            one: {
              default: 1,
              test: 1,
            },
            two: {
              default: 2,
              test: 2,
            },
          },
        },
      });
    });
  });
});
