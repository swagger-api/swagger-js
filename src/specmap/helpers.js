import traverse from "traverse"
import URL from "url"

// This will match if the direct parent's key exactly matches an item.
const freelyNamedKeyParents = [
  'properties',
]

// This will match if the grandparent's key exactly matches an item.
// NOTE that this is for finding non-free paths!
const nonFreelyNamedKeyGrandparents = [
  'properties',
]

// This will match if the joined parent path exactly matches an item.
//
// This is mostly useful for filtering out root-level reusable item names,
// for example `["definitions", "$ref"]`
const freelyNamedPaths = [
  // Swagger 2.0
  'definitions',
  'parameters',
  'responses',
  'securityDefinitions',

  // OpenAPI 3.0
  'components/schemas',
  'components/responses',
  'components/parameters',
  'components/securitySchemes'
]

// This will match if any of these items are substrings of the joined
// parent path.
//
// Warning! These are powerful. Beware of edge cases.
const freelyNamedAncestors = [
  'schema/example',
  'items/example',
]

export function isFreelyNamed(parentPath) {
  const parentKey = parentPath[parentPath.length - 1]
  const grandparentKey = parentPath[parentPath.length - 2]
  const parentStr = parentPath.join('/')

  return (
    // eslint-disable-next-line max-len
    (freelyNamedKeyParents.indexOf(parentKey) > -1 && nonFreelyNamedKeyGrandparents.indexOf(grandparentKey) === -1) ||
    (freelyNamedPaths.indexOf(parentStr) > -1) ||
    (freelyNamedAncestors.some(el => parentStr.indexOf(el) > -1))
  )
}

export function generateAbsoluteRefPatches(obj, fullPath, specmap) {
  const patches = []

  traverse(obj).forEach(function () {
    if (this.key === "$ref" || this.key === "$$ref") {
      const nodePath = fullPath.concat(this.path)
      const collapsedNodePath = fullPath
        // slice off `["allOf", n]`, since the allOf will be collapsed when this patch is applied
        .slice(0, -2)
        .concat(this.path)

      const {baseDoc = ''} = specmap.getContext(nodePath)
      const absolutifiedRefValue = absolutifyPointer(this.node, baseDoc)

      patches.push(specmap.replace(collapsedNodePath, absolutifiedRefValue))
    }
  })

  return patches
}

export function absolutifyPointer(pointer, baseUrl) {
  const [urlPart, fragmentPart] = pointer.split("#")
  const newRefUrlPart = URL.resolve(urlPart || '', baseUrl || '')

  return fragmentPart ? `${newRefUrlPart}#${fragmentPart}` : newRefUrlPart
}