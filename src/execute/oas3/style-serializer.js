import encodeToRFC3986 from "encode-3986"

export default function (config) {
  const {value} = config

  if (Array.isArray(value)) {
    return encodeArray(config)
  }
  else if (typeof value === 'object') {
    return encodeObject(config)
  }

  return encodePrimitive(config)
}

const escapeFn = str => encodeURIComponent(str)

function encodeArray({key, value, style, explode, escape}) {
  const valueEncoder = escape ? a => encodeToRFC3986(a) : a => a

  if (style === 'simple') {
    return value.map(val => valueEncoder(val)).join(',')
  }

  if (style === 'label') {
    return `.${value.map(val => valueEncoder(val)).join('.')}`
  }

  if (style === 'matrix') {
    return value.map(val => valueEncoder(val)).reduce((prev, curr) => {
      if (!prev || explode) {
        return `${(prev || '')};${key}=${curr}`
      }
      return `${prev},${curr}`
    }, '')
  }

  if (style === 'form') {
    const commaValue = escape ? escapeFn(',') : ','
    const after = explode ? `&${key}=` : commaValue
    return value.map(val => valueEncoder(val)).join(after)
  }

  if (style === 'spaceDelimited') {
    const after = explode ? `${key}=` : ''
    return value.map(val => valueEncoder(val)).join(`${escapeFn(' ')}${after}`)
  }

  if (style === 'pipeDelimited') {
    const after = explode ? `${key}=` : ''
    const separator = escape ? escapeFn('|') : '|'
    return value.map(val => valueEncoder(val)).join(`${separator}${after}`)
  }
}

function encodeObject({key, value, style, explode, escape}) {
  const valueEncoder = escape ? a => encodeToRFC3986(a) : a => a
  const valueKeys = Object.keys(value)

  if (style === 'simple') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr])
      const middleChar = explode ? '=' : ','
      const prefix = prev ? `${prev},` : ''

      return `${prefix}${curr}${middleChar}${val}`
    }, '')
  }

  if (style === 'label') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr])
      const middleChar = explode ? '=' : '.'
      const prefix = prev ? `${prev}.` : '.'

      return `${prefix}${curr}${middleChar}${val}`
    }, '')
  }

  if (style === 'matrix' && explode) {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr])
      const prefix = prev ? `${prev};` : ';'

      return `${prefix}${curr}=${val}`
    }, '')
  }

  if (style === 'matrix') {
    // no explode
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr])
      const prefix = prev ? `${prev},` : `;${key}=`

      return `${prefix}${curr},${val}`
    }, '')
  }

  if (style === 'form') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr])
      const prefix = prev ? `${prev}${explode ? '&' : ','}` : ''
      const separator = explode ? '=' : ','

      return `${prefix}${curr}${separator}${val}`
    }, '')
  }
}

function encodePrimitive({key, value, style, explode, escape}) {
  const valueEncoder = escape ? a => encodeToRFC3986(a) : a => a

  if (style === 'simple') {
    return valueEncoder(value)
  }

  if (style === 'label') {
    return `.${valueEncoder(value)}`
  }

  if (style === 'matrix') {
    return `;${key}=${valueEncoder(value)}`
  }

  if (style === 'form') {
    return valueEncoder(value)
  }

  if (style === 'deepObject') {
    return valueEncoder(value)
  }
}
