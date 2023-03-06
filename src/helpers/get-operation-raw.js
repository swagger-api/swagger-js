import findOperation from './find-operation.js';
import opId from './op-id.js';
import idFromPathMethodLegacy from './id-from-path-method/legacy.js';

export default function getOperationRaw(spec, id) {
  if (!spec || !spec.paths) {
    return null;
  }

  return findOperation(spec, ({ pathName, method, operation }) => {
    if (!operation || typeof operation !== 'object') {
      return false;
    }

    const rawOperationId = operation.operationId; // straight from the source
    const operationId = opId(operation, pathName, method);
    const legacyOperationId = idFromPathMethodLegacy(pathName, method);

    return [operationId, legacyOperationId, rawOperationId].some((val) => val && val === id);
  });
}
