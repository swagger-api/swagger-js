import cookie from 'cookie';
import { identity } from 'ramda';
import { isPlainObject } from 'ramda-adjunct';
import {
  test as testServerURLTemplate,
  substitute as substituteServerURLTemplate,
} from 'openapi-server-url-templating';
import { ApiDOMStructuredError } from '@swagger-api/apidom-error';
import { url } from '@swagger-api/apidom-reference/configuration/empty';

import { DEFAULT_BASE_URL, DEFAULT_OPENAPI_3_SERVER } from '../constants.js';
import stockHttp from '../http/index.js';
import { serializeRequest } from '../http/serializers/request/index.js';
import SWAGGER2_PARAMETER_BUILDERS from './swagger2/parameter-builders.js';
import * as OAS3_PARAMETER_BUILDERS from './oas3/parameter-builders.js';
import oas3BuildRequest from './oas3/build-request.js';
import swagger2BuildRequest from './swagger2/build-request.js';
import { getOperationRaw, idFromPathMethodLegacy } from '../helpers/index.js';
import { isOpenAPI3 } from '../helpers/openapi-predicates.js';

const arrayOrEmpty = (ar) => (Array.isArray(ar) ? ar : []);

/**
 * `parseURIReference` function simulates the behavior of `node:url` parse function.
 * New WHATWG URL API is not capable of parsing relative references natively,
 * but can be adapter by utilizing the `base` parameter.
 */
const parseURIReference = (uriReference) => {
  try {
    return new URL(uriReference);
  } catch {
    const parsedURL = new URL(uriReference, DEFAULT_BASE_URL);
    const pathname = String(uriReference).startsWith('/')
      ? parsedURL.pathname
      : parsedURL.pathname.substring(1);

    return {
      hash: parsedURL.hash,
      host: '',
      hostname: '',
      href: '',
      origin: '',
      password: '',
      pathname,
      port: '',
      protocol: '',
      search: parsedURL.search,
      searchParams: parsedURL.searchParams,
    };
  }
};

class OperationNotFoundError extends ApiDOMStructuredError {}

const findParametersWithName = (name, parameters) => parameters.filter((p) => p.name === name);

// removes parameters that have duplicate 'in' and 'name' properties
const deduplicateParameters = (parameters) => {
  const paramsMap = {};
  parameters.forEach((p) => {
    if (!paramsMap[p.in]) {
      paramsMap[p.in] = {};
    }
    paramsMap[p.in][p.name] = p;
  });

  const dedupedParameters = [];
  Object.keys(paramsMap).forEach((i) => {
    Object.keys(paramsMap[i]).forEach((p) => {
      dedupedParameters.push(paramsMap[i][p]);
    });
  });
  return dedupedParameters;
};

// For stubbing in tests
export const self = {
  buildRequest,
};

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
  const http = userHttp || fetch || stockHttp; // Default to _our_ http

  if (pathName && method && !operationId) {
    operationId = idFromPathMethodLegacy(pathName, method);
  }

  const request = self.buildRequest({
    spec,
    operationId,
    parameters,
    securities,
    http,
    ...extras,
  });

  if (request.body && (isPlainObject(request.body) || Array.isArray(request.body))) {
    request.body = JSON.stringify(request.body);
  }

  // Build request and execute it
  return http(request);
}

// Build a request, which can be handled by the `http.js` implementation.
export function buildRequest(options) {
  const {
    spec,
    operationId,
    responseContentType,
    scheme,
    requestInterceptor,
    responseInterceptor,
    contextUrl,
    userFetch,
    server,
    serverVariables,
    http,
    signal,
    serverVariableEncoder,
  } = options;

  let { parameters, parameterBuilders } = options;

  const specIsOAS3 = isOpenAPI3(spec);
  if (!parameterBuilders) {
    // user did not provide custom parameter builders
    if (specIsOAS3) {
      parameterBuilders = OAS3_PARAMETER_BUILDERS;
    } else {
      parameterBuilders = SWAGGER2_PARAMETER_BUILDERS;
    }
  }

  // Set credentials with 'http.withCredentials' value
  const credentials = http && http.withCredentials ? 'include' : 'same-origin';

  // Base Template
  let req = {
    url: '',
    credentials,
    headers: {},
    cookies: {},
  };

  if (signal) {
    req.signal = signal;
  }

  if (requestInterceptor) {
    req.requestInterceptor = requestInterceptor;
  }
  if (responseInterceptor) {
    req.responseInterceptor = responseInterceptor;
  }
  if (userFetch) {
    req.userFetch = userFetch;
  }

  const operationRaw = getOperationRaw(spec, operationId);
  if (!operationRaw) {
    throw new OperationNotFoundError(`Operation ${operationId} not found`);
  }

  const { operation = {}, method, pathName } = operationRaw;

  const baseURL = baseUrl({
    spec,
    scheme,
    contextUrl,
    server,
    serverVariables,
    pathName,
    method,
    serverVariableEncoder,
  });

  req.url += baseURL;

  // Mostly for testing
  if (!operationId) {
    // Not removing req.cookies causes testing issues and would
    // change our interface, so we're always sure to remove it.
    // See the same statement lower down in this function for
    // more context.
    delete req.cookies;
    return req;
  }

  req.url += pathName; // Have not yet replaced the path parameters
  req.method = `${method}`.toUpperCase();

  parameters = parameters || {};
  const path = spec.paths[pathName] || {};

  if (responseContentType) {
    req.headers.accept = responseContentType;
  }

  const combinedParameters = deduplicateParameters(
    []
      .concat(arrayOrEmpty(operation.parameters)) // operation parameters
      .concat(arrayOrEmpty(path.parameters))
  ); // path parameters

  // REVIEW: OAS3: have any key names or parameter shapes changed?
  // Any new features that need to be plugged in here?

  // Add values to request
  combinedParameters.forEach((parameter) => {
    const builder = parameterBuilders[parameter.in];
    let value;

    if (parameter.in === 'body' && parameter.schema && parameter.schema.properties) {
      value = parameters;
    }

    value = parameter && parameter.name && parameters[parameter.name];

    if (typeof value === 'undefined') {
      // check for `name-in` formatted key
      value = parameter && parameter.name && parameters[`${parameter.in}.${parameter.name}`];
    } else if (findParametersWithName(parameter.name, combinedParameters).length > 1) {
      // value came from `parameters[parameter.name]`
      // check to see if this is an ambiguous parameter
      // eslint-disable-next-line no-console
      console.warn(
        `Parameter '${parameter.name}' is ambiguous because the defined spec has more than one parameter with the name: '${parameter.name}' and the passed-in parameter values did not define an 'in' value.`
      );
    }

    if (value === null) {
      return;
    }

    if (typeof parameter.default !== 'undefined' && typeof value === 'undefined') {
      value = parameter.default;
    }

    if (typeof value === 'undefined' && parameter.required && !parameter.allowEmptyValue) {
      throw new Error(`Required parameter ${parameter.name} is not provided`);
    }

    if (
      specIsOAS3 &&
      parameter.schema &&
      parameter.schema.type === 'object' &&
      typeof value === 'string'
    ) {
      try {
        value = JSON.parse(value);
      } catch (e) {
        throw new Error('Could not parse object parameter value string as JSON');
      }
    }

    if (builder) {
      builder({
        req,
        parameter,
        value,
        operation,
        spec,
        baseURL,
      });
    }
  });

  // Do version-specific tasks, then return those results.
  const versionSpecificOptions = { ...options, operation };

  if (specIsOAS3) {
    req = oas3BuildRequest(versionSpecificOptions, req);
  } else {
    // If not OAS3, then treat as Swagger2.
    req = swagger2BuildRequest(versionSpecificOptions, req);
  }

  // If the cookie convenience object exists in our request,
  // serialize its content and then delete the cookie object.
  if (req.cookies && Object.keys(req.cookies).length) {
    const cookieString = Object.keys(req.cookies).reduce((prev, cookieName) => {
      const cookieValue = req.cookies[cookieName];
      const prefix = prev ? '&' : '';
      const stringified = cookie.serialize(cookieName, cookieValue);
      return prev + prefix + stringified;
    }, '');
    req.headers.Cookie = cookieString;
  }

  if (req.cookies) {
    // even if no cookies were defined, we need to remove
    // the cookies key from our request, or many legacy
    // tests will break.
    delete req.cookies;
  }

  // Will add the query object into the URL, if it exists
  // ... will also create a FormData instance, if multipart/form-data (eg: a file)
  return serializeRequest(req);
}

const stripNonAlpha = (str) => (str ? str.replace(/\W/g, '') : null);

// be careful when modifying this! it is a publicly-exposed method.
export function baseUrl(obj) {
  const specIsOAS3 = isOpenAPI3(obj.spec);

  return specIsOAS3 ? oas3BaseUrl(obj) : swagger2BaseUrl(obj);
}

const isNonEmptyServerList = (value) => Array.isArray(value) && value.length > 0;

function oas3BaseUrl({
  spec,
  pathName,
  method,
  server,
  contextUrl,
  serverVariables = {},
  serverVariableEncoder,
}) {
  let servers = [];
  let selectedServerUrl = '';
  let selectedServerObj;

  // compute the servers (this will be taken care of by ApiDOM refrator plugins in future
  const operationLevelServers = spec?.paths?.[pathName]?.[(method || '').toLowerCase()]?.servers;
  const pathItemLevelServers = spec?.paths?.[pathName]?.servers;
  const rootLevelServers = spec?.servers;
  servers = isNonEmptyServerList(operationLevelServers) // eslint-disable-line no-nested-ternary
    ? operationLevelServers
    : isNonEmptyServerList(pathItemLevelServers) // eslint-disable-line no-nested-ternary
      ? pathItemLevelServers
      : isNonEmptyServerList(rootLevelServers)
        ? rootLevelServers
        : [DEFAULT_OPENAPI_3_SERVER];

  // pick the first server that matches the server url
  if (server) {
    selectedServerObj = servers.find((srv) => srv.url === server);
    if (selectedServerObj) selectedServerUrl = server;
  }

  // default to the first server if we don't have one by now
  if (!selectedServerUrl) {
    [selectedServerObj] = servers;
    selectedServerUrl = selectedServerObj.url;
  }

  if (testServerURLTemplate(selectedServerUrl, { strict: true })) {
    const selectedServerVariables = Object.entries({ ...selectedServerObj.variables }).reduce(
      (acc, [serverVariableName, serverVariable]) => {
        acc[serverVariableName] = serverVariable.default;
        return acc;
      },
      {}
    );

    selectedServerUrl = substituteServerURLTemplate(
      selectedServerUrl,
      {
        ...selectedServerVariables,
        ...serverVariables,
      },
      { encoder: typeof serverVariableEncoder === 'function' ? serverVariableEncoder : identity }
    );
  }

  return buildOas3UrlWithContext(selectedServerUrl, contextUrl);
}

function buildOas3UrlWithContext(ourUrl = '', contextUrl = '') {
  // relative server url should be resolved against contextUrl
  const parsedUrl =
    ourUrl && contextUrl
      ? parseURIReference(url.resolve(contextUrl, ourUrl))
      : parseURIReference(ourUrl);
  const parsedContextUrl = parseURIReference(contextUrl);

  const computedScheme =
    stripNonAlpha(parsedUrl.protocol) || stripNonAlpha(parsedContextUrl.protocol);
  const computedHost = parsedUrl.host || parsedContextUrl.host;
  const computedPath = parsedUrl.pathname;
  let res;

  if (computedScheme && computedHost) {
    res = `${computedScheme}://${computedHost + computedPath}`;

    // if last character is '/', trim it off
  } else {
    res = computedPath;
  }

  return res[res.length - 1] === '/' ? res.slice(0, -1) : res;
}

// Compose the baseUrl ( scheme + host + basePath )
function swagger2BaseUrl({ spec, scheme, contextUrl = '' }) {
  const parsedContextUrl = parseURIReference(contextUrl);
  const firstSchemeInSpec = Array.isArray(spec.schemes) ? spec.schemes[0] : null;

  const computedScheme =
    scheme || firstSchemeInSpec || stripNonAlpha(parsedContextUrl.protocol) || 'http';
  const computedHost = spec.host || parsedContextUrl.host || '';
  const computedPath = spec.basePath || '';
  let res;

  if (computedScheme && computedHost) {
    // we have what we need for an absolute URL
    res = `${computedScheme}://${computedHost + computedPath}`;
  } else {
    // if not, a relative URL will have to do
    res = computedPath;
  }

  // If last character is '/', trim it off
  return res[res.length - 1] === '/' ? res.slice(0, -1) : res;
}
