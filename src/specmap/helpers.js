const freelyNamedKeyParents = [
  'properties',
]
const freelyNamedStrParents = [
  // Swagger 2.0
  'definitions',
  'parameters',
  'responses',
  'securityDefinitions',

  // OpenAPI 3.0
  'components/schemas',
  'components/responses',
  'components/parameters',
  'components/securitySchemes',
]

export function isFreelyNamed(parent) {
  const parentKey = parent[parent.length - 1]
  const parentStr = parent.join('/')
  return (
    (freelyNamedKeyParents.indexOf(parentKey) > -1) ||
    (freelyNamedStrParents.indexOf(parentStr) > -1)
  )
}
