import stylize, {encodeDisallowedCharacters} from './style-serializer'
import serialize from './content-serializer'

export function path({req, value, parameter}) {
  const {name, style, explode, content} = parameter

  if (content) {
    const effectiveMediaType = Object.keys(content)[0]

    req.url = req.url.split(`{${name}}`).join(
      encodeDisallowedCharacters(
        serialize(value, effectiveMediaType),
        {escape: true}
      )
    )
    return
  }

  const styledValue = stylize({
    key: parameter.name,
    value,
    style: style || 'simple',
    explode: explode || false,
    escape: true,
  })

  req.url = req.url.split(`{${name}}`).join(styledValue)
}

function flattenForDeepObject(object) {
  return Object.assign({}, ...(function _flatten(objectBit, prev = '') {
    return [].concat(
      ...Object.keys(objectBit).map(
        key => ((typeof objectBit[key] === 'object' && objectBit[key] !== null) ?
          _flatten(objectBit[key], `${prev}[${key}]`) :
          ({[`${prev}[${key}]`]: objectBit[key]}))
      )
    )
  }(object)))
}

export function query({req, value, parameter}) {
  req.query = req.query || {}

  if (parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0]

    req.query[parameter.name] = serialize(value, effectiveMediaType)
    return
  }

  if (value === false) {
    value = 'false'
  }

  if (value === 0) {
    value = '0'
  }

  if (value) {
    const type = typeof value

    if (parameter.style === 'deepObject') {
      const parsedObj = flattenForDeepObject(value)
      Object.keys(parsedObj).forEach((k) => {
        const v = parsedObj[k]
        if (v !== null && v !== undefined) {
          req.query[`${parameter.name}${k}`] = {
            value: stylize({
              key: k,
              value: v,
              style: 'deepObject',
              escape: parameter.allowReserved ? 'unsafe' : 'reserved',
            }),
            skipEncoding: true
          }
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
            escape: parameter.allowReserved ? 'unsafe' : 'reserved',
          }),
          skipEncoding: true
        }
      })
    }
    else {
      const encodedParamName = encodeURIComponent(parameter.name)
      req.query[encodedParamName] = {
        value: stylize({
          key: encodedParamName,
          value,
          style: parameter.style || 'form',
          explode: typeof parameter.explode === 'undefined' ? true : parameter.explode,
          escape: parameter.allowReserved ? 'unsafe' : 'reserved',
        }),
        skipEncoding: true
      }
    }
  }
  else if (parameter.allowEmptyValue && value !== undefined) {
    const paramName = parameter.name
    req.query[paramName] = req.query[paramName] || {}
    req.query[paramName].allowEmptyValue = true
  }
}

const PARAMETER_HEADER_BLACKLIST = [
  'accept',
  'authorization',
  'content-type'
]

export function header({req, parameter, value}) {
  req.headers = req.headers || {}

  if (PARAMETER_HEADER_BLACKLIST.indexOf(parameter.name.toLowerCase()) > -1) {
    return
  }

  if (parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0]

    req.headers[parameter.name] = serialize(value, effectiveMediaType)
    return
  }

  if (typeof value !== 'undefined') {
    req.headers[parameter.name] = stylize({
      key: parameter.name,
      value,
      style: parameter.style || 'simple',
      explode: typeof parameter.explode === 'undefined' ? false : parameter.explode,
      escape: false,
    })
  }
}

export function cookie({req, parameter, value}) {
  req.headers = req.headers || {}
  const type = typeof value

  if (parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0]

    req.headers.Cookie = `${parameter.name}=${serialize(value, effectiveMediaType)}`
    return
  }

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
