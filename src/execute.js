import assign from 'lodash/assign'
import getIn from 'lodash/get'
import btoa from 'btoa'
import http, {mergeInQueryOrForm} from './http'
import {getOperationRaw, idFromPathMethod} from './helpers'

const arrayOrEmpty = (ar) => {
  return Array.isArray(ar) ? ar : []
}

// For stubbing in tests
export const self = {
  buildRequest
}

// These functions will update the request.
// They'll be given {req, value, paramter, spec, operation}.
export const PARAMETER_BUILDERS = {
  body: bodyBuilder,
  header: headerBuilder,
  query: queryBuilder,
  path: pathBuilder,
  formData: formDataBuilder
}

// Execute request, with the given operationId and parameters
// pathName/method or operationId is optional
export function execute({
  fetch, spec, operationId, pathName, method, parameters, securities, ...extras
}) {
  // Provide default fetch implementation
  fetch = fetch || http

  // Prefer pathName/method if it exists
  if (pathName && method) {
    operationId = idFromPathMethod(pathName, method)
  }

  const request = self.buildRequest({spec, operationId, parameters, securities, ...extras})

  // Build request and execute it
  return fetch(request)
}

// Build a request, which can be handled by the `http.js` implementation.
export function buildRequest({
  spec, operationId, parameters, securities, requestContentType,
  responseContentType, parameterBuilders, scheme,
  requestInterceptor, responseInterceptor
}) {
  parameterBuilders = parameterBuilders || PARAMETER_BUILDERS
  
  // Base Template
  let req = {
    url: baseUrl(spec, scheme),
    headers: {
      // This breaks CORSs... removing this line... probably breaks oAuth. Need to address that
      // This also breaks tests
      // 'access-control-allow-origin': '*'
    }
  }

  if (requestInterceptor) {
    req.requestInterceptor = requestInterceptor
  }
  if (responseInterceptor) {
    req.responseInterceptor = responseInterceptor
  }

  // Mostly for testing
  if (!operationId) {
    return req
  }

  const {operation = {}, method, pathName} = getOperationRaw(spec, operationId)

  req.url += pathName // Have not yet replaced the path parameters
  req.method = (`${method}`).toUpperCase()

  parameters = parameters || {}

  if (responseContentType) {
    req.headers.accept = responseContentType
  }

  if (requestContentType) {
    req.headers['content-type'] = requestContentType
  }

  // Add values to request
  arrayOrEmpty(operation.parameters) // operation parameters
    .concat(arrayOrEmpty(spec.paths[pathName].parameters)) // path parameters
    .forEach((parameter) => {
      const builder = parameterBuilders[parameter.in]
      let value

      if(parameter.in === 'body' && parameter.schema && parameter.schema.properties) {
        value = parameters
      }

      value = parameter && parameter.name && parameters[parameter.name]

      if (typeof parameter.default !== 'undefined' && typeof value === 'undefined') {
        value = parameter.default
      }

      if (typeof value === 'undefined' && parameter.required && !parameter.allowEmptyValue) {
        throw new Error(`Required parameter ${parameter.name} is not provided`)
      }

      if (builder) {
        builder({req, parameter, value, operation, spec})
      }
    })

  // Add securities, which are applicable
  req = applySecurities({request: req, securities, operation, spec})
  // Will add the query object into the URL, if it exists
  mergeInQueryOrForm(req)
  return req
}

// Add the body to the request
export function bodyBuilder({req, value}) {
  req.body = value
}

// Add a form data object.
export function formDataBuilder({req, value, parameter}) {
  req.form = req.form || {}
  if (value || parameter.allowEmptyValue) {
    req.form[parameter.name] = {
      value,
      allowEmptyValue: parameter.allowEmptyValue,
      collectionFormat: parameter.collectionFormat,
    }
  }
}

// Add a header to the request
export function headerBuilder({req, parameter, value}) {
  req.headers = req.headers || {}
  req.headers[parameter.name] = value
}

// Replace path paramters, with values ( ie: the URL )
export function pathBuilder({req, value, parameter}) {
  req.url = req.url.replace(`{${parameter.name}}`, encodeURIComponent(value))
}

// Add a query to the `query` object, which will later be stringified into the URL's search
export function queryBuilder({req, value, parameter}) {
  req.query = req.query || {}
  if (value) {
    req.query[parameter.name] = {
      collectionFormat: parameter.collectionFormat,
      value
    }
  }
  else if (parameter.allowEmptyValue) {
    const paramName = parameter.name
    req.query[paramName] = req.query[paramName] || {}
    req.query[paramName].allowEmptyValue = true
  }
}

// Compose the baseUrl ( scheme + host + basePath )
export function baseUrl(spec, scheme) {
  const {host, basePath, schemes = ['http']} = spec

  let applyScheme = ['http', 'https'].indexOf(scheme) > -1 ? scheme : schemes[0]
  applyScheme = applyScheme ? `${applyScheme}:` : ''

  if (host || basePath) {
    return `${applyScheme}//${host || ''}${basePath || ''}`
  }

  return ''
}


// Add security values, to operations - that declare their need on them
export function applySecurities({request, securities = {}, operation = {}, spec}) {
  const result = assign({}, request)
  const {authorized = {}, specSecurity = {}} = securities
  const security = operation.security || specSecurity
  const isAuthorized = authorized && !!Object.keys(authorized).length
  const securityDef = spec.securityDefinitions

  result.headers = result.headers || {}
  result.query = result.query || {}

  if (!Object.keys(securities).length || !isAuthorized || !security ||
      (Array.isArray(operation.security) && !operation.security.length)) {
    return request
  }

  security.forEach((securityObj, index) => {
    for (const key in securityObj) {
      const auth = authorized[key]
      if (!auth) {
        continue
      }

      const token = auth.token
      const value = auth.value || auth
      const schema = securityDef[key]
      const {type} = schema
      const accessToken = token && token.access_token
      const tokenType = token && token.token_type

      if (auth) {
        if (type === 'apiKey') {
          const inType = schema.in === 'query' ? 'query' : 'headers'
          result[inType] = result[inType] || {}
          result[inType][schema.name] = value
        }
        else if (type === 'basic') {
          if (value.header) {
            result.headers.authorization = value.header
          }
          else {
            value.base64 = btoa(`${value.username}:${value.password}`)
            result.headers.authorization = `Basic ${value.base64}`
          }
        }
        else if (type === 'oauth2') {
          result.headers.authorization = `${tokenType || 'Bearer'} ${accessToken}`
        }
      }
    }
  })

  return result
}
