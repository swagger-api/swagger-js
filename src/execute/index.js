import assign from 'lodash/assign'
import getIn from 'lodash/get'
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import btoa from 'btoa'
import url from 'url'
import http, {mergeInQueryOrForm} from '../http'
import createError from '../specmap/lib/create-error'

import SWAGGER2_PARAMETER_BUILDERS from './swagger2/parameter-builders'
import OAS3_PARAMETER_BUILDERS from './oas3/parameter-builders'
import oas3BuildRequest from './oas3/build-request'
import swagger2BuildRequest from './swagger2/build-request'
import {
  getOperationRaw,
  idFromPathMethod,
  legacyIdFromPathMethod,
  isOAS3
} from '../helpers'

const arrayOrEmpty = (ar) => {
  return Array.isArray(ar) ? ar : []
}

const OperationNotFoundError = createError('OperationNotFoundError', function (message, extra, oriError) {
  this.originalError = oriError
  Object.assign(this, extra || {})
})

const findParametersWithName = (name, parameters) => {
  return parameters.filter(p => p.name === name)
}

// For stubbing in tests
export const self = {
  buildRequest
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
export function buildRequest(options) {
  const {
    spec,
    operationId,
    securities,
    requestContentType,
    responseContentType,
    scheme,
    requestInterceptor,
    responseInterceptor,
    contextUrl,
    userFetch,
    requestBody,
    server,
    serverVariables
  } = options

  let {
    parameters,
    parameterBuilders
  } = options

  const specIsOAS3 = isOAS3(spec)

  if (!parameterBuilders) {
    // user did not provide custom parameter builders
    if (specIsOAS3) {
      parameterBuilders = OAS3_PARAMETER_BUILDERS
    }
    else {
      parameterBuilders = SWAGGER2_PARAMETER_BUILDERS
    }
  }

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

  const combinedParameters = []
    .concat(arrayOrEmpty(operation.parameters)) // operation parameters
    .concat(arrayOrEmpty(path.parameters)) // path parameters

  // REVIEW: OAS3: have any key names or parameter shapes changed?
  // Any new features that need to be plugged in here?


  // Add values to request
  combinedParameters.forEach((parameter) => {
    const builder = parameterBuilders[parameter.in]
    let value

    if (parameter.in === 'body' && parameter.schema && parameter.schema.properties) {
      value = parameters
    }

    value = parameter && parameter.name && parameters[parameter.name]

    if (typeof value === 'undefined') {
        // check for `name-in` formatted key
      value = parameter && parameter.name && parameters[`${parameter.in}.${parameter.name}`]
    }
    else if (findParametersWithName(parameter.name, combinedParameters).length > 1) {
      // value came from `parameters[parameter.name]`
      // check to see if this is an ambiguous parameter
      // eslint-disable-next-line no-console
      console.warn(`Parameter '${parameter.name}' is ambiguous because the defined spec has more than one parameter with the name: '${parameter.name}' and the passed-in parameter values did not define an 'in' value.`)
    }

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

  // Do version-specific tasks, then return those results.
  const versionSpecificOptions = {...options, operation}

  if (specIsOAS3) {
    req = oas3BuildRequest(versionSpecificOptions, req)
  }
  else {
    // If not OAS3, then treat as Swagger2.
    req = swagger2BuildRequest(versionSpecificOptions, req)
  }

  // Will add the query object into the URL, if it exists
  // ... will also create a FormData instance, if multipart/form-data (eg: a file)
  mergeInQueryOrForm(req)

  return req
}

const stripNonAlpha = str => (str ? str.replace(/\W/g, '') : null)

export function baseUrl(obj) {
  const specIsOAS3 = isOAS3(obj.spec)

  return specIsOAS3 ? oas3BaseUrl(obj) : swagger2BaseUrl(obj)
}

function oas3BaseUrl({spec, server, contextUrl, serverVariables = {}}) {
  const servers = spec.servers

  let selectedServerUrl = ''
  let selectedServerObj = null

  if (server) {
    const serverUrls = servers.map(srv => srv.url)

    if (serverUrls.indexOf(server) > -1) {
      selectedServerUrl = server
      selectedServerObj = servers[serverUrls.indexOf(server)]
    }
  }

  if (!selectedServerUrl && servers) {
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

  return buildOas3UrlWithContext(selectedServerUrl, contextUrl)
}

function buildOas3UrlWithContext(ourUrl = '', contextUrl = '') {
  const parsedUrl = url.parse(ourUrl)
  const parsedContextUrl = url.parse(contextUrl)

  const computedScheme = stripNonAlpha(parsedUrl.protocol) || stripNonAlpha(parsedContextUrl.protocol) || ''
  const computedHost = parsedUrl.host || parsedContextUrl.host
  const computedPath = parsedUrl.pathname || ''

  if (computedScheme && computedHost) {
    const res = `${computedScheme}://${computedHost + computedPath}`

    // If last character is '/', trim it off
    return res[res.length - 1] === '/' ? res.slice(0, -1) : res
  }

  return ''
}

function getVariableTemplateNames(str) {
  const results = []
  const re = /{([^}]+)}/g
  let text

  // eslint-disable-next-line no-cond-assign
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
