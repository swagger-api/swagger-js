import {isFreelyNamed} from '../helpers'

export default {
  key: 'allOf',
  plugin: (val, key, fullPath, specmap, patch) => {
    console.log('allOf', fullPath)
    // Ignore replace patches created by $ref because the changes will
    // occur in the original "add" patch and we don't want this plugin
    // to redundantly processes those "relace" patches.
    if (patch.meta && patch.meta.$$ref) {
      return
    }

    const parent = fullPath.slice(0, -1)
    if (isFreelyNamed(parent)) {
      return
    }

    if (!Array.isArray(val)) {
      const err = new TypeError('allOf must be an array')
      err.fullPath = fullPath // This is an array
      return err
    }


    let alreadyAddError = false

    // Find the original definition from the `patch.value` object
    // Remove the `allOf` property so it doesn't get added to the result of the `allOf` plugin
    let originalDefinitionObj = patch.value
    parent.forEach((part) => {
      if (!originalDefinitionObj) return // bail out if we've lost sight of our target
      originalDefinitionObj = originalDefinitionObj[part]
    })
    originalDefinitionObj = Object.assign({}, originalDefinitionObj)
    delete originalDefinitionObj.allOf

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

    // Merge back the values from the original definition
    allOfPatches.push(specmap.mergeDeep(parent, originalDefinitionObj))

    // If there was not an original $$ref value, make sure to remove
    // any $$ref value that may exist from the result of `allOf` merges
    if (!originalDefinitionObj.$$ref) {
      allOfPatches.push(specmap.remove([].concat(parent, '$$ref')))
    }

    return allOfPatches
  }
}
