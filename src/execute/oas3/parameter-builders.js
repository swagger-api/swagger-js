import stylize, { encodeDisallowedCharacters } from './style-serializer.js';
import serialize from './content-serializer.js';

export function path({ req, value, parameter }) {
  const { name, style, explode, content, allowReserved } = parameter;

  if (content) {
    const effectiveMediaType = Object.keys(content)[0];

    req.url = req.url
      .split(`{${name}}`)
      .join(encodeDisallowedCharacters(serialize(value, effectiveMediaType), { escape: true }));
    return;
  }

  const styledValue = stylize({
    key: parameter.name,
    value,
    style: style || 'simple',
    explode: explode || false,
    escape: allowReserved ? 'unsafe' : true,
  });

  req.url = req.url.split(`{${name}}`).join(styledValue);
}

export function query({ req, value, parameter }) {
  req.query = req.query || {};

  if (parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0];

    req.query[parameter.name] = serialize(value, effectiveMediaType);
    return;
  }

  if (value === false) {
    value = 'false';
  }

  if (value === 0) {
    value = '0';
  }

  if (value) {
    const { style, explode, allowReserved } = parameter;
    req.query[parameter.name] = {
      value,
      serializationOption: { style, explode, allowReserved },
    };
  } else if (parameter.allowEmptyValue && value !== undefined) {
    const paramName = parameter.name;
    req.query[paramName] = req.query[paramName] || {};
    req.query[paramName].allowEmptyValue = true;
  }
}

const PARAMETER_HEADER_BLACKLIST = ['accept', 'authorization', 'content-type'];

export function header({ req, parameter, value }) {
  req.headers = req.headers || {};

  if (PARAMETER_HEADER_BLACKLIST.indexOf(parameter.name.toLowerCase()) > -1) {
    return;
  }

  if (parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0];

    req.headers[parameter.name] = serialize(value, effectiveMediaType);
    return;
  }

  if (typeof value !== 'undefined') {
    req.headers[parameter.name] = stylize({
      key: parameter.name,
      value,
      style: parameter.style || 'simple',
      explode: typeof parameter.explode === 'undefined' ? false : parameter.explode,
      escape: false,
    });
  }
}

export function cookie({ req, parameter, value }) {
  req.headers = req.headers || {};
  const type = typeof value;

  if (parameter.content) {
    const effectiveMediaType = Object.keys(parameter.content)[0];

    req.headers.Cookie = `${parameter.name}=${serialize(value, effectiveMediaType)}`;
    return;
  }

  if (type !== 'undefined') {
    const prefix =
      type === 'object' && !Array.isArray(value) && parameter.explode ? '' : `${parameter.name}=`;

    req.headers.Cookie =
      prefix +
      stylize({
        key: parameter.name,
        value,
        escape: false,
        style: parameter.style || 'form',
        explode: typeof parameter.explode === 'undefined' ? false : parameter.explode,
      });
  }
}
