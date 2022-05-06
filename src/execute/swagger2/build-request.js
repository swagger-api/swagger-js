import btoa from '../../helpers/btoa.node.js';

// This function runs after the common function,
// `src/execute/index.js#buildRequest`
export default function buildRequest(options, req) {
  const {
    spec,
    operation,
    securities,
    requestContentType,
    responseContentType,
    attachContentTypeForEmptyPayload,
  } = options;
  // Add securities, which are applicable
  req = applySecurities({
    request: req,
    securities,
    operation,
    spec,
  });

  if (req.body || req.form || attachContentTypeForEmptyPayload) {
    // all following conditionals are Swagger2 only
    if (requestContentType) {
      req.headers['Content-Type'] = requestContentType;
    } else if (Array.isArray(operation.consumes)) {
      [req.headers['Content-Type']] = operation.consumes;
    } else if (Array.isArray(spec.consumes)) {
      [req.headers['Content-Type']] = spec.consumes;
    } else if (
      operation.parameters &&
      operation.parameters.filter((p) => p.type === 'file').length
    ) {
      req.headers['Content-Type'] = 'multipart/form-data';
    } else if (
      operation.parameters &&
      operation.parameters.filter((p) => p.in === 'formData').length
    ) {
      req.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  } else if (requestContentType) {
    const isBodyParamPresent =
      operation.parameters && operation.parameters.filter((p) => p.in === 'body').length > 0;
    const isFormDataParamPresent =
      operation.parameters && operation.parameters.filter((p) => p.in === 'formData').length > 0;
    if (isBodyParamPresent || isFormDataParamPresent) {
      req.headers['Content-Type'] = requestContentType;
    }
  }
  if (!responseContentType && Array.isArray(operation.produces) && operation.produces.length > 0) {
    req.headers.accept = operation.produces.join(', ');
  }

  return req;
}

// Add security values, to operations - that declare their need on them
export function applySecurities({ request, securities = {}, operation = {}, spec }) {
  const result = { ...request };
  const { authorized = {}, specSecurity = [] } = securities;
  const security = operation.security || specSecurity;
  const isAuthorized = authorized && !!Object.keys(authorized).length;
  const securityDef = spec.securityDefinitions;

  result.headers = result.headers || {};
  result.query = result.query || {};

  if (
    !Object.keys(securities).length ||
    !isAuthorized ||
    !security ||
    (Array.isArray(operation.security) && !operation.security.length)
  ) {
    return request;
  }

  security.forEach((securityObj) => {
    Object.keys(securityObj).forEach((key) => {
      const auth = authorized[key];
      if (!auth) {
        return;
      }

      const { token } = auth;
      const value = auth.value || auth;
      const schema = securityDef[key];
      const { type } = schema;
      const tokenName = schema['x-tokenName'] || 'access_token';
      const oauthToken = token && token[tokenName];
      let tokenType = token && token.token_type;

      if (auth) {
        if (type === 'apiKey') {
          const inType = schema.in === 'query' ? 'query' : 'headers';
          result[inType] = result[inType] || {};
          result[inType][schema.name] = value;
        } else if (type === 'basic') {
          if (value.header) {
            result.headers.authorization = value.header;
          } else {
            const username = value.username || '';
            const password = value.password || '';
            value.base64 = btoa(`${username}:${password}`);
            result.headers.authorization = `Basic ${value.base64}`;
          }
        } else if (type === 'oauth2' && oauthToken) {
          tokenType = !tokenType || tokenType.toLowerCase() === 'bearer' ? 'Bearer' : tokenType;
          result.headers.authorization = `${tokenType} ${oauthToken}`;
        }
      }
    });
  });

  return result;
}
