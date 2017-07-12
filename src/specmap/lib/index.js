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
  opts = opts || {}

  patch = Object.assign({}, patch, {
    path: patch.path && normalizeJSONPath(patch.path)
  })

  if (patch.op === 'merge') {
    const valPatch = _get(patch.path)
    jsonPatch.apply(obj, [valPatch])
    Object.assign(valPatch.value, patch.value)
  }
  else if (patch.op === 'mergeDeep') {
    const valPatch = _get(patch.path)
    jsonPatch.apply(obj, [valPatch])
    const origValPatchValue = Object.assign({}, valPatch.value)
    deepExtend(valPatch.value, patch.value)

    // deepExtend doesn't merge arrays, so we will do it manually
    for (const prop in patch.value) {
      if (Object.prototype.hasOwnProperty.call(patch.value, prop)) {
        const propVal = patch.value[prop]
        if (Array.isArray(propVal)) {
          const existing = origValPatchValue[prop] || []
          valPatch.value[prop] = existing.concat(propVal)
        }
      }
    }
  }
  else {
    jsonPatch.apply(obj, [patch])

    // Attach metadata to the resulting value.
    if (opts.allowMetaPatches && patch.meta && isAdditiveMutation(patch) &&
        (Array.isArray(patch.value) || isObject(patch.value))) {
      const valPatch = _get(patch.path)
      jsonPatch.apply(obj, [valPatch])
      Object.assign(valPatch.value, patch.meta)
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
