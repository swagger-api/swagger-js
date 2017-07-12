import isObject from 'lodash/isObject'

const toLower = str => String.prototype.toLowerCase.call(str)
const escapeString = (str) => {
  return str.replace(/[^\w]/gi, '_')
}

// Strategy for determining operationId
export function opId(operation, pathName, method = '') {
  const idWithoutWhitespace = (operation.operationId || '').replace(/\s/g, '')
  if (idWithoutWhitespace.length) {
    return escapeString(operation.operationId)
  }
  return idFromPathMethod(pathName, method)
}


// Create a generated operationId from pathName + method
export function idFromPathMethod(pathName, method) {
  return `${toLower(method)}${escapeString(pathName)}`
}

export function legacyIdFromPathMethod(pathName, method) {
  return `${toLower(method)}-${pathName}`
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

    const rawOperationId = operation.operationId // straight from the source
    const operationId = opId(operation, pathName, method)
    const legacyOperationId = legacyIdFromPathMethod(pathName, method)

    return [operationId, legacyOperationId, rawOperationId]
      .some(val => val && val === id)
  })
}

// Will stop iterating over the operations and return the operationObj
// as soon as predicate returns true
export function findOperation(spec, predicate) {
  return eachOperation(spec, predicate, true) || null
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
              o.__originalOperationId = o.__originalOperationId || o.operationId
              o.operationId = `${op}${i + 1}`
            })
          }
          else if (typeof operation.operationId !== 'undefined') {
            // Ensure we always add the normalized operation ID if one already exists
            // ( potentially different, given that we normalize our IDs)
            // ... _back_ to the spec. Otherwise, they might not line up
            const obj = map[op][0]
            obj.__originalOperationId = obj.__originalOperationId || operation.operationId
            obj.operationId = op
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

        if (inheritsList.length) {
          for (const inherits of inheritsList) {
            for (const inheritName in inherits) {
              if (!operation[inheritName]) {
                operation[inheritName] = inherits[inheritName]
              }
              else if (inheritName === 'parameters') {
                for (const param of inherits[inheritName]) {
                  const exists = operation[inheritName].some((opParam) => {
                    return opParam.name === param.name
                  })

                  if (!exists) {
                    operation[inheritName].push(param)
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
