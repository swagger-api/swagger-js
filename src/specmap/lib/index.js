import jsonPatch from 'fast-json-patch'
import regenerator from 'babel-runtime/regenerator'
import deepExtend from 'deep-extend'

export default {
  add,
  replace,
  remove,
  merge,
  mergeDeep,
  context,
  getIn,
  applyPatch,
  parentPathMatch,
  flatten,
  fullyNormalizeArray,
  normalizeArray,
  isPromise,
  forEachNew,
  forEachNewPrimitive,
  isJsonPatch,
  isContextPatch,
  isPatch,
  isMutation,
  isAdditiveMutation,
  isGenerator,
  isFunction,
  isObject,
  isError
}

function applyPatch(obj, patch, opts) {
  console.log('applyPatch', obj)
  opts = opts || {}

  patch = Object.assign({}, patch, {
    path: patch.path && normalizeJSONPath(patch.path)
  })

  if (patch.op === 'merge') {
    const newValue = getInByJsonPath(obj, patch.path)
    Object.assign(newValue, patch.value)
    jsonPatch.applyPatch(obj, [replace(patch.path, newValue)])
  }
  else if (patch.op === 'mergeDeep') {
    const currentValue = getInByJsonPath(obj, patch.path)

    // Iterate the properties of the patch
    for (const prop in patch.value) {
      const propVal = patch.value[prop]
      const isArray = Array.isArray(propVal)
      if (isArray) {
        // deepExtend doesn't merge arrays, so we will do it manually
        const existing = currentValue[prop] || []
        currentValue[prop] = existing.concat(propVal)
      }
      else if (isObject(propVal) && !isArray) {
        // If it's an object, iterate it's keys and merge
        // if there are conflicting keys, merge deep, otherwise shallow merge
        const existing = currentValue[prop] || {}
        for (const key in propVal) {
          if (Object.prototype.hasOwnProperty.call(existing, key)) {
            // if there is a single conflicting key, just deepExtend the entire value
            // and break from the loop (since all future keys are also merged)
            // We do this because we can't deepExtend two primitives
            // (existing[key] & propVal[key] may be primitives)
            deepExtend(existing, propVal)
            break
          }
          else {
            Object.assign(existing, {[key]: propVal[key]})
          }
        }
        currentValue[prop] = existing
      }
      else {
        // It's a primitive, just replace existing
        currentValue[prop] = propVal
      }
    }
  }
  else if (patch.op === 'add' && patch.path === '' && isObject(patch.value)) {
    // { op: 'add', path: '', value: { a: 1, b: 2 }}
    // has no effect: json patch refuses to do anything.
    // so let's break that patch down into a set of patches,
    // one for each key in the intended root value.

    const patches = Object.keys(patch.value)
      .reduce((arr, key) => {
        arr.push({
          op: 'add',
          path: `/${normalizeJSONPath(key)}`,
          value: patch.value[key]
        })
        return arr
      }, [])

    jsonPatch.applyPatch(obj, patches)
  }
  else if (patch.op === 'replace' && patch.path === '') {
    let value = patch.value

    if (opts.allowMetaPatches && patch.meta && isAdditiveMutation(patch) &&
        (Array.isArray(patch.value) || isObject(patch.value))) {
      value = Object.assign({}, value, patch.meta)
    }
    obj = value
  }
  else {
    jsonPatch.applyPatch(obj, [patch])

    // Attach metadata to the resulting value.
    if (opts.allowMetaPatches && patch.meta && isAdditiveMutation(patch) &&
        (Array.isArray(patch.value) || isObject(patch.value))) {
      const currentValue = getInByJsonPath(obj, patch.path)
      const newValue = Object.assign({}, currentValue, patch.meta)
      jsonPatch.applyPatch(obj, [replace(patch.path, newValue)])
    }
  }

  return obj
}

function normalizeJSONPath(path) {
  if (Array.isArray(path)) {
    if (path.length < 1) {
      return ''
    }

    return '/' + path.map((item) => { // eslint-disable-line prefer-template
      return (item + '').replace(/~/g, '~0').replace(/\//g, '~1') // eslint-disable-line prefer-template
    }).join('/')
  }

  return path
}


// =========================
// JSON-Patch Wrappers
// =========================

function add(path, value) {
  return {op: 'add', path, value}
}

function _get(path) {
  return {op: '_get', path}
}

function replace(path, value, meta) {
  return {op: 'replace', path, value, meta}
}

function remove(path, value) {
  return {op: 'remove', path}
}

// Custom wrappers
function merge(path, value) {
  return {type: 'mutation', op: 'merge', path, value}
}

// Custom wrappers
function mergeDeep(path, value) {
  return {type: 'mutation', op: 'mergeDeep', path, value}
}

function context(path, value) {
  return {type: 'context', path, value}
}


// =========================
// Iterators
// =========================

function forEachNew(mutations, fn) {
  try {
    return forEachNewPatch(mutations, forEach, fn)
  }
  catch (e) {
    return e
  }
}

function forEachNewPrimitive(mutations, fn) {
  try {
    return forEachNewPatch(mutations, forEachPrimitive, fn)
  }
  catch (e) {
    return e
  }
}

function forEachNewPatch(mutations, fn, callback) {
  const res = mutations.filter(isAdditiveMutation).map((mutation) => {
    return fn(mutation.value, callback, mutation.path)
  }) || []
  const flat = flatten(res)
  const clean = cleanArray(flat)
  return clean
}

function forEachPrimitive(obj, fn, basePath) {
  basePath = basePath || []

  if (Array.isArray(obj)) {
    return obj.map((val, key) => {
      return forEachPrimitive(val, fn, basePath.concat(key))
    })
  }

  if (isObject(obj)) {
    return Object.keys(obj).map((key) => {
      return forEachPrimitive(obj[key], fn, basePath.concat(key))
    })
  }

  return fn(obj, basePath[basePath.length - 1], basePath)
}

function forEach(obj, fn, basePath) {
  basePath = basePath || []

  let results = []
  if (basePath.length > 0) {
    const newResults = fn(obj, basePath[basePath.length - 1], basePath)
    if (newResults) {
      results = results.concat(newResults)
    }
  }

  if (Array.isArray(obj)) {
    const arrayResults = obj.map((val, key) => {
      return forEach(val, fn, basePath.concat(key))
    })
    if (arrayResults) {
      results = results.concat(arrayResults)
    }
  }
  else if (isObject(obj)) {
    const moreResults = Object.keys(obj).map((key) => {
      return forEach(obj[key], fn, basePath.concat(key))
    })
    if (moreResults) {
      results = results.concat(moreResults)
    }
  }

  results = flatten(results)
  return results
}


// =========================
// Paths
// =========================

function parentPathMatch(path, arr) {
  if (!Array.isArray(arr)) {
    return false
  }

  for (let i = 0, len = arr.length; i < len; i++) {
    if (arr[i] !== path[i]) {
      return false
    }
  }

  return true
}

function getIn(obj, path) {
  return path.reduce((val, token) => {
    if (typeof token !== 'undefined' && val) {
      return val[token]
    }
    return val
  }, obj)
}

// =========================
// Array
// =========================

function fullyNormalizeArray(arr) {
  return cleanArray(flatten(normalizeArray(arr)))
}

function normalizeArray(arr) {
  return Array.isArray(arr) ? arr : [arr]
}

function flatten(arr) {
  return [].concat(...arr.map((val) => {
    return Array.isArray(val) ? flatten(val) : val
  }))
}

function cleanArray(arr) {
  return arr.filter(elm => typeof elm !== 'undefined')
}


// =========================
// Is-Thing.
// =========================

function isObject(val) {
  return val && typeof val === 'object'
}

function isPromise(val) {
  return isObject(val) && isFunction(val.then)
}

function isFunction(val) {
  return val && typeof val === 'function'
}

function isError(patch) {
  return patch instanceof Error
}

function isJsonPatch(patch) {
  if (isPatch(patch)) {
    const op = patch.op
    return op === 'add' || op === 'remove' || op === 'replace'
  }
  return false
}

function isGenerator(thing) {
  return regenerator.isGeneratorFunction(thing)
}

function isMutation(patch) {
  return isJsonPatch(patch) || (isPatch(patch) && patch.type === 'mutation')
}

function isAdditiveMutation(patch) {
  return isMutation(patch) && (patch.op === 'add' || patch.op === 'replace' || patch.op === 'merge' || patch.op === 'mergeDeep')
}

function isContextPatch(patch) {
  return isPatch(patch) && patch.type === 'context'
}

function isPatch(patch) {
  return patch && typeof patch === 'object'
}

function getInByJsonPath(obj, jsonPath) {
  try {
    return jsonPatch.getValueByPointer(obj, jsonPath)
  }
  catch (e) {
    console.error(e) // eslint-disable-line no-console
    return {}
  }
}
