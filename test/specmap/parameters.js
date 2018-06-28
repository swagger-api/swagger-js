import xmock from 'xmock'
import mapSpec, {plugins} from '../../src/specmap'

describe('parameters', () => {
  afterEach(() => {
    xmock().restore()
  })

  test('should add default value to parameter', () => {
    const parameterMacro = function (operation, parameter) {
      return 'test'
    }

    return mapSpec({
      spec: {
        parameters: [
          {one: 1},
          {two: 2}
        ]
      },
      plugins: [plugins.parameters],
      parameterMacro
    }).then((res) => {
      expect(res).toEqual({
        errors: [],
        spec: {
          parameters: [
            {
              one: 1,
              default: 'test'
            },
            {
              two: 2,
              default: 'test'
            }
          ]
        }
      })
    })
  })

  test(
    'should add default value to parameter taking to account first parameter (operation) passed in parameterMacro',
    () => {
      const parameterMacro = function (operation, parameter) {
        return operation.test
      }

      return mapSpec({
        spec: {
          test: {
            test: 'pet',
            parameters: [
                {one: 1},
                {two: 2}
            ]
          }
        },
        plugins: [plugins.parameters],
        parameterMacro
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: {
            test: {
              test: 'pet',
              parameters: [
                {
                  one: 1,
                  default: 'pet'
                },
                {
                  two: 2,
                  default: 'pet'
                }
              ]
            }
          }
        })
      })
    }
  )

  test(
    'should add default value to parameter taking to account second parameter (parameter itself) passed in parameterMacro',
    () => {
      const parameterMacro = function (operation, parameter) {
        return parameter.test
      }

      return mapSpec({
        spec: {
          parameters: [
              {test: 1},
              {test: 2}
          ]
        },
        plugins: [plugins.parameters],
        parameterMacro
      }).then((res) => {
        expect(res).toEqual({
          errors: [],
          spec: {
            parameters: [
              {
                test: 1,
                default: 1
              },
              {
                test: 2,
                default: 2
              }
            ]
          }
        })
      })
    }
  )
})
