export function isFile(obj, navigatorObj) {
  if (!navigatorObj && typeof navigator !== 'undefined') {
    // eslint-disable-next-line no-undef
    navigatorObj = navigator;
  }
  if (navigatorObj && navigatorObj.product === 'ReactNative') {
    if (obj && typeof obj === 'object' && typeof obj.uri === 'string') {
      return true;
    }
    return false;
  }
  if (typeof File !== 'undefined' && obj instanceof File) {
    return true;
  }
  if (typeof Blob !== 'undefined' && obj instanceof Blob) {
    return true;
  }
  if (ArrayBuffer.isView(obj)) {
    return true;
  }
  return obj !== null && typeof obj === 'object' && typeof obj.pipe === 'function';
}
export function isArrayOfFile(obj, navigatorObj) {
  return Array.isArray(obj) && obj.some(v => isFile(v, navigatorObj));
}

/**
 * Specialized sub-class of File class, that only
 * accepts string data and retain this data in `data`
 * public property throughout the lifecycle of its instances.
 *
 * This sub-class is exclusively used only when Encoding Object
 * is defined within the Media Type Object (OpenAPI 3.x.y).
 */
export class FileWithData extends File {
  constructor(data, name = '', options = {}) {
    super([data], name, options);
    this.data = data;
  }
  valueOf() {
    return this.data;
  }
  toString() {
    return this.valueOf();
  }
}