import encodeToRFC3986 from 'encode-3986'
import toUTF8Bytes from 'utf8-bytes'
import {stringToCharArray} from 'utfstring'

const isRfc3986Reserved = char => ':/?#[]@!$&\'()*+,;='.indexOf(char) > -1
const isRrc3986Unreserved = (char) => {
  return (/^[a-z0-9\-._~]+$/i).test(char)
}

export function encodeDisallowedCharacters(str, {escape} = {}, parse) {
  if (typeof str === 'number') {
    str = str.toString()
  }
  if (typeof str !== 'string' || !str.length) {
    return str
  }

  if (!escape) {
    return str
  }

  if (parse) {
    return JSON.parse(str)
  }

  return stringToCharArray(str).map((char) => {
    if (isRrc3986Unreserved(char)) {
      return char
    }

    if (isRfc3986Reserved(char) && escape === 'unsafe') {
      return char
    }

    const encoded = (toUTF8Bytes(char) || [])
      .map(byte => `0${byte.toString(16).toUpperCase()}`.slice(-2))
      .map(encodedByte => `%${encodedByte}`)
      .join('')

    return encoded
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
    escape
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
    const after = explode ? `&${key}=` : ','
    return value.map(val => valueEncoder(val)).join(after)
  }

  if (style === 'spaceDelimited') {
    const after = explode ? `${key}=` : ''
    return value.map(val => valueEncoder(val)).join(` ${after}`)
  }

  if (style === 'pipeDelimited') {
    const after = explode ? `${key}=` : ''
    return value.map(val => valueEncoder(val)).join(`|${after}`)
  }
}

function encodeObject({key, value, style, explode, escape}) {
  const valueEncoder = str => encodeDisallowedCharacters(str, {
    escape
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

function encodePrimitive({key, value, style, escape}) {
  const valueEncoder = str => encodeDisallowedCharacters(str, {
    escape
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
    return valueEncoder(value, {}, true)
  }
}
