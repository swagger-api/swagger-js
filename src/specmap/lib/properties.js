import lib from '../lib'

export default {
  key: 'properties',
  plugin: (properties, key, fullPath, specmap) => {
    let val = Object.assign({}, properties)

    for (let k in properties) {
      try {
        val[k].default = specmap.modelPropertyMacro(val[k])
      } catch(e) {
        const err = new Error(e)
        err.fullPath = fullPath // This is an array
        return err
      }

    }

    const patch = lib.replace(fullPath, val)

    return patch

  }
}
