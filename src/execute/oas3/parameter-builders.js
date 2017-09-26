import stylize from './style-serializer'

export default {
  path,
  query
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
  else if (parameter.allowEmptyValue) {
    const paramName = parameter.name
    req.query[paramName] = req.query[paramName] || {}
    req.query[paramName].allowEmptyValue = true
  }
}
