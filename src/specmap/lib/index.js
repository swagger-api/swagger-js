import * as jsonPatch from 'fast-json-patch';
import deepmerge from 'deepmerge';

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
  isError,
};

function applyPatch(obj, patch, opts) {
  opts = opts || {};

  patch = { ...patch, path: patch.path && normalizeJSONPath(patch.path) };

  if (patch.op === 'merge') {
    const newValue = getInByJsonPath(obj, patch.path);
    Object.assign(newValue, patch.value);
    jsonPatch.applyPatch(obj, [replace(patch.path, newValue)]);
  } else if (patch.op === 'mergeDeep') {
    const currentValue = getInByJsonPath(obj, patch.path);
    const newValue = deepmerge(currentValue, patch.value, patch.mergeOptions);
    obj = jsonPatch.applyPatch(obj, [replace(patch.path, newValue)]).newDocument;
  } else if (patch.op === 'add' && patch.path === '' && isObject(patch.value)) {
    // { op: 'add', path: '', value: { a: 1, b: 2 }}
    // has no effect: json patch refuses to do anything.
    // so let's break that patch down into a set of patches,
    // one for each key in the intended root value.

    const patches = Object.keys(patch.value).reduce((arr, key) => {
      arr.push({
        op: 'add',
        path: `/${normalizeJSONPath(key)}`,
        value: patch.value[key],
      });
      return arr;
    }, []);

    jsonPatch.applyPatch(obj, patches);
  } else if (patch.op === 'replace' && patch.path === '') {
    let { value } = patch;

    if (
      opts.allowMetaPatches &&
      patch.meta &&
      isAdditiveMutation(patch) &&
      (Array.isArray(patch.value) || isObject(patch.value))
    ) {
      value = { ...value, ...patch.meta };
    }
    obj = value;
  } else {
    jsonPatch.applyPatch(obj, [patch]);

    // Attach metadata to the resulting value.
    if (
      opts.allowMetaPatches &&
      patch.meta &&
      isAdditiveMutation(patch) &&
      (Array.isArray(patch.value) || isObject(patch.value))
    ) {
      const currentValue = getInByJsonPath(obj, patch.path);
      const newValue = { ...currentValue, ...patch.meta };
      jsonPatch.applyPatch(obj, [replace(patch.path, newValue)]);
    }
  }

  return obj;
}

function normalizeJSONPath(path) {
  if (Array.isArray(path)) {
    if (path.length < 1) {
      return '';
    }

    return `/${path
      .map(
        (item) =>
          // eslint-disable-line prefer-template
          (item + '').replace(/~/g, '~0').replace(/\//g, '~1') // eslint-disable-line prefer-template
      )
      .join('/')}`;
  }

  return path;
}

// =========================
// JSON-Patch Wrappers
// =========================

function add(path, value) {
  return { op: 'add', path, value };
}

// function _get(path) {
//   return { op: '_get', path };
// }

function replace(path, value, meta) {
  return {
    op: 'replace',
    path,
    value,
    meta,
  };
}

function remove(path) {
  return { op: 'remove', path };
}

// Custom wrappers
function merge(path, value) {
  return {
    type: 'mutation',
    op: 'merge',
    path,
    value,
  };
}

// Custom wrappers
function mergeDeep(path, value, mergeOptions) {
  return {
    type: 'mutation',
    op: 'mergeDeep',
    path,
    value,
    mergeOptions,
  };
}

function context(path, value) {
  return { type: 'context', path, value };
}

// =========================
// Iterators
// =========================

function forEachNew(mutations, fn) {
  try {
    return forEachNewPatch(mutations, forEach, fn);
  } catch (e) {
    return e;
  }
}

function forEachNewPrimitive(mutations, fn) {
  try {
    return forEachNewPatch(mutations, forEachPrimitive, fn);
  } catch (e) {
    return e;
  }
}

function forEachNewPatch(mutations, fn, callback) {
  const res =
    mutations
      .filter(isAdditiveMutation)
      .map((mutation) => fn(mutation.value, callback, mutation.path)) || [];
  const flat = flatten(res);
  const clean = cleanArray(flat);
  return clean;
}

function forEachPrimitive(obj, fn, basePath) {
  basePath = basePath || [];

  if (Array.isArray(obj)) {
    return obj.map((val, key) => forEachPrimitive(val, fn, basePath.concat(key)));
  }

  if (isObject(obj)) {
    return Object.keys(obj).map((key) => forEachPrimitive(obj[key], fn, basePath.concat(key)));
  }

  return fn(obj, basePath[basePath.length - 1], basePath);
}

function forEach(obj, fn, basePath) {
  basePath = basePath || [];

  let results = [];
  if (basePath.length > 0) {
    const newResults = fn(obj, basePath[basePath.length - 1], basePath);
    if (newResults) {
      results = results.concat(newResults);
    }
  }

  if (Array.isArray(obj)) {
    const arrayResults = obj.map((val, key) => forEach(val, fn, basePath.concat(key)));
    if (arrayResults) {
      results = results.concat(arrayResults);
    }
  } else if (isObject(obj)) {
    const moreResults = Object.keys(obj).map((key) => forEach(obj[key], fn, basePath.concat(key)));
    if (moreResults) {
      results = results.concat(moreResults);
    }
  }

  results = flatten(results);
  return results;
}

// =========================
// Paths
// =========================

function parentPathMatch(path, arr) {
  if (!Array.isArray(arr)) {
    return false;
  }

  for (let i = 0, len = arr.length; i < len; i += 1) {
    if (arr[i] !== path[i]) {
      return false;
    }
  }

  return true;
}

function getIn(obj, path) {
  return path.reduce((val, token) => {
    if (typeof token !== 'undefined' && val) {
      return val[token];
    }
    return val;
  }, obj);
}

// =========================
// Array
// =========================

function fullyNormalizeArray(arr) {
  return cleanArray(flatten(normalizeArray(arr)));
}

function normalizeArray(arr) {
  return Array.isArray(arr) ? arr : [arr];
}

function flatten(arr) {
  return [].concat(...arr.map((val) => (Array.isArray(val) ? flatten(val) : val)));
}

function cleanArray(arr) {
  return arr.filter((elm) => typeof elm !== 'undefined');
}

// =========================
// Is-Thing.
// =========================

function isObject(val) {
  return val && typeof val === 'object';
}

function isPromise(val) {
  return isObject(val) && isFunction(val.then);
}

function isFunction(val) {
  return val && typeof val === 'function';
}

function isError(patch) {
  return patch instanceof Error;
}

function isJsonPatch(patch) {
  if (isPatch(patch)) {
    const { op } = patch;
    return op === 'add' || op === 'remove' || op === 'replace';
  }
  return false;
}

function isGenerator(thing) {
  return Object.prototype.toString.call(thing) === '[object GeneratorFunction]';
}

function isMutation(patch) {
  return isJsonPatch(patch) || (isPatch(patch) && patch.type === 'mutation');
}

function isAdditiveMutation(patch) {
  return (
    isMutation(patch) &&
    (patch.op === 'add' ||
      patch.op === 'replace' ||
      patch.op === 'merge' ||
      patch.op === 'mergeDeep')
  );
}

function isContextPatch(patch) {
  return isPatch(patch) && patch.type === 'context';
}

function isPatch(patch) {
  return patch && typeof patch === 'object';
}

function getInByJsonPath(obj, jsonPath) {
  try {
    return jsonPatch.getValueByPointer(obj, jsonPath);
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    return {};
  }
}
