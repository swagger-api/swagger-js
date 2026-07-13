import replaceSpecialCharsWithUnderscore from '../replace-special-chars-with-underscore.js';

const STANDARD_HTTP_METHODS = new Set([
  'connect',
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'query',
  'trace',
]);

export default function idFromPathMethod(
  pathName,
  method,
  { v2OperationIdCompatibilityMode } = {}
) {
  if (v2OperationIdCompatibilityMode) {
    let res = `${method.toLowerCase()}_${pathName}`.replace(
      /[\s!@#$%^&*()_+=[{\]};:<>|./?,\\'""-]/g,
      '_'
    );

    res = res || `${pathName.substring(1)}_${method}`;

    return res
      .replace(/((_){2,})/g, '_')
      .replace(/^(_)*/g, '')
      .replace(/([_])*$/g, '');
  }
  const normalizedMethod = STANDARD_HTTP_METHODS.has(method.toLowerCase())
    ? method.toLowerCase()
    : method;

  return `${normalizedMethod}${replaceSpecialCharsWithUnderscore(pathName)}`;
}
