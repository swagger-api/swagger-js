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
  if (style === 'simple') {
    return value.join(',')
  }

  if (style === 'label') {
    return `.${value.join('.')}`
  }

  if (style === 'matrix') {
    return value.reduce((prev, curr) => {
      if (!prev || explode) {
        return `${(prev || '')};${key}=${curr}`
      }
      return `${prev},${curr}`
    }, '')
  }

  if (style === 'form') {
    const commaValue = escape ? escapeFn(',') : ','
    const after = explode ? `&${key}=` : commaValue
    return value.join(after)
  }

  if (style === 'spaceDelimited') {
    const after = explode ? `${key}=` : ''
    return value.join(`${escapeFn(' ')}${after}`)
  }

  if (style === 'pipeDelimited') {
    const after = explode ? `${key}=` : ''
    const separator = escape ? escapeFn('|') : '|'
    return value.join(`${separator}${after}`)
  }
}

function encodeObject({key, value, style, explode}) {
  const valueKeys = Object.keys(value)

  if (style === 'simple') {
    return valueKeys.reduce((prev, curr) => {
      const val = value[curr]
      const middleChar = explode ? '=' : ','
      const prefix = prev ? `${prev},` : ''

      return `${prefix}${curr}${middleChar}${val}`
    }, '')
  }

  if (style === 'label') {
    return valueKeys.reduce((prev, curr) => {
      const val = value[curr]
      const middleChar = explode ? '=' : '.'
      const prefix = prev ? `${prev}.` : '.'

      return `${prefix}${curr}${middleChar}${val}`
    }, '')
  }

  if (style === 'matrix' && explode) {
    return valueKeys.reduce((prev, curr) => {
      const val = value[curr]
      const prefix = prev ? `${prev};` : ';'

      return `${prefix}${curr}=${val}`
    }, '')
  }

  if (style === 'matrix') {
    // no explode
    return valueKeys.reduce((prev, curr) => {
      const val = value[curr]
      const prefix = prev ? `${prev},` : `;${key}=`

      return `${prefix}${curr},${val}`
    }, '')
  }

  if (style === 'form') {
    return valueKeys.reduce((prev, curr) => {
      const val = value[curr]
      const prefix = prev ? `${prev}${explode ? '&' : ','}` : ''
      const separator = explode ? '=' : ','

      return `${prefix}${curr}${separator}${val}`
    }, '')
  }
}

function encodePrimitive({key, value, style, explode}) {
  if (style === 'simple') {
    return value
  }

  if (style === 'label') {
    return `.${value}`
  }

  if (style === 'matrix') {
    return `;${key}=${value}`
  }

  if (style === 'form') {
    return value
  }

  if (style === 'deepObject') {
    return value
  }
}
