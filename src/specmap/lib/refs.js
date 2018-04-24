import {fetch} from 'cross-fetch'
import url from 'url'
import lib from '../lib'
import createError from '../lib/create-error'
import {isFreelyNamed} from '../helpers'

const ABSOLUTE_URL_REGEXP = new RegExp('^([a-z]+://|//)', 'i')

const JSONRefError = createError('JSONRefError', function (message, extra, oriError) {
  this.originalError = oriError
  Object.assign(this, extra || {})
})

const docCache = {}
const specmapRefs = new WeakMap()


// =========================
// Core
// =========================

/**
 * This plugin resolves the JSON pointers.
 * A major part of this plugin deals with cyclic references via 2 mechanisms.
 * 1. If a pointer was already resolved before in this path, halt.
 * 2. If the patch value points to one of the ancestors in this path, halt.
 *
 * Note that either one of these mechanism is sufficient, both must be in place.
 * For examples:
 *
 * Given the following spec, #1 alone is insufficient because after the 2nd
 * application, there will be a cyclic object reference.
 *   a.b.c: $ref-d
 *   d.e.f: $ref-a (per #1, safe to return patch as no immediate cycle)
 *
 * Given the following spec, #2 alone is insufficient because although there will
 * never be any cyclic object reference, the plugin will keep producing patches.
 *   a: $ref-b
 *   b: $ref-a
 */
const plugin = {
  key: '$ref',
  plugin: (ref, key, fullPath, specmap) => {
    console.log('$ref', fullPath)
    const parent = fullPath.slice(0, -1)
    if (isFreelyNamed(parent)) {
      return
    }

    const baseDoc = specmap.getContext(fullPath).baseDoc
    if (typeof ref !== 'string') {
      return new JSONRefError('$ref: must be a string (JSON-Ref)', {
        $ref: ref,
        baseDoc,
        fullPath,
      })
    }

    const splitString = split(ref)
    const refPath = splitString[0]
    const pointer = splitString[1] || ''

    let basePath
    try {
      basePath = (baseDoc || refPath) ? absoluteify(refPath, baseDoc) : null
    }
    catch (e) {
      return wrapError(e, {
        pointer,
        $ref: ref,
        basePath,
        fullPath,
      })
    }

    let promOrVal
    let tokens

    if (pointerAlreadyInPath(pointer, basePath, parent, specmap)) {
      return // TODO: add some meta data, to indicate its cyclic!
    }

    if (basePath == null) {
      tokens = jsonPointerToArray(pointer)
      promOrVal = specmap.get(tokens)

      if (typeof promOrVal === 'undefined') {
        promOrVal = new JSONRefError(`Could not resolve reference: ${ref}`, {
          pointer,
          $ref: ref,
          baseDoc,
          fullPath,
        })
      }
    }
    else {
      promOrVal = extractFromDoc(basePath, pointer)
      if (promOrVal.__value != null) {
        promOrVal = promOrVal.__value
      }
      else {
        promOrVal = promOrVal.catch((e) => {
          throw wrapError(e, {
            pointer,
            $ref: ref,
            baseDoc,
            fullPath,
          })
        })
      }
    }

    if (promOrVal instanceof Error) {
      return [lib.remove(fullPath), promOrVal]
    }

    const patch = lib.replace(parent, promOrVal, {$$ref: ref})
    if (basePath && basePath !== baseDoc) {
      return [patch, lib.context(parent, {baseDoc: basePath})]
    }

    if (!patchValueAlreadyInPath(specmap.state, patch)) {
      return patch
    }
  }
}


const mod = Object.assign(plugin, {
  docCache,
  absoluteify,
  clearCache,
  JSONRefError,
  wrapError,
  getDoc,
  split,
  extractFromDoc,
  fetchJSON,
  extract,
  jsonPointerToArray,
  unescapeJsonPointerToken
})

export default mod


// =========================
// Utilities
// =========================

/**
 * Resolves a path and its base to an abolute URL.
 * @api public
 */
function absoluteify(path, basePath) {
  if (!ABSOLUTE_URL_REGEXP.test(path)) {
    if (!basePath) {
      throw new JSONRefError(`Tried to resolve a relative URL, without having a basePath. path: '${path}' basePath: '${basePath}'`)
    }
    return url.resolve(basePath, path)
  }
  return path
}

/**
 * Wraps an error as JSONRefError.
 * @param  {Error} e      the error.
 * @param  {Object} extra (optional) optional data.
 * @return {Error}        an instance of JSONRefError.
 * @api public
 */
function wrapError(e, extra) {
  return new JSONRefError(`Could not resolve reference because of: ${e.message}`, extra, e)
}

/**
 * Splits a pointer by the hash delimiter.
 * @api public
 */
function split(ref) {
  return (ref + '').split('#') // eslint-disable-line prefer-template
}

/**
 * Extracts a pointer from its document.
 * @param  {String} docPath the absolute document URL.
 * @param  {String} pointer the pointer whose value is to be extracted.
 * @return {Promise}        a promise of the pointer value.
 * @api public
 */
function extractFromDoc(docPath, pointer) {
  const doc = docCache[docPath]
  if (doc && !lib.isPromise(doc)) {
    // If doc is already available, return __value together with the promise.
    // __value is for special handling in cycle check:
    // pointerAlreadyInPath() won't work if patch.value is a promise,
    // thus when that promise is finally resolved, cycle might happen (because
    // `spec` and `docCache[basePath]` refer to the exact same object).
    // See test "should resolve a cyclic spec when baseDoc is specified".
    try {
      const v = extract(pointer, doc)
      return Object.assign(Promise.resolve(v), {__value: v})
    }
    catch (e) {
      return Promise.reject(e)
    }
  }

  return getDoc(docPath).then(_doc => extract(pointer, _doc))
}

/**
 * Clears all document caches.
 * @param  {String} item (optional) the name of the cache item to be cleared.
 * @api public
 */
function clearCache(item) {
  if (typeof item !== 'undefined') {
    delete docCache[item]
  }
  else {
    Object.keys(docCache).forEach((key) => {
      delete docCache[key]
    })
  }
}

/**
 * Fetches and caches a document.
 * @param  {String} docPath the absolute URL of the document.
 * @return {Promise}        a promise of the document content.
 * @api public
 */
function getDoc(docPath) {
  const val = docCache[docPath]
  if (val) {
    return lib.isPromise(val) ? val : Promise.resolve(val)
  }

  // NOTE: we need to use `mod.fetchJSON` in order to be able to overwrite it.
  // Any tips on how to make this cleaner, please ping!
  docCache[docPath] = mod.fetchJSON(docPath).then((doc) => {
    docCache[docPath] = doc
    return doc
  })
  return docCache[docPath]
}

/**
 * Fetches a document.
 * @param  {String} docPath the absolute URL of the document.
 * @return {Promise}        a promise of the document content.
 * @api public
 */
function fetchJSON(docPath) {
  return fetch(docPath, {headers: {Accept: 'application/json, application/yaml'}, loadSpec: true}).then(res => res.json())
}

/**
 * Extracts a pointer from an object.
 * @param  {String[]} pointer the JSON pointer.
 * @param  {Object} obj       an object whose value is to be extracted.
 * @return {Object}           the value to be extracted.
 * @api public
 */
function extract(pointer, obj) {
  const tokens = jsonPointerToArray(pointer)
  if (tokens.length < 1) {
    return obj
  }

  const val = lib.getIn(obj, tokens)
  if (typeof val === 'undefined') {
    throw new JSONRefError(`Could not resolve pointer: ${pointer} does not exist in document`, {pointer})
  }
  return val
}

/**
 * Converts a JSON pointer to array.
 * @api public
 */
function jsonPointerToArray(pointer) {
  if (typeof pointer !== 'string') {
    throw new TypeError(`Expected a string, got a ${typeof pointer}`)
  }

  if (pointer[0] === '/') {
    pointer = pointer.substr(1)
  }

  if (pointer === '') {
    return []
  }

  return pointer.split('/').map(unescapeJsonPointerToken)
}

/**
 * Unescapes a JSON pointer.
 * @api public
 */
function unescapeJsonPointerToken(token) {
  if (typeof token !== 'string') {
    return token
  }
  return token.replace(/~1/g, '/').replace(/~0/g, '~')
}

/**
 * Escapes a JSON pointer.
 * @api public
 */
function escapeJsonPointerToken(token) {
  return token.replace(/~/g, '~0').replace(/\//g, '~1')
}

function arrayToJsonPointer(arr) {
  if (arr.length === 0) {
    return ''
  }

  return `/${arr.map(escapeJsonPointerToken).join('/')}`
}

const pointerBoundaryChar = c => !c || c === '/' || c === '#'

function pointerIsAParent(pointer, parentPointer) {
  if (pointerBoundaryChar(parentPointer)) {
    // This is the root of the document, so its naturally a parent
    return true
  }
  const nextChar = pointer.charAt(parentPointer.length)
  const lastParentChar = parentPointer.slice(-1)

  return pointer.indexOf(parentPointer) === 0
    && (!nextChar || nextChar === '/' || nextChar === '#')
    && lastParentChar !== '#'
}


// =========================
// Private
// =========================

/**
 * Checks if this pointer points back to one or more pointers along the path.
 */
function pointerAlreadyInPath(pointer, basePath, parent, specmap) {
  let refs = specmapRefs.get(specmap)
  if (!refs) {
    // Stores all resolved references of a specmap instance.
    // Schema: path -> pointer (path's $ref value).
    refs = {}
    specmapRefs.set(specmap, refs)
  }

  const parentPointer = arrayToJsonPointer(parent)
  const fullyQualifiedPointer = `${basePath || '<specmap-base>'}#${pointer}`

  // Case 1: direct cycle, e.g. a.b.c.$ref: '/a.b'
  // Detect by checking that the parent path doesn't start with pointer.
  // This only applies if the pointer is internal, i.e. basePath === rootPath (could be null)
  const rootDoc = specmap.contextTree.get([]).baseDoc
  if (basePath == rootDoc && pointerIsAParent(parentPointer, pointer)) { // eslint-disable-line
    return true
  }


  // Case 2: indirect cycle
  //  ex1: a.$ref: '/b'  &  b.c.$ref: '/b/c'
  //  ex2: a.$ref: '/b/c'  &  b.c.$ref: '/b'
  // Detect by retrieving all the $refs along the path of parent
  // and checking if any starts with pointer or vice versa.
  let currPath = ''
  const hasIndirectCycle = parent.some((token) => {
    currPath = `${currPath}/${escapeJsonPointerToken(token)}`
    return refs[currPath] && refs[currPath].some((ref) => {
      return (
           pointerIsAParent(ref, fullyQualifiedPointer)
        || pointerIsAParent(fullyQualifiedPointer, ref)
      )
    })
  })
  if (hasIndirectCycle) {
    return true
  }

  // No cycle, this ref will be resolved, so stores it now for future detection.
  // No need to store if has cycle, as parent path is a dead-end and won't be checked again.
  refs[parentPointer] = (refs[parentPointer] || []).concat(fullyQualifiedPointer)
}

/**
 * Checks if the value of this patch ends up pointing to an ancestor along the path.
 */
function patchValueAlreadyInPath(root, patch) {
  const ancestors = [root]
  patch.path.reduce((parent, p) => {
    ancestors.push(parent[p])
    return parent[p]
  }, root)
  return pointToAncestor(patch.value)

  function pointToAncestor(obj) {
    return lib.isObject(obj) && (ancestors.indexOf(obj) >= 0 || Object.keys(obj).some((k) => {
      return pointToAncestor(obj[k])
    }))
  }
}
