import stylize from './style-serializer'

export default {
  path,
  query,
  header
}

function path({req, value, parameter}) {
  const {name, style, explode} = parameter
  const styledValue = stylize({
    key: parameter.name,
    value,
    style: style || 'simple',
    explode: explode || false,
  })

  req.url = req.url.replace(`{${name}}`, styledValue)
}

function query({req, value, parameter}) {
  req.query = req.query || {}

  if (value === false) {
    value = 'false'
  }

  if (value === 0) {
    value = '0'
  }

  if (value) {
    const type = typeof value

    if (parameter.style === 'deepObject') {
      const valueKeys = Object.keys(value)
      valueKeys.forEach(k => {
        const v = value[k]
        req.query[`${parameter.name}[${k}]`] = {
          value: stylize({
            key: k,
            value: v,
            style: 'deepObject'
          }),
          skipEncoding: true
        }
      })
    }
    else if (
      type === "object" &&
      !Array.isArray(value) &&
      (parameter.style === 'form' || !parameter.style) &&
      (parameter.explode || parameter.explode === undefined)
    ) {
      // form explode needs to be handled here,
      // since we aren't assigning to `req.query[parameter.name]`
      // like we usually do.
      const valueKeys = Object.keys(value)
      valueKeys.forEach(k => {
        const v = value[k]
        req.query[k] = {
          value: stylize({
            key: k,
            value: v,
            style: parameter.style || 'form'
          })
        }
      })
    } else {
      req.query[parameter.name] = {
        value: stylize({
          key: parameter.name,
          value,
          style: parameter.style || 'form',
          explode: typeof parameter.explode === 'undefined' ? true : parameter.explode
        }),
        skipEncoding: true
      }
    }
  }
  else if (parameter.allowEmptyValue) {
    const paramName = parameter.name
    req.query[paramName] = req.query[paramName] || {}
    req.query[paramName].allowEmptyValue = true
  }
}

function header({req, parameter, value}) {
  req.headers = req.headers || {}
  if (typeof value !== 'undefined') {
    req.headers[parameter.name] = stylize({
      key: parameter.name,
      value,
      style: parameter.style || 'simple',
      explode: typeof parameter.explode === 'undefined' ? false : parameter.explode
    })
  }
}
