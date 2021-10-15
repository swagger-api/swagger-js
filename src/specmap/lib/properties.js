import lib from '.';

export default {
  key: 'properties',
  plugin: (properties, key, fullPath, specmap) => {
    const val = { ...properties };

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const position in properties) {
      try {
        val[position].default = specmap.modelPropertyMacro(val[position]);
      } catch (e) {
        const err = new Error(e);
        err.fullPath = fullPath; // This is an array
        return err;
      }
    }

    const patch = lib.replace(fullPath, val);

    return patch;
  },
};
