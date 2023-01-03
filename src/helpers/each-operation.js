// iterate over each operation, and fire a callback with details
// `find=true` will stop iterating, when the cb returns truthy
export default function eachOperation(spec, cb, find) {
  if (!spec || typeof spec !== 'object' || !spec.paths || typeof spec.paths !== 'object') {
    return null;
  }

  const { paths } = spec;

  // Iterate over the spec, collecting operations
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const pathName in paths) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const method in paths[pathName]) {
      if (method.toUpperCase() === 'PARAMETERS') {
        continue; // eslint-disable-line no-continue
      }
      const operation = paths[pathName][method];
      if (!operation || typeof operation !== 'object') {
        continue; // eslint-disable-line no-continue
      }

      const operationObj = {
        spec,
        pathName,
        method: method.toUpperCase(),
        operation,
      };
      const cbValue = cb(operationObj);

      if (find && cbValue) {
        return operationObj;
      }
    }
  }

  return undefined;
}
