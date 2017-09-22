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

function encodeArray({key, value, style, explode}) {
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
      return prev + `,${curr}`
    }, '')
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
}
