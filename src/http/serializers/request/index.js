import formatKeyValue from './format.js';
import { isFile, isArrayOfFile, FileWithData } from './file.js';

function buildFormData(reqForm) {
  /**
   * Build a new FormData instance, support array as field value
   * OAS2.0 - when collectionFormat is multi
   * OAS3.0 - when explode of Encoding Object is true
   *
   * This function explicitly handles Buffers (for backward compatibility)
   * if provided as a values to FormData. FormData can only handle USVString
   * or Blob.
   *
   * @param {Object} reqForm - ori req.form
   * @return {FormData} - new FormData instance
   */
  return Object.entries(reqForm).reduce((formData, [name, input]) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of formatKeyValue(name, input, true)) {
      if (Array.isArray(value)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const v of value) {
          if (ArrayBuffer.isView(v)) {
            const blob = new Blob([v]);
            formData.append(key, blob);
          } else {
            formData.append(key, v);
          }
        }
      } else if (ArrayBuffer.isView(value)) {
        const blob = new Blob([value]);
        formData.append(key, blob);
      } else {
        formData.append(key, value);
      }
    }
    return formData;
  }, new FormData());
}

export const stringifyQuery = (queryObject, { encode = true } = {}) => {
  const buildNestedParams = (params, key, value) => {
    if (value == null) {
      params.append(key, '');
    } else if (Array.isArray(value)) {
      value.reduce((acc, v) => buildNestedParams(params, key, v), params);
    } else if (value instanceof Date) {
      params.append(key, value.toISOString());
    } else if (typeof value === 'object') {
      Object.entries(value).reduce(
        (acc, [k, v]) => buildNestedParams(params, `${key}[${k}]`, v),
        params
      );
    } else {
      params.append(key, value);
    }

    return params;
  };
  const params = Object.entries(queryObject).reduce(
    (acc, [key, value]) => buildNestedParams(acc, key, value),
    new URLSearchParams()
  );
  const queryString = String(params);

  return encode ? queryString : decodeURIComponent(queryString);
};

// Encodes an object using appropriate serializer.
export function encodeFormOrQuery(data) {
  /**
   * Encode parameter names and values
   * @param {Object} result - parameter names and values
   * @param {string} parameterName - Parameter name
   * @return {object} encoded parameter names and values
   */
  const encodedQueryObj = Object.keys(data).reduce((result, parameterName) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of formatKeyValue(parameterName, data[parameterName])) {
      if (value instanceof FileWithData) {
        result[key] = value.valueOf();
      } else {
        result[key] = value;
      }
    }
    return result;
  }, {});

  return stringifyQuery(encodedQueryObj, { encode: false });
}

// If the request has a `query` object, merge it into the request.url, and delete the object
// If file and/or multipart, also create FormData instance
export function serializeRequest(req = {}) {
  const { url = '', query, form } = req;
  const joinSearch = (...strs) => {
    const search = strs.filter((a) => a).join('&'); // Only truthy value
    return search ? `?${search}` : ''; // Only add '?' if there is a str
  };

  if (form) {
    const hasFile = Object.keys(form).some((key) => {
      const { value } = form[key];
      return isFile(value) || isArrayOfFile(value);
    });

    const contentType = req.headers['content-type'] || req.headers['Content-Type'];

    if (hasFile || /multipart\/form-data/i.test(contentType)) {
      const formdata = buildFormData(req.form);
      req.formdata = formdata;
      req.body = formdata;
    } else {
      req.body = encodeFormOrQuery(form);
    }

    delete req.form;
  }

  if (query) {
    const [baseUrl, oriSearch] = url.split('?');
    let newStr = '';

    if (oriSearch) {
      const oriQuery = new URLSearchParams(oriSearch);
      const keysToRemove = Object.keys(query);
      keysToRemove.forEach((key) => oriQuery.delete(key));
      newStr = String(oriQuery);
    }

    const finalStr = joinSearch(newStr, encodeFormOrQuery(query));
    req.url = baseUrl + finalStr;
    delete req.query;
  }
  return req;
}
