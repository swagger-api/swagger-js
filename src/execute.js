import assign from 'lodash/assign'
import getIn from 'lodash/get'
import btoa from 'btoa'
import url from 'url'
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
  http: userHttp,
  fetch, // This is legacy
  spec,
  operationId,
  pathName,
  method,
  parameters,
  securities,
  ...extras
}) {
  // Provide default fetch implementation
  userHttp = userHttp || fetch || http // Default to _our_ http

  // Prefer pathName/method if it exists
  if (pathName && method) {
    operationId = idFromPathMethod(pathName, method)
  }

  const request = self.buildRequest({spec, operationId, parameters, securities, ...extras})

  // Build request and execute it
  return userHttp(request)
}

// Build a request, which can be handled by the `http.js` implementation.
export function buildRequest({
  spec, operationId, parameters, securities, requestContentType,
  responseContentType, parameterBuilders, scheme,
  requestInterceptor, responseInterceptor, contextUrl
}) {
  parameterBuilders = parameterBuilders || PARAMETER_BUILDERS

  // Base Template
  let req = {
    url: baseUrl({spec, scheme, contextUrl}),
    credentials: 'same-origin',
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

  if (req.body || req.form) {
    if (requestContentType) {
      req.headers['content-type'] = requestContentType
    } else if (Array.isArray(operation.consumes)) {
      req.headers['content-type'] = operation.consumes[0]
    } else if (Array.isArray(spec.consumes)) {
      req.headers['content-type'] = spec.consumes[0]
    } else if (operation.parameters.filter((p)=> p.type === "file").length) {
      req.headers['content-type'] = "multipart/form-data"
    } else if (operation.parameters.filter((p)=> p.in === "formData").length) {
      req.headers['content-type'] = "application/x-www-form-urlencoded"
    }
  }
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
  if (typeof value !== 'undefined') {
    req.headers[parameter.name] = value
  }
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

const stripNonAlpha = str => (str ? str.replace(/\W/g, '') : null)

// Compose the baseUrl ( scheme + host + basePath )
export function baseUrl({spec, scheme, contextUrl = ''}) {
  const parsedContextUrl = url.parse(contextUrl)
  const firstSchemeInSpec = Array.isArray(spec.schemes) ? spec.schemes[0] : null

  const computedScheme = scheme || firstSchemeInSpec || stripNonAlpha(parsedContextUrl.protocol) || 'http'
  const computedHost = spec.host || parsedContextUrl.host || ''
  const computedPath = spec.basePath || ''

  if (computedScheme && computedHost) {
    const res = `${computedScheme}://${computedHost + computedPath}`

    // If last character is '/', trim it off
    return res[res.length - 1] === '/' ? res.slice(0, -1) : res
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
