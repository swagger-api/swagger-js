// This function runs after the common function,
// `src/execute/index.js#buildRequest`

export default function (options, req) {
  const {
    operation,
    requestBody
  } = options

  let {
    requestContentType
  } = options

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
