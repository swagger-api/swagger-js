const isRfc3986Reserved = (char) => ":/?#[]@!$&'()*+,;=".indexOf(char) > -1;
const isRfc3986Unreserved = (char) => /^[a-z0-9\-._~]+$/i.test(char);

// eslint-disable-next-line default-param-last
export function encodeCharacters(str, characterSet = 'reserved') {
  // In ES6 you can do this quite easily by using the new ... spread operator.
  // This causes the string iterator (another new ES6 feature) to be used internally,
  // and because that iterator is designed to deal with
  // code points rather than UCS-2/UTF-16 code units.
  return [...str]
    .map((char) => {
      if (isRfc3986Unreserved(char)) {
        return char;
      }

      if (isRfc3986Reserved(char) && characterSet === 'unsafe') {
        return char;
      }

      const encoder = new TextEncoder();
      const encoded = Array.from(encoder.encode(char))
        .map((byte) => `0${byte.toString(16).toUpperCase()}`.slice(-2))
        .map((encodedByte) => `%${encodedByte}`)
        .join('');

      return encoded;
    })
    .join('');
}

export default function stylize(config) {
  const { value } = config;

  if (Array.isArray(value)) {
    return encodeArray(config);
  }
  if (typeof value === 'object') {
    return encodeObject(config);
  }
  return encodePrimitive(config);
}

export function valueEncoder(value, escape = false) {
  if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
    value = JSON.stringify(value);
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    value = String(value);
  }

  if (escape && typeof value === 'string' && value.length > 0) {
    return encodeCharacters(value, escape);
  }
  return value ?? '';
}

function encodeArray({ key, value, style, explode, escape }) {
  if (style === 'simple') {
    return value.map((val) => valueEncoder(val, escape)).join(',');
  }

  if (style === 'label') {
    return `.${value.map((val) => valueEncoder(val, escape)).join('.')}`;
  }

  if (style === 'matrix') {
    return value
      .map((val) => valueEncoder(val, escape))
      .reduce((prev, curr) => {
        if (!prev || explode) {
          return `${prev || ''};${key}=${curr}`;
        }
        return `${prev},${curr}`;
      }, '');
  }

  if (style === 'form') {
    const after = explode ? `&${key}=` : ',';
    return value.map((val) => valueEncoder(val, escape)).join(after);
  }

  if (style === 'spaceDelimited') {
    const after = explode ? `${key}=` : '';
    return value.map((val) => valueEncoder(val, escape)).join(` ${after}`);
  }

  if (style === 'pipeDelimited') {
    const after = explode ? `${key}=` : '';
    return value.map((val) => valueEncoder(val, escape)).join(`|${after}`);
  }

  return undefined;
}

function encodeObject({ key, value, style, explode, escape }) {
  const valueKeys = Object.keys(value);

  if (style === 'simple') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr], escape);
      const middleChar = explode ? '=' : ',';
      const prefix = prev ? `${prev},` : '';

      return `${prefix}${curr}${middleChar}${val}`;
    }, '');
  }

  if (style === 'label') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr], escape);
      const middleChar = explode ? '=' : '.';
      const prefix = prev ? `${prev}.` : '.';

      return `${prefix}${curr}${middleChar}${val}`;
    }, '');
  }

  if (style === 'matrix' && explode) {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr], escape);
      const prefix = prev ? `${prev};` : ';';

      return `${prefix}${curr}=${val}`;
    }, '');
  }

  if (style === 'matrix') {
    // no explode
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr], escape);
      const prefix = prev ? `${prev},` : `;${key}=`;

      return `${prefix}${curr},${val}`;
    }, '');
  }

  if (style === 'form') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr], escape);
      const prefix = prev ? `${prev}${explode ? '&' : ','}` : '';
      const separator = explode ? '=' : ',';

      return `${prefix}${curr}${separator}${val}`;
    }, '');
  }

  return undefined;
}

function encodePrimitive({ key, value, style, escape }) {
  if (style === 'simple') {
    return valueEncoder(value, escape);
  }

  if (style === 'label') {
    return `.${valueEncoder(value, escape)}`;
  }

  if (style === 'matrix') {
    return `;${key}=${valueEncoder(value, escape)}`;
  }

  if (style === 'form') {
    return valueEncoder(value, escape);
  }

  if (style === 'deepObject') {
    return valueEncoder(value, escape);
  }

  return undefined;
}
