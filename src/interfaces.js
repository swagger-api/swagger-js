import pick from 'lodash/pick'
import {eachOperation, opId} from './helpers'

const nullFn = () => null

const normalizeArray = (arg) => {
  return Array.isArray(arg) ? arg : [arg]
}

// To allow stubbing of functions
export const self = {
  mapTagOperations,
  makeExecute
}

// Make an execute, bound to arguments defined in mapTagOperation's callback (cb)
export function makeExecute(swaggerJs = {}) {
  return ({pathName, method, operationId}) => (parameters, opts = {}) => {
    return swaggerJs.execute({
      spec: swaggerJs.spec,
      ...pick(swaggerJs, 'requestInterceptor', 'responseInterceptor'),
      pathName,
      method,
      parameters,
      operationId,
      ...opts
    })
  }
}

// Creates an interface with tags+operations = execute
// The shape
// { apis: { [tag]: { operations: [operation]: { execute }}}}
// NOTE: this is mostly for compatibility
export function makeApisTagOperationsOperationExecute(swaggerJs = {}) {
  // { apis: tag: operations: execute }
  const cb = self.makeExecute(swaggerJs)
  const tagOperations = self.mapTagOperations({spec: swaggerJs.spec, cb})

  const apis = {}
  for (const tag in tagOperations) {
    apis[tag] = {
      operations: {}
    }
    for (const op in tagOperations[tag]) {
      apis[tag].operations[op] = {execute: tagOperations[tag][op]}
    }
  }

  return {apis}
}

// .apis[tag][operationId]:ExecuteFunction interface
export function makeApisTagOperation(swaggerJs = {}) {
  const cb = self.makeExecute(swaggerJs)
  return {
    apis: self.mapTagOperations({spec: swaggerJs.spec, cb})
  }
}

/**
 * Iterates over a spec, creating a hash of {[tag]: { [operationId], ... }, ...}
 * with the value of calling `cb`.
 *
 * `spec` is a OAI v2.0 compliant specification object
 * `cb` is called with ({ spec, operation, path, method })
 * `defaultTag` will house all non-tagged operations
 *
 */
export function mapTagOperations({spec, cb = nullFn, defaultTag = 'default'}) {
  const operationIdCounter = {}
  const tagOperations = {} // Will house all tags + operations
  eachOperation(spec, ({pathName, method, operation}) => {
    const tags = operation.tags ? normalizeArray(operation.tags) : [defaultTag]

    tags.forEach((tag) => {
      if (typeof tag !== 'string') {
        return
      }
      const tagObj = tagOperations[tag] = tagOperations[tag] || {}
      const id = opId(operation, pathName, method)
      const cbResult = cb({spec, pathName, method, operation, operationId: id})

      if (operationIdCounter[id]) {
        operationIdCounter[id]++
        tagObj[`${id}${operationIdCounter[id]}`] = cbResult
      }
      else if (typeof tagObj[id] !== 'undefined') {
        // Bump counter ( for this operationId )
        const originalCounterValue = (operationIdCounter[id] || 1)
        operationIdCounter[id] = originalCounterValue + 1
        // Append _x to the operationId
        tagObj[`${id}${operationIdCounter[id]}`] = cbResult

        // Rename the first operationId
        const temp = tagObj[id]
        delete tagObj[id]
        tagObj[`${id}${originalCounterValue}`] = temp
      }
      else {
        // Assign callback result ( usually a bound function )
        tagObj[id] = cbResult
      }
    })
  })

  return tagOperations
}
