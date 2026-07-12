"use strict";

exports.__esModule = true;
exports.default = formatKeyValue;
var _file = require("./file.js");
var _styleSerializer = require("../../../execute/oas3/style-serializer.js");
const STYLE_SEPARATORS = {
  form: ',',
  spaceDelimited: '%20',
  pipeDelimited: '|'
};
const SEPARATORS = {
  csv: ',',
  ssv: '%20',
  tsv: '%09',
  pipes: '|'
};

// Formats a key-value and returns an array of key-value pairs.
//
// Return value example 1: [['color', 'blue']]
// Return value example 2: [['color', 'blue,black,brown']]
// Return value example 3: [['color', ['blue', 'black', 'brown']]]
// Return value example 4: [['color', 'R,100,G,200,B,150']]
// Return value example 5: [['R', '100'], ['G', '200'], ['B', '150']]
// Return value example 6: [['color[R]', '100'], ['color[G]', '200'], ['color[B]', '150']]
function formatKeyValue(key, input, skipEncoding = false) {
  const {
    collectionFormat,
    allowEmptyValue,
    serializationOption,
    encoding
  } = input;
  // `input` can be string
  const value = typeof input === 'object' && !Array.isArray(input) ? input.value : input;
  const encodeFn = skipEncoding ? k => k.toString() : k => encodeURIComponent(k);
  const encodedKey = encodeFn(key);
  if (typeof value === 'undefined' && allowEmptyValue) {
    return [[encodedKey, '']];
  }

  // file
  if ((0, _file.isFile)(value) || (0, _file.isArrayOfFile)(value)) {
    return [[encodedKey, value]];
  }

  // for OAS 3 Parameter Object for serialization
  if (serializationOption) {
    return formatKeyValueBySerializationOption(key, value, skipEncoding, serializationOption);
  }

  // for OAS 3 Encoding Object
  if (encoding) {
    if ([typeof encoding.style, typeof encoding.explode, typeof encoding.allowReserved].some(type => type !== 'undefined')) {
      const {
        style,
        explode,
        allowReserved
      } = encoding;
      return formatKeyValueBySerializationOption(key, value, skipEncoding, {
        style,
        explode,
        allowReserved
      });
    }
    if (typeof encoding.contentType === 'string') {
      if (encoding.contentType.startsWith('application/json')) {
        // if value is a string, assume value is already a JSON string
        const json = typeof value === 'string' ? value : JSON.stringify(value);
        const encodedJson = encodeFn(json);
        const file = new _file.FileWithData(encodedJson, 'blob', {
          type: encoding.contentType
        });
        return [[encodedKey, file]];
      }
      const encodedData = encodeFn(String(value));
      const blob = new _file.FileWithData(encodedData, 'blob', {
        type: encoding.contentType
      });
      return [[encodedKey, blob]];
    }

    // Primitive
    if (typeof value !== 'object') {
      return [[encodedKey, encodeFn(value)]];
    }

    // Array of primitives
    if (Array.isArray(value) && value.every(v => typeof v !== 'object')) {
      return [[encodedKey, value.map(encodeFn).join(',')]];
    }

    // Array or object
    return [[encodedKey, encodeFn(JSON.stringify(value))]];
  }

  // for OAS 2 Parameter Object
  // Primitive
  if (typeof value !== 'object') {
    return [[encodedKey, encodeFn(value)]];
  }

  // Array
  if (Array.isArray(value)) {
    if (collectionFormat === 'multi') {
      // In case of multipart/formdata, it is used as array.
      // Otherwise, the caller will convert it to a query by qs.stringify.
      return [[encodedKey, value.map(encodeFn)]];
    }
    return [[encodedKey, value.map(encodeFn).join(SEPARATORS[collectionFormat || 'csv'])]];
  }

  // Object
  return [[encodedKey, '']];
}
function formatKeyValueBySerializationOption(key, value, skipEncoding, serializationOption) {
  const style = serializationOption.style || 'form';
  const explode = typeof serializationOption.explode === 'undefined' ? style === 'form' : serializationOption.explode;
  // eslint-disable-next-line no-nested-ternary
  const escape = skipEncoding ? false : serializationOption && serializationOption.allowReserved ? 'unsafe' : 'reserved';
  const encodeFn = v => (0, _styleSerializer.valueEncoder)(v, escape);
  const encodeKeyFn = skipEncoding ? k => k : k => encodeFn(k);

  // Primitive
  if (typeof value !== 'object') {
    return [[encodeKeyFn(key), encodeFn(value)]];
  }

  // Array
  if (Array.isArray(value)) {
    if (explode) {
      // In case of multipart/formdata, it is used as array.
      // Otherwise, the caller will convert it to a query by qs.stringify.
      return [[encodeKeyFn(key), value.map(encodeFn)]];
    }
    return [[encodeKeyFn(key), value.map(encodeFn).join(STYLE_SEPARATORS[style])]];
  }

  // Object
  if (style === 'deepObject') {
    return Object.keys(value).map(valueKey => [encodeKeyFn(`${key}[${valueKey}]`), encodeFn(value[valueKey])]);
  }
  if (explode) {
    return Object.keys(value).map(valueKey => [encodeKeyFn(valueKey), encodeFn(value[valueKey])]);
  }
  return [[encodeKeyFn(key), Object.keys(value).map(valueKey => [`${encodeKeyFn(valueKey)},${encodeFn(value[valueKey])}`]).join(',')]];
}