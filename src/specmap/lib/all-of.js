export default {
  key: 'allOf',
  plugin: (val, key, fullPath, specmap, patch) => {
    // Ignore replace patches created by $ref because the changes will
    // occur in the original "add" patch and we don't want this plugin
    // to redundantly processes those "relace" patches.
    if (patch.meta && patch.meta.$$ref) {
      return
    }

    if (!Array.isArray(val)) {
      const err = new TypeError('allOf must be an array')
      err.fullPath = fullPath // This is an array
      return err
    }

    const parent = fullPath.slice(0, -1)
    let alreadyAddError = false

    const allOfPatches = [specmap.replace(parent, {})].concat(val.map((toMerge, index) => {
      if (!specmap.isObject(toMerge)) {
        if (alreadyAddError) {
          return null
        }
        alreadyAddError = true

        const err = new TypeError('Elements in allOf must be objects')
        err.fullPath = fullPath // This is an array
        return err
      }

      return specmap.mergeDeep(parent, toMerge)
    }))

    // Find the $$ref value from the patch's copy of the spec
    // and add it as the last patch for the `allOf` resolution
    let specObj = patch.value
    parent.forEach((part) => {
      specObj = specObj[part]
    })
    if (specObj.$$ref) {
      allOfPatches.push(specmap.mergeDeep(parent, {
        $$ref: specObj.$$ref
      }))
    }

    return allOfPatches
  }
}
