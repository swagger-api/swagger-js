import expect from 'expect'
import xmock from 'xmock'
import mapSpec, {plugins} from '../../src/specmap'

describe('properties', function () {
  afterEach(() => {
    xmock().restore()
  })

  it('should add default value to each property', function () {
    const modelPropertyMacro = function (model) {
      return 'test'
    }

    return mapSpec({
      spec: {
        properties: {
          one: {},
          two: {}
        }
      },
      plugins: [plugins.properties],
      modelPropertyMacro
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          properties: {
            one: {
              default: 'test'
            },
            two: {
              default: 'test'
            }
          }
        }
      })
    })
  })

  it('should add default value to each property taking to account first parameter (property) passed in modelPropertyMacro', function () {
    const modelPropertyMacro = function (prop) {
      return prop.test
    }

    return mapSpec({
      spec: {
        properties: {
          one: {
            test: 1
          },
          two: {
            test: 2
          }
        }
      },
      plugins: [plugins.properties],
      modelPropertyMacro
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          properties: {
            one: {
              default: 1,
              test: 1
            },
            two: {
              default: 2,
              test: 2
            }
          }
        }
      })
    })
  })
})
