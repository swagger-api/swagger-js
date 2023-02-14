import opId from '../../../helpers/op-id.js';

export default function normalize(parsedSpec) {
  const { spec } = parsedSpec;
  const { paths } = spec;
  const map = {};

  if (!paths || spec.$$normalized) {
    return parsedSpec;
  }

  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const pathName in paths) {
    const path = paths[pathName];

    if (path == null || !['object', 'function'].includes(typeof path)) {
      continue; // eslint-disable-line no-continue
    }

    const pathParameters = path.parameters;

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const method in path) {
      const operation = path[method];
      if (operation == null || !['object', 'function'].includes(typeof operation)) {
        continue; // eslint-disable-line no-continue
      }

      const oid = opId(operation, pathName, method);

      if (oid) {
        if (map[oid]) {
          map[oid].push(operation);
        } else {
          map[oid] = [operation];
        }

        const opList = map[oid];
        if (opList.length > 1) {
          opList.forEach((o, i) => {
            // eslint-disable-next-line no-underscore-dangle
            o.__originalOperationId = o.__originalOperationId || o.operationId;
            o.operationId = `${oid}${i + 1}`;
          });
        } else if (typeof operation.operationId !== 'undefined') {
          // Ensure we always add the normalized operation ID if one already exists
          // ( potentially different, given that we normalize our IDs)
          // ... _back_ to the spec. Otherwise, they might not line up
          const obj = opList[0];
          // eslint-disable-next-line no-underscore-dangle
          obj.__originalOperationId = obj.__originalOperationId || operation.operationId;
          obj.operationId = oid;
        }
      }

      if (method !== 'parameters') {
        // Add inherited consumes, produces, parameters, securities
        const inheritsList = [];
        const toBeInherit = {};

        // Global-levels
        // eslint-disable-next-line no-restricted-syntax
        for (const key in spec) {
          if (key === 'produces' || key === 'consumes' || key === 'security') {
            toBeInherit[key] = spec[key];
            inheritsList.push(toBeInherit);
          }
        }

        // Path-levels
        if (pathParameters) {
          toBeInherit.parameters = pathParameters;
          inheritsList.push(toBeInherit);
        }

        if (inheritsList.length) {
          // eslint-disable-next-line no-restricted-syntax
          for (const inherits of inheritsList) {
            // eslint-disable-next-line no-restricted-syntax
            for (const inheritName in inherits) {
              if (!operation[inheritName]) {
                operation[inheritName] = inherits[inheritName];
              } else if (inheritName === 'parameters') {
                // eslint-disable-next-line no-restricted-syntax
                for (const param of inherits[inheritName]) {
                  const exists = operation[inheritName].some(
                    (opParam) =>
                      (opParam.name && opParam.name === param.name) ||
                      (opParam.$ref && opParam.$ref === param.$ref) ||
                      (opParam.$$ref && opParam.$$ref === param.$$ref) ||
                      opParam === param
                  );

                  if (!exists) {
                    operation[inheritName].push(param);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  spec.$$normalized = true;

  return parsedSpec;
}
