import fetch from 'isomorphic-fetch'
import qs from 'qs'
import jsYaml from 'js-yaml'
import assign from 'lodash/assign'

// For testing
export const self = {
  serializeRes,
  mergeInQueryOrForm
}

// Handles fetch-like syntax and the case where there is only one object passed-in
// (which will have the URL as a property). Also serilizes the response.
export default function http(url, request={}) {
  if (typeof url === 'object') {
    request = url
    url = request.url
  }

  request.headers = request.headers || {}

  // Serializes query, for convenience
  // Should be the last thing we do, as its hard to mutate the URL with
  // the search string, but much easier to manipulate the req.query object
  self.mergeInQueryOrForm(request)

  if (request.requestInterceptor) {
    request = request.requestInterceptor(request) || request
  }

  // for content-type=multipart\/form-data remove content-type from request before fetch
  // so that correct one with `boundary` is set
  let contentType = request.headers["content-type"] || request.headers["Content-Type"]
  if (/multipart\/form-data/i.test(contentType)) {
    delete request.headers['content-type']
    delete request.headers['Content-Type']
  }

  return fetch(request.url, request).then((res) => {
    return self.serializeRes(res, url, request).then((_res) => {
      if (request.responseInterceptor) {
        _res = request.responseInterceptor(_res) || _res
      }
      return _res
    })
  })
}

function shouldDownloadAsText(contentType) {
  return /json/.test(contentType) ||
         /xml/.test(contentType) ||
         /yaml/.test(contentType) ||
         /text/.test(contentType)
}

// Serialize the response, returns a promise with headers and the body part of the hash
export function serializeRes(oriRes, url, {loadSpec = false}) {
  const res = {
    ok: oriRes.ok,
    url: oriRes.url || url,
    status: oriRes.status,
    statusText: oriRes.statusText,
    headers: serializeHeaders(oriRes.headers)
  }

  const useText = loadSpec || shouldDownloadAsText(res.headers['content-type'])

  return oriRes[useText ? 'text' : 'blob']().then((body) => {
    res.text = body
    res.data = body

    if (useText) {
      try {
        // Optimistically try to convert all bodies
        const obj = jsYaml.safeLoad(body)
        res.body = obj
        res.obj = obj
      }
      catch (e) {
        res.parseError = e
      }
    }
    return res
  })
}

// Serialize headers into a hash, where mutliple-headers result in an array.
//
// eg: Cookie: one
//     Cookie: two
//  =  { Cookie: [ "one", "two" ]
export function serializeHeaders(headers = {}) {
  const obj = {}

  // Iterate over headers, making multiple-headers into an array
  if (typeof headers.forEach === 'function') {
    headers.forEach((headerValue, header) => {
      if (obj[header] !== undefined) {
        obj[header] = Array.isArray(obj[header]) ? obj[header] : [obj[header]]
        obj[header].push(headerValue)
      }
      else {
        obj[header] = headerValue
      }
    })
    return obj
  }

  return obj
}

function isFile(obj) {
  if (typeof File !== 'undefined') {
    return obj instanceof File
  }
  return obj !== null && typeof obj === 'object' && typeof obj.pipe === 'function'
}

function encodeValue({value, collectionFormat, allowEmptyValue}) {
  const SEPARATORS = {
    csv: ',',
    ssv: '%20',
    tsv: '%09',
    pipes: '|'
  }

  if (typeof value === 'undefined' && allowEmptyValue) {
    return ''
  }
  if (isFile(value)) {
    return value
  }
  if (value && !Array.isArray(value)) {
    return encodeURIComponent(value)
  }
  if (Array.isArray(value) && !collectionFormat) {
    return value.map(encodeURIComponent).join(',')
  }
  if (collectionFormat === 'multi') {
    return value.map(encodeURIComponent)
  }
  return value.map(encodeURIComponent).join(SEPARATORS[collectionFormat])
}

// Encodes an object using appropriate serializer.
export function encodeFormOrQuery(data) {
  /**
   * Encode parameter names and values
   * @param {Object} result - parameter names and values
   * @param {string} parameterName - Parameter name
   * @return {object} encoded parameter names and values
   */
  const encodedQuery = Object.keys(data).reduce((result, parameterName) => {
    const isObject = a => a && typeof a === 'object'
    const paramValue = data[parameterName]
    const encodedParameterName = encodeURIComponent(parameterName)
    const notArray = isObject(paramValue) && !Array.isArray(paramValue)
    result[encodedParameterName] = encodeValue(notArray ? paramValue : {value: paramValue})
    return result
  }, {})
  return qs.stringify(encodedQuery, {encode: false, indices: false}) || ''
}

// If the request has a `query` object, merge it into the request.url, and delete the object
export function mergeInQueryOrForm(req = {}) {
  const {url = '', query, form} = req

  const joinSearch = (...strs) => {
    const search = strs.filter(a => a).join('&') // Only truthy value
    return search ? `?${search}` : '' // Only add '?' if there is a str
  }

  if (form) {
    const hasFile = Object.keys(form).some((key) => {
      return isFile(form[key].value)
    })

    let contentType = req.headers["content-type"] || req.headers["Content-Type"]

    if (hasFile || /multipart\/form-data/i.test(contentType)) {
      const FormData = require('isomorphic-form-data') // eslint-disable-line global-require
      req.body = new FormData()
      Object.keys(form).forEach((key) => {
        req.body.append(key, encodeValue(form[key]))
      })
    }
    else {
      req.body = encodeFormOrQuery(form)
    }

    delete (req.form)
  }

  if (query) {
    const [baseUrl, oriSearch] = url.split('?')
    let newStr = ''

    if (oriSearch) {
      const oriQuery = qs.parse(oriSearch)
      const keysToRemove = Object.keys(query)
      keysToRemove.forEach(key => delete oriQuery[key])
      newStr = qs.stringify(oriQuery, {encode: true})
    }

    const finalStr = joinSearch(newStr, encodeFormOrQuery(query))
    req.url = baseUrl + finalStr
    delete (req.query)
  }
  return req
}

// Wrap a http function ( there are otherways to do this, conisder this deprecated )
export function makeHttp(httpFn, preFetch, postFetch) {
  postFetch = postFetch || (a => a)
  preFetch = preFetch || (a => a)

  return (req) => {
    if (typeof req === 'string') {
      req = {url: req}
    }
    self.mergeInQueryOrForm(req)
    req = preFetch(req)
    return postFetch(httpFn(req))
  }
}
