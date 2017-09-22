import stylize from './oas3-style-serializer'
export default {
  path
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
