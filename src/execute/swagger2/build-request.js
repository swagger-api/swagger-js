// This function runs after the common function,
// `src/execute/index.js#buildRequest`

import btoa from 'btoa'
import assign from 'lodash/assign'
import http, {mergeInQueryOrForm} from '../../http'


export default function (options, req) {
  const {
    spec,
    operation,
    securities,
    requestContentType
  } = options
  // Add securities, which are applicable
  req = applySecurities({request: req, securities, operation, spec})

  if (req.body || req.form) {
    // all following conditionals are Swagger2 only
    if (requestContentType) {
      req.headers['Content-Type'] = requestContentType
    }
    else if (Array.isArray(operation.consumes)) {
      req.headers['Content-Type'] = operation.consumes[0]
    }
    else if (Array.isArray(spec.consumes)) {
      req.headers['Content-Type'] = spec.consumes[0]
    }
    else if (operation.parameters && operation.parameters.filter(p => p.type === 'file').length) {
      req.headers['Content-Type'] = 'multipart/form-data'
    }
    else if (operation.parameters && operation.parameters.filter(p => p.in === 'formData').length) {
      req.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }
  }

  return req
}

// Add security values, to operations - that declare their need on them
export function applySecurities({request, securities = {}, operation = {}, spec}) {
  const result = assign({}, request)
  const {authorized = {}, specSecurity = []} = securities
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
        else if (type === 'oauth2' && accessToken) {
          result.headers.authorization = `${tokenType || 'Bearer'} ${accessToken}`
        }
      }
    }
  })

  return result
}
