import replaceSpecialCharsWithUnderscore from '../replace-special-chars-with-underscore.js';

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
  return `${method.toLowerCase()}${replaceSpecialCharsWithUnderscore(pathName)}`;
}
