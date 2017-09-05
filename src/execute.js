import assign from 'lodash/assign'
import getIn from 'lodash/get'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import btoa from 'btoa'
import url from 'url'
import http, {mergeInQueryOrForm} from './http'
import {getOperationRaw, idFromPathMethod, legacyIdFromPathMethod, isOAS3} from './helpers'
import createError from './specmap/lib/create-error'

const arrayOrEmpty = (ar) => {
  return Array.isArray(ar) ? ar : []
}

const OperationNotFoundError = createError('OperationNotFoundError', function (message, extra, oriError) {
  this.originalError = oriError
  Object.assign(this, extra || {})
})

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

  if (pathName && method && !operationId) {
    operationId = legacyIdFromPathMethod(pathName, method)
  }

  const request = self.buildRequest({spec, operationId, parameters, securities, ...extras})

  if (request.body && (isPlainObject(request.body) || isArray(request.body))) {
    request.body = JSON.stringify(request.body)
  }

  // Build request and execute it
  return userHttp(request)
}

// Build a request, which can be handled by the `http.js` implementation.
export function buildRequest({
  spec, operationId, parameters, securities, requestContentType,
  responseContentType, parameterBuilders, scheme,
  requestInterceptor, responseInterceptor, contextUrl, userFetch,
  requestBody, server, serverVariables
}) {
  const specIsOAS3 = isOAS3(spec)

  parameterBuilders = parameterBuilders || PARAMETER_BUILDERS

  // Base Template
  let req = {
    url: baseUrl({spec, scheme, contextUrl, server, serverVariables}),
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
  if (userFetch) {
    req.userFetch = userFetch
  }

  // Mostly for testing
  if (!operationId) {
    return req
  }

  const operationRaw = getOperationRaw(spec, operationId)
  if (!operationRaw) {
    throw new OperationNotFoundError(`Operation ${operationId} not found`)
  }

  const {operation = {}, method, pathName} = operationRaw

  req.url += pathName // Have not yet replaced the path parameters
  req.method = (`${method}`).toUpperCase()

  parameters = parameters || {}
  const path = spec.paths[pathName] || {}

  if (responseContentType) {
    req.headers.accept = responseContentType
  }

  // Add values to request
  arrayOrEmpty(operation.parameters) // operation parameters
    .concat(arrayOrEmpty(path.parameters)) // path parameters
    .forEach((parameter) => {
      const builder = parameterBuilders[parameter.in]
      let value

      // REVIEW: OAS3: have any key names or parameter shapes changed?
      // Any new features that need to be plugged in here?

      if (parameter.in === 'body' && parameter.schema && parameter.schema.properties) {
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
        builder({req, parameter, value, operation, spec, specIsOAS3})
      }
    })

  const requestBodyDef = operation.requestBody || {}
  const requestBodyMediaTypes = Object.keys(requestBodyDef.content || {})

  // for OAS3: set the Content-Type
  if (specIsOAS3 && requestBody) {
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
  if (specIsOAS3 && requestBody) {
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


  // Add securities, which are applicable
  // REVIEW: OAS3: what changed in securities?
  req = applySecurities({request: req, securities, operation, spec})

  if (!specIsOAS3 && (req.body || req.form)) {
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

  // Will add the query object into the URL, if it exists
  // ... will also create a FormData instance, if multipart/form-data (eg: a file)
  mergeInQueryOrForm(req)

  return req
}

// Add the body to the request
export function bodyBuilder({req, value, specIsOAS3}) {
  if (specIsOAS3) {
    return
  }
  req.body = value
}

// Add a form data object.
export function formDataBuilder({req, value, parameter}) {
  // REVIEW: OAS3: check for any parameter changes that affect the builder
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
  // REVIEW: OAS3: check for any parameter changes that affect the builder
  req.headers = req.headers || {}
  if (typeof value !== 'undefined') {
    req.headers[parameter.name] = value
  }
}

// Replace path paramters, with values ( ie: the URL )
export function pathBuilder({req, value, parameter}) {
  // REVIEW: OAS3: check for any parameter changes that affect the builder
  req.url = req.url.replace(`{${parameter.name}}`, encodeURIComponent(value))
}

// Add a query to the `query` object, which will later be stringified into the URL's search
export function queryBuilder({req, value, parameter}) {
  // REVIEW: OAS3: check for any parameter changes that affect the builder
  req.query = req.query || {}

  if (value === false && parameter.type === 'boolean') {
    value = 'false'
  }

  if (value === 0 && ['number', 'integer'].indexOf(parameter.type) > -1) {
    value = '0'
  }

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

export function baseUrl(obj) {
  const specIsOAS3 = isOAS3(obj.spec)

  return specIsOAS3 ? oas3BaseUrl(obj) : swagger2BaseUrl(obj)
}

function oas3BaseUrl({spec, server, serverVariables = {}}) {
  const servers = spec.servers

  let selectedServerUrl = ''
  let selectedServerObj = null

  if (!servers || !Array.isArray(servers)) {
    return ''
  }

  if (server) {
    const serverUrls = servers.map(srv => srv.url)

    if (serverUrls.indexOf(server) > -1) {
      selectedServerUrl = server
      selectedServerObj = servers[serverUrls.indexOf(server)]
    }
  }

  if (!selectedServerUrl) {
    // default to the first server if we don't have one by now
    selectedServerUrl = servers[0].url
    selectedServerObj = servers[0]
  }

  if (selectedServerUrl.indexOf('{') > -1) {
    // do variable substitution
    const varNames = getVariableTemplateNames(selectedServerUrl)
    varNames.forEach((vari) => {
      if (selectedServerObj.variables && selectedServerObj.variables[vari]) {
        // variable is defined in server
        const variableDefinition = selectedServerObj.variables[vari]
        const variableValue = serverVariables[vari] || variableDefinition.default

        const re = new RegExp(`{${vari}}`, 'g')
        selectedServerUrl = selectedServerUrl.replace(re, variableValue)
      }
    })
  }

  return selectedServerUrl
}

function getVariableTemplateNames(str) {
  const results = []
  const re = /{([^}]+)}/g
  let text

  // eslint-ignore-next-line no-cond-assign
  while (text = re.exec(str)) {
    results.push(text[1])
  }
  return results
}

// Compose the baseUrl ( scheme + host + basePath )
function swagger2BaseUrl({spec, scheme, contextUrl = ''}) {
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
        else if (type === 'oauth2') {
          result.headers.authorization = `${tokenType || 'Bearer'} ${accessToken}`
        }
      }
    }
  })

  return result
}
