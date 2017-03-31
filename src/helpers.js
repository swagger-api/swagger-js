import isObject from 'lodash/isObject'

const toLower = str => String.prototype.toLowerCase.call(str)

// Strategy for determining operationId
export function opId(operation, pathName, method = '') {
  return operation.operationId
    ? operation.operationId : idFromPathMethod(pathName, method)
}


// Create a generated operationId from pathName + method
export function idFromPathMethod(pathName, method) {
  return `${toLower(method)}-${pathName}`
}

// Extract pathName + method from generated operationId
export function pathMethodFromId(id) {
  const [, method, pathName] = /^([^-]*)-(.*)$/.exec(id)
  return [pathName, method]
}

// Get the operation, based on operationId ( just return the object, no inheritence )
export function getOperationRaw(spec, id) {
  if (!spec || !spec.paths) {
    return null
  }

  return findOperation(spec, ({pathName, method, operation}) => {
    if (!operation || typeof operation !== 'object') {
      return false
    }

    const {operationId} = operation

    if (operationId && operationId === id) {
      return true
    }

    const [_pathName, _method] = pathMethodFromId(id)
    return _pathName === pathName && toLower(_method) === toLower(method)
  })
}

// Will stop iterating over the operations and return the operationObj
// as soon as predicate returns true
export function findOperation(spec, predicate) {
  return eachOperation(spec, predicate, true)
}

// iterate over each operation, and fire a callback with details
// `find=true` will stop iterating, when the cb returns truthy
export function eachOperation(spec, cb, find) {
  if (!spec || typeof spec !== 'object' || !spec.paths || typeof spec.paths !== 'object') {
    return null
  }

  const {paths} = spec

  // Iterate over the spec, collecting operations
  for (const pathName in paths) {
    for (const method in paths[pathName]) {
      if (method.toUpperCase() === 'PARAMETERS') { 
        continue
      }
      const operation = paths[pathName][method]
      if (!operation || typeof operation !== 'object') {
        continue
      }

      const operationObj = {
        spec,
        pathName,
        method: method.toUpperCase(),
        operation
      }
      const cbValue = cb(operationObj)

      if (find && cbValue) {
        return operationObj
      }
    }
  }
}

export function normalizeSwagger(parsedSpec) {
  const {spec} = parsedSpec
  const {paths} = spec
  const map = {}

  if (!paths) {
    return parsedSpec
  }

  for (const pathName in paths) {
    const path = paths[pathName]

    if (!isObject(path)) {
      continue
    }

    const pathParameters = path.parameters

    for (const method in path) {
      const operation = path[method]
      if (!isObject(operation)) {
        continue
      }

      const oid = opId(operation, pathName, method)

      if (oid) {
        if (map[oid]) {
          map[oid].push(operation)
        }
        else {
          map[oid] = [operation]
        }

        Object.keys(map).forEach((op) => {
          if (map[op].length > 1) {
            map[op].forEach((o, i) => {
              o.operationId = `${op}_${i}`
            })
          }
        })
      }

      if (method !== 'parameters') {
        // Add inherited consumes, produces, parameters, securities
        const inheritsList = []
        const toBeInherit = {}

        // Global-levels
        for (const key in spec) {
          if (key === 'produces' || key === 'consumes' || key === 'security') {
            toBeInherit[key] = spec[key]
            inheritsList.push(toBeInherit)
          }
        }

        // Path-levels
        if (pathParameters) {
          toBeInherit.parameters = pathParameters
          inheritsList.push(toBeInherit)
        }

        if (inheritsList.length !== 0) {
          for (const inherits of inheritsList) {
            // Add inheritsList only if aperation does not already have any consumes
            // produces or securities
            for (const inhName in inherits) {
              if (!operation[inhName]) {
                operation[inhName] = inherits[inhName]
              }
              else if(inhName === "parameters") {
                var exists = false
                for(const item in inherits[inhName]) {

                  for(const param in operation[inhName]) {
                    if(operation[inhName][param].name === inherits[inhName][item].name) {
                      exists = true
                    }
                  }

                  if(!exists) {
                    operation[inhName].push(inherits[inhName][item])
                  }
                }
              }
            }
          }
        }

      }
    }
  }

  return parsedSpec
}
