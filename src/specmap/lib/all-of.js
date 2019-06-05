import {isFreelyNamed, generateAbsoluteRefPatches} from '../helpers'

export default {
  key: 'allOf',
  plugin: (val, key, fullPath, specmap, patch) => {
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

    const patches = []

    // remove existing content
    patches.push(specmap.replace(parent, {}))

    val.forEach((toMerge, i) => {
      if (!specmap.isObject(toMerge)) {
        if (alreadyAddError) {
          return null
        }
        alreadyAddError = true

        const err = new TypeError('Elements in allOf must be objects')
        err.fullPath = fullPath // This is an array
        return patches.push(err)
      }

      // Deeply merge the member's contents onto the parent location
      patches.push(specmap.mergeDeep(parent, toMerge))

      // Generate patches that migrate $ref values based on ContextTree information

      // remove ["allOf"], which will not be present when these patches are applied
      const collapsedFullPath = fullPath.slice(0, -1)

      const absoluteRefPatches = generateAbsoluteRefPatches(toMerge, collapsedFullPath, {
        getBaseUrlForNodePath: (nodePath) => {
          return specmap.getContext([...fullPath, i, ...nodePath]).baseDoc
        },
        specmap
      })

      patches.push(...absoluteRefPatches)
    })

    // Merge back the values from the original definition
    patches.push(specmap.mergeDeep(parent, originalDefinitionObj))

    // If there was not an original $$ref value, make sure to remove
    // any $$ref value that may exist from the result of `allOf` merges
    if (!originalDefinitionObj.$$ref) {
      patches.push(specmap.remove([].concat(parent, '$$ref')))
    }

    return patches
  }
}

// ## Problem
// If an allOf member's content is provided by remote $ref, any remaining $ref
// values within the content will still be expressed from the point of view of
// the remote document. Usually this is handled by Specmap's ContextTree, but
// allOf causes the ContextTree to be out of sync, because the ContextTree can't
// track the original source of each member's contents once it has all been
// collapsed into one object.
//
// ## Example
//
// (a.yaml)
// myObj:
//   allOf:
//   - $ref: "./b.yaml#one"
//
// (b.yaml)
// one:
//   $ref: "#/two"
// two:
//   hello: "world"
//
// When the $ref in `a.yaml` is resolved, ContextTree knows that ["myObj",
// "allOf", 0] is coming from `b.yaml`, but once the allOf plugin collapses the
// allOf array into a single result object at ["myObj"], that context is lost.
//
// As a result, the resolver incorrectly reads the `#/two` $ref as a local ref
// within `a.yaml`, and an error is generated.
//
// Furthermore, even if ContextTree could keep up with each $ref, we'd still be
// *possibly* handing back invalid $ref values to the user, because the resolver
// is sometimes throttled by path restriction and depth limitations.
//
// ## Solution
// Generate a set of patches that will rewrite any $refs within an allOf member
// to be valid within their new position in the root document, using the
// existing ContentTree data as a basis for rewriting each reference.
//
// Essentially: persist the ContextTree information by writing it into the $ref.

