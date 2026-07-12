import lib from './index.js';
export default {
  key: 'properties',
  plugin: (properties, key, fullPath, specmap) => {
    const val = {
      ...properties
    };

    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const k in properties) {
      try {
        val[k].default = specmap.modelPropertyMacro(val[k]);
      } catch (e) {
        const err = new Error(e);
        err.fullPath = fullPath; // This is an array
        return err;
      }
    }
    const patch = lib.replace(fullPath, val);
    return patch;
  }
};