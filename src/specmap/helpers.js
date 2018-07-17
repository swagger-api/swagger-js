/* eslint-disable import/prefer-default-export */
//
// if/when another helper is added to this file,
// please remove the eslint override and this comment!

// This will match if the direct parent's key exactly matches an item.
const freelyNamedKeyParents = [
  'properties',
]

// This will match if the joined parent path exactly matches an item.
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
  'schema/example'
]

export function isFreelyNamed(parentPath) {
  const parentKey = parentPath[parentPath.length - 1]
  const parentStr = parentPath.join('/')

  const res = (
    (freelyNamedKeyParents.indexOf(parentKey) > -1) ||
    (freelyNamedPaths.indexOf(parentStr) > -1) ||
    (freelyNamedAncestors.some(el => parentStr.indexOf(el) > -1))
  )
  return res
}
