export const freelyNamedKeyParents = [
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
  const parentStr = parent.join('/')
  return (
    (parent[parent.length - 1] === 'properties') ||
    (freelyNamedKeyParents.indexOf(parentStr) > -1)
  )
}
