// This function runs after the common function,
// `src/execute/index.js#buildRequest`
import assign from 'lodash/assign'
import btoa from 'btoa'

export default function (options, req) {
  const {
    operation,
    requestBody,
    securities,
    spec
  } = options

  let {
    requestContentType
  } = options

  req = applySecurities({request: req, securities, operation, spec})

  const requestBodyDef = operation.requestBody || {}
  const requestBodyMediaTypes = Object.keys(requestBodyDef.content || {})

  // for OAS3: set the Content-Type
  if (requestBody) {
    // does the passed requestContentType appear in the requestBody definition?
    const isExplicitContentTypeValid = requestContentType
      && requestBodyMediaTypes.indexOf(requestContentType) > -1

    if (requestContentType && isExplicitContentTypeValid) {
      req.headers['Content-Type'] = requestContentType
    }
    else if (!requestContentType) {
      const firstMediaType = requestBodyMediaTypes[0]
      if (firstMediaType) {
        req.headers['Content-Type'] = firstMediaType
        requestContentType = firstMediaType
      }
    }
  }

  // for OAS3: add requestBody to request
  if (requestBody) {
    if (requestContentType) {
      if (requestBodyMediaTypes.indexOf(requestContentType) > -1) {
        // only attach body if the requestBody has a definition for the
        // contentType that has been explicitly set
        if (requestContentType === 'application/x-www-form-urlencoded') {
          if (typeof requestBody === 'object') {
            req.form = {}
            Object.keys(requestBody).forEach((k) => {
              const val = requestBody[k]
              req.form[k] = {
                value: val
              }
            })
          }
          else {
            req.form = requestBody
          }
        }
        else {
          req.body = requestBody
        }
      }
    }
    else {
      req.body = requestBody
    }
  }

  return req
}

// Add security values, to operations - that declare their need on them
// Adapted from the Swagger2 implementation
export function applySecurities({request, securities = {}, operation = {}, spec}) {
  console.log({
    securities, operation
  })
  const result = assign({}, request)
  const {authorized = {}, specSecurity = []} = securities
  const security = operation.security || specSecurity
  const isAuthorized = authorized && !!Object.keys(authorized).length
  const securityDef = (spec.components || {}).securitySchemes || {}

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
        else if (type === 'oauth2' && accessToken) {
          result.headers.Authorization = `${tokenType || 'Bearer'} ${accessToken}`
        }
      }
    }
  })

  return result
}
