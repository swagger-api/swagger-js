import stylize from './style-serializer'

export default {
  path,
  query,
  header,
  cookie
}

function path({req, value, parameter}) {
  const {name, style, explode} = parameter
  const styledValue = stylize({
    key: parameter.name,
    value,
    style: style || 'simple',
    explode: explode || false,
    escape: !parameter.allowReserved,
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
      valueKeys.forEach((k) => {
        const v = value[k]
        req.query[`${parameter.name}[${k}]`] = {
          value: stylize({
            key: k,
            value: v,
            style: 'deepObject',
            escape: !parameter.allowReserved,
          }),
          skipEncoding: true
        }
      })
    }
    else if (
      type === 'object' &&
      !Array.isArray(value) &&
      (parameter.style === 'form' || !parameter.style) &&
      (parameter.explode || parameter.explode === undefined)
    ) {
      // form explode needs to be handled here,
      // since we aren't assigning to `req.query[parameter.name]`
      // like we usually do.
      const valueKeys = Object.keys(value)
      valueKeys.forEach((k) => {
        const v = value[k]
        req.query[k] = {
          value: stylize({
            key: k,
            value: v,
            style: parameter.style || 'form',
            escape: !parameter.allowReserved,
          })
        }
      })
    }
    else {
      req.query[parameter.name] = {
        value: stylize({
          key: parameter.name,
          value,
          style: parameter.style || 'form',
          explode: typeof parameter.explode === 'undefined' ? true : parameter.explode,
          escape: !parameter.allowReserved,
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
      explode: typeof parameter.explode === 'undefined' ? false : parameter.explode,
      escape: !parameter.allowReserved,
    })
  }
}

function cookie({req, parameter, value}) {
  req.headers = req.headers || {}
  const type = typeof value

  if (type !== 'undefined') {
    const prefix = (
      type === 'object' &&
      !Array.isArray(value) &&
      parameter.explode
    ) ? '' : `${parameter.name}=`

    req.headers.Cookie = prefix + stylize({
      key: parameter.name,
      value,
      escape: false,
      style: parameter.style || 'form',
      explode: typeof parameter.explode === 'undefined' ? false : parameter.explode
    })
  }
}
