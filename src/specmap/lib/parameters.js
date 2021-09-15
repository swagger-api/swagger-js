import lib from './index.js';

export default {
  key: 'parameters',
  plugin: (parameters, key, fullPath, specmap) => {
    if (Array.isArray(parameters) && parameters.length) {
      const val = Object.assign([], parameters);
      const opPath = fullPath.slice(0, -1);
      const op = { ...lib.getIn(specmap.spec, opPath) };

      parameters.forEach((param, i) => {
        try {
          val[i].default = specmap.parameterMacro(op, param);
        } catch (e) {
          const err = new Error(e);
          err.fullPath = fullPath;
          return err;
        }
        return undefined;
      });

      return lib.replace(fullPath, val);
    }

    return lib.replace(fullPath, parameters);
  },
};
