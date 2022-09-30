import { fetch } from 'cross-fetch';
import url from 'url';

import createError from './create-error.js';
import lib from '.';

const ABSOLUTE_URL_REGEXP = /^([a-z]+:\/\/|\/\/)/i;

const ExternalValueError = createError('ExternalValueError', function cb(message, extra, oriError) {
  this.originalError = oriError;
  Object.assign(this, extra || {});
});

const externalValuesCache = {};

/**
 * Resolves a path(optional absolute) and its base to an abolute URL.
 * @api public
 */
function absoluteify(path, basePath) {
  if (!ABSOLUTE_URL_REGEXP.test(path)) {
    if (!basePath) {
      throw new ExternalValueError(
        `Tried to resolve a relative URL, without having a basePath. path: '${path}' basePath: '${basePath}'`
      );
    }
    return url.resolve(basePath, path);
  }
  return path;
}

/**
 * Clears all external value caches.
 * @param  {String} uri (optional) the original externalValue value of the cache item to be cleared.
 * @api public
 */
function clearCache(uri) {
  if (typeof uri !== 'undefined') {
    delete externalValuesCache[uri];
  } else {
    Object.keys(externalValuesCache).forEach((key) => {
      delete externalValuesCache[key];
    });
  }
}

/**
 * Fetches a document.
 * @param  {String} docPath the absolute URL of the document.
 * @return {Promise}        a promise of the document content.
 * @api public
 */
const fetchRaw = (uri) => fetch(uri).then((res) => res.text);

const shouldResolveTestFn = [
  // OAS 3.0 Response Media Type Examples externalValue
  (path) =>
    // ["paths", *, *, "responses", *, "content", *, "examples", *, "externalValue"]
    path[0] === 'paths' &&
    path[3] === 'responses' &&
    path[5] === 'content' &&
    path[7] === 'examples' &&
    path[9] === 'externalValue',

  // OAS 3.0 Request Body Media Type Examples externalValue
  (path) =>
    // ["paths", *, *, "requestBody", "content", *, "examples", *, "externalValue"]
    path[0] === 'paths' &&
    path[3] === 'requestBody' &&
    path[4] === 'content' &&
    path[6] === 'examples' &&
    path[8] === 'externalValue',

  // OAS 3.0 Parameter Examples externalValue
  (path) =>
    // ["paths", *, "parameters", *, "examples", *, "externalValue"]
    path[0] === 'paths' &&
    path[2] === 'parameters' &&
    path[4] === 'examples' &&
    path[6] === 'externalValue',
  (path) =>
    // ["paths", *, *, "parameters", *, "examples", *, "externalValue"]
    path[0] === 'paths' &&
    path[3] === 'parameters' &&
    path[5] === 'examples' &&
    path[7] === 'externalValue',
  (path) =>
    // ["paths", *, "parameters", *, "content", *, "examples", *, "externalValue"]
    path[0] === 'paths' &&
    path[2] === 'parameters' &&
    path[4] === 'content' &&
    path[6] === 'examples' &&
    path[8] === 'externalValue',
  (path) =>
    // ["paths", *, *, "parameters", *, "content", *, "examples", *, "externalValue"]
    path[0] === 'paths' &&
    path[3] === 'parameters' &&
    path[5] === 'content' &&
    path[7] === 'examples' &&
    path[9] === 'externalValue',
];

const shouldSkipResolution = (path) => !shouldResolveTestFn.some((fn) => fn(path));

/**
 * This plugin resolves externalValue keys.
 * In order to do so it will use a cache in case the url was already requested.
 * It will use the fetchRaw method in order get the raw content hosted on specified url.
 * If successful retrieved it will replace the url with the actual value
 */
const plugin = {
  key: 'externalValue',
  plugin: (externalValue, _, fullPath, specmap, patch) => {
    const parent = fullPath.slice(0, -1);
    const parentObj = lib.getIn(patch.value, parent);

    if (parentObj.value !== undefined) {
      return undefined;
    }

    if (shouldSkipResolution(fullPath)) {
      return undefined;
    }
    const { baseDoc } = specmap.getContext(fullPath);

    if (typeof externalValue !== 'string') {
      return new ExternalValueError('externalValue: must be a string', {
        externalValue,
        baseDoc,
        fullPath,
      });
    }

    const pathFragmentSplit = externalValue.split('#');
    const externalValuePath = pathFragmentSplit[0];

    let basePath;
    try {
      // eslint-disable-next-line no-unused-vars
      basePath = baseDoc || externalValuePath ? absoluteify(externalValuePath, baseDoc) : null;
    } catch (e) {
      return new ExternalValueError(`Could not absoluteify externalValue: ${externalValue}`, {
        externalValue,
        baseDoc,
        fullPath,
      });
    }

    try {
      let externalValueOrPromise = getExternalValue(externalValue, fullPath);
      if (typeof externalValueOrPromise === 'undefined') {
        externalValueOrPromise = new ExternalValueError(
          `Could not resolve externalValue: ${externalValue}`,
          {
            externalValue,
            baseDoc,
            fullPath,
          }
        );
      }
      // eslint-disable-next-line no-underscore-dangle
      if (externalValueOrPromise.__value != null) {
        // eslint-disable-next-line no-underscore-dangle
        externalValueOrPromise = externalValueOrPromise.__value;
      } else {
        externalValueOrPromise = externalValueOrPromise.catch((e) => {
          throw wrapError(e, {
            externalValue,
            fullPath,
          });
        });
      }

      if (externalValueOrPromise instanceof Error) {
        return [lib.remove(fullPath), externalValueOrPromise];
      }

      const backupOriginalValuePatch = lib.add([...parent, '$externalValue'], externalValue);
      const valuePatch = lib.replace([...parent, 'value'], externalValueOrPromise);
      const cleanUpPatch = lib.remove(fullPath);
      return [backupOriginalValuePatch, valuePatch, cleanUpPatch];
    } catch (err) {
      return [
        lib.remove(fullPath),
        wrapError(err, {
          externalValue,
          fullPath,
        }),
      ];
    }
  },
};
const mod = Object.assign(plugin, {
  wrapError,
  clearCache,
  ExternalValueError,
  fetchRaw,
  getExternalValue,
  absoluteify,
});
export default mod;

/**
 * Wraps an error as ExternalValueError.
 * @param  {Error} e      the error.
 * @param  {Object} extra (optional) optional data.
 * @return {Error}        an instance of ExternalValueError.
 * @api public
 */
function wrapError(e, extra) {
  let message;

  if (e && e.response && e.response.body) {
    message = `${e.response.body.code} ${e.response.body.message}`;
  } else {
    message = e.message;
  }

  return new ExternalValueError(`Could not resolve externalValue: ${message}`, extra, e);
}

/**
 * Fetches and caches a ExternalValue.
 * @param  {String} docPath the absolute URL of the document.
 * @return {Promise}        a promise of the document content.
 * @api public
 */
function getExternalValue(uri) {
  const val = externalValuesCache[uri];
  if (val) {
    return lib.isPromise(val) ? val : Promise.resolve(val);
  }

  // NOTE: we need to use `mod.fetchRaw` in order to be able to overwrite it.
  // Any tips on how to make this cleaner, please ping!
  externalValuesCache[uri] = mod.fetchRaw(uri).then((raw) => {
    externalValuesCache[uri] = raw;
    return raw;
  });
  return externalValuesCache[uri];
}
