import idFromPathMethod from './id-from-path-method/index.js';
import replaceSpecialCharsWithUnderscore from './replace-special-chars-with-underscore.js';
export default function opId(operation, pathName, method = '', {
  v2OperationIdCompatibilityMode
} = {}) {
  if (!operation || typeof operation !== 'object') {
    return null;
  }
  const idWithoutWhitespace = (operation.operationId || '').replace(/\s/g, '');
  if (idWithoutWhitespace.length) {
    return replaceSpecialCharsWithUnderscore(operation.operationId);
  }
  return idFromPathMethod(pathName, method, {
    v2OperationIdCompatibilityMode
  });
}