import encodeToRFC3986 from 'encode-3986'
const isRfc3986Reserved = char => ':/?#[]@!$&\'()*+,;='.indexOf(char) > -1
const isRrc3986Unreserved = (char) => {
  return (/^[a-z0-9\-._~]+$/i).test(char)
}

// use global escape
// call it escapeFn so it doesn't interfere with the escape flag in
// the encode fns, and so it isn't coupled to a builtin.
const escapeFn = str => escape(str)

function encodeDisallowedCharacters(str, {allowReserved}) {
  if (typeof str === 'number') {
    str = str.toString()
  }
  if (typeof str !== 'string' || !str.length) {
    return str
  }

  return str.split('').map((char) => {
    if (isRrc3986Unreserved(char)) {
      return char
    }

    if (isRfc3986Reserved(char) && allowReserved) {
      return char
    }

    // percent-encode: char -> ASCII code point num -> hex string -> upcase
    return `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  }).join('')
}

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

function encodeArray({key, value, style, explode, escape}) {
  const valueEncoder = str => encodeDisallowedCharacters(str, {
    allowReserved: escape
  })

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
  const valueEncoder = str => encodeDisallowedCharacters(str, {
    allowReserved: escape
  })

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
  const valueEncoder = str => encodeDisallowedCharacters(str, {
    allowReserved: !escape
  })

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
