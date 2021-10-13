import lib from '.';

export default {
  key: 'parameters',
  plugin: (parameters, key, fullPath, specmap) => {
    if (Array.isArray(parameters) && parameters.length) {
      const val = Object.assign([], parameters);
      const opPath = fullPath.slice(0, -1);
      const op = { ...lib.getIn(specmap.spec, opPath) };

      parameters.forEach((param, position) => {
        try {
          val[position].default = specmap.parameterMacro(op, param);
        } catch (error) {
          const err = new Error(error);
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
