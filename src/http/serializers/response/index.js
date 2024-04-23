import jsYaml from 'js-yaml';

export const shouldDownloadAsText = (contentType = '') =>
  /(json|xml|yaml|text)\b/.test(contentType);

function parseBody(body, contentType) {
  if (
    contentType &&
    (contentType.indexOf('application/json') === 0 || contentType.indexOf('+json') > 0)
  ) {
    return JSON.parse(body);
  }
  return jsYaml.load(body);
}

function serializeHeaderValue(value) {
  const isMulti = value.includes(', ');

  return isMulti ? value.split(', ') : value;
}

// Serialize headers into a hash, where mutliple-headers result in an array.
//
// eg: Cookie: one
//     Cookie: two
//  =  { Cookie: [ "one", "two" ]
export function serializeHeaders(headers = {}) {
  if (typeof headers.entries !== 'function') return {};

  return Array.from(headers.entries()).reduce((acc, [header, value]) => {
    acc[header] = serializeHeaderValue(value);
    return acc;
  }, {});
}

// Serialize the response, returns a promise with headers and the body part of the hash
export function serializeRes(oriRes, url, { loadSpec = false } = {}) {
  const res = {
    ok: oriRes.ok,
    url: oriRes.url || url,
    status: oriRes.status,
    statusText: oriRes.statusText,
    headers: serializeHeaders(oriRes.headers),
  };
  const contentType = res.headers['content-type'];
  const useText = loadSpec || shouldDownloadAsText(contentType);
  const getBody = useText ? oriRes.text : oriRes.blob || oriRes.buffer;
  return getBody.call(oriRes).then((body) => {
    res.text = body;
    res.data = body;
    if (useText) {
      try {
        const obj = parseBody(body, contentType);
        res.body = obj;
        res.obj = obj;
      } catch (e) {
        res.parseError = e;
      }
    }
    return res;
  });
}
