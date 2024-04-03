const isRfc3986Reserved = (char) => ":/?#[]@!$&'()*+,;=".indexOf(char) > -1;
const isRrc3986Unreserved = (char) => /^[a-z0-9\-._~]+$/i.test(char);

// eslint-disable-next-line default-param-last
export function encodeDisallowedCharacters(str, { escape } = {}, parse) {
  if (typeof str === 'number') {
    str = str.toString();
  }

  if (str !== null && typeof str === 'object' && !Array.isArray(str)) {
    str = JSON.stringify(str);
  }

  if (typeof str !== 'string' || !str.length) {
    return str;
  }

  if (!escape) {
    return str;
  }

  if (parse) {
    return JSON.parse(str);
  }

  // In ES6 you can do this quite easily by using the new ... spread operator.
  // This causes the string iterator (another new ES6 feature) to be used internally,
  // and because that iterator is designed to deal with
  // code points rather than UCS-2/UTF-16 code units.
  return [...str]
    .map((char) => {
      if (isRrc3986Unreserved(char)) {
        return char;
      }

      if (isRfc3986Reserved(char) && escape === 'unsafe') {
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

function encodeArray({ key, value, style, explode, escape }) {
  const valueEncoder = (str) =>
    encodeDisallowedCharacters(str, {
      escape,
    });

  if (style === 'simple') {
    return value.map((val) => valueEncoder(val)).join(',');
  }

  if (style === 'label') {
    return `.${value.map((val) => valueEncoder(val)).join('.')}`;
  }

  if (style === 'matrix') {
    return value
      .map((val) => valueEncoder(val))
      .reduce((prev, curr) => {
        if (!prev || explode) {
          return `${prev || ''};${key}=${curr}`;
        }
        return `${prev},${curr}`;
      }, '');
  }

  if (style === 'form') {
    const after = explode ? `&${key}=` : ',';
    return value.map((val) => valueEncoder(val)).join(after);
  }

  if (style === 'spaceDelimited') {
    const after = explode ? `${key}=` : '';
    return value.map((val) => valueEncoder(val)).join(` ${after}`);
  }

  if (style === 'pipeDelimited') {
    const after = explode ? `${key}=` : '';
    return value.map((val) => valueEncoder(val)).join(`|${after}`);
  }

  return undefined;
}

function encodeObject({ key, value, style, explode, escape }) {
  const valueEncoder = (str) =>
    encodeDisallowedCharacters(str, {
      escape,
    });

  const valueKeys = Object.keys(value);

  if (style === 'simple') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const middleChar = explode ? '=' : ',';
      const prefix = prev ? `${prev},` : '';

      return `${prefix}${curr}${middleChar}${val}`;
    }, '');
  }

  if (style === 'label') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const middleChar = explode ? '=' : '.';
      const prefix = prev ? `${prev}.` : '.';

      return `${prefix}${curr}${middleChar}${val}`;
    }, '');
  }

  if (style === 'matrix' && explode) {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev};` : ';';

      return `${prefix}${curr}=${val}`;
    }, '');
  }

  if (style === 'matrix') {
    // no explode
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev},` : `;${key}=`;

      return `${prefix}${curr},${val}`;
    }, '');
  }

  if (style === 'form') {
    return valueKeys.reduce((prev, curr) => {
      const val = valueEncoder(value[curr]);
      const prefix = prev ? `${prev}${explode ? '&' : ','}` : '';
      const separator = explode ? '=' : ',';

      return `${prefix}${curr}${separator}${val}`;
    }, '');
  }

  return undefined;
}

function encodePrimitive({ key, value, style, escape }) {
  const valueEncoder = (str) =>
    encodeDisallowedCharacters(str, {
      escape,
    });

  if (style === 'simple') {
    return valueEncoder(value);
  }

  if (style === 'label') {
    return `.${valueEncoder(value)}`;
  }

  if (style === 'matrix') {
    return `;${key}=${valueEncoder(value)}`;
  }

  if (style === 'form') {
    return valueEncoder(value);
  }

  if (style === 'deepObject') {
    return valueEncoder(value, {}, true);
  }

  return undefined;
}
