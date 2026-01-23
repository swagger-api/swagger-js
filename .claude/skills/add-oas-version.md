# Add OpenAPI/Swagger Version Support

**Skill Name:** `add-oas-version`
**Purpose:** Guide the process of adding support for a new OpenAPI/Swagger specification version to swagger-js
**Based on:** Analysis of OAS 3.1.0 implementation (commits ace708ac through 56df8f61)

## Overview

This skill provides a systematic approach to adding support for a new OpenAPI/Swagger specification version. The process involves creating a new resolver strategy, updating execution logic if needed, adding comprehensive tests, and updating documentation.

## Background: How OAS 3.1.0 Support Was Added

OpenAPI 3.1.0 support was added to swagger-js between December 2022 and January 2023. The implementation introduced a fundamentally new approach using the ApiDOM library ecosystem instead of the legacy SpecMap resolution engine.

### Key Implementation Details

**Timeline:**
- Dec 27, 2022 (ace708ac): ApiDOM dependencies integrated
- Dec 2022-Jan 2023: ApiDOM parsers and resolvers implemented
- Jan 4, 2023 (19ecbe43): OAS 3.1.0 resolution support added
- Jan 2023: Normalization and subtree resolver support
- Ongoing: ApiDOM dependency updates and bug fixes

**Architecture:**
- **Resolution Engine:** ApiDOM (@swagger-api/apidom-reference) instead of SpecMap
- **Parsers:** Custom OpenAPI 3.1-specific JSON/YAML parsers with detection regex
- **Dereference Strategy:** Custom OpenAPI3_1SwaggerClientDereferenceStrategy
- **Normalization:** ApiDOM refractor plugins for post-resolution normalization
- **Execution:** Shared with OAS 3.0 (same parameter builders)

**Files Created/Modified:**
```
src/resolver/strategies/openapi-3-1-apidom/
├── index.js              # Strategy definition with match/resolve/normalize
├── resolve.js            # ApiDOM-based resolution logic
└── normalize.js          # Normalization using refractor plugins

src/helpers/apidom/
├── reference/
│   ├── resolve/resolvers/http-swagger-client/  # Custom HTTP resolver
│   ├── parse/parsers/
│   │   ├── json/                               # Generic JSON parser
│   │   ├── yaml-1-2/                           # Generic YAML 1.2 parser
│   │   ├── openapi-json-3-1/                   # OAS 3.1 JSON parser
│   │   └── openapi-yaml-3-1/                   # OAS 3.1 YAML parser
│   └── dereference/strategies/
│       └── openapi-3-1-swagger-client/         # Custom dereference strategy

test/resolver/strategies/openapi-3-1-apidom/
├── index.js                                    # Main resolver tests
├── normalize/                                  # Normalization tests
└── __fixtures__/                               # Test fixtures

test/resolver/apidom/                           # ApiDOM component tests
test/execute/openapi-3-1.js                     # Execution tests
```

## Prerequisites

Before starting, determine:

1. **Spec Version:** What is the new version number? (e.g., 4.0.0, 3.2.0)
2. **Breaking Changes:** Does it introduce breaking changes from previous versions?
3. **Resolution Strategy:**
   - Can it use existing SpecMap engine (like OAS 3.0)?
   - Does it need a new resolution library (like ApiDOM for OAS 3.1)?
4. **Execution Changes:** Are there new parameter styles, security schemes, or request body formats?
5. **Dependencies:** What new libraries are needed (parsers, validators, etc.)?

## Step-by-Step Implementation

### Phase 1: Dependencies and Setup

**1.1 Add Required Dependencies**

```bash
# Example: For OAS 3.1, ApiDOM packages were added
npm install @swagger-api/apidom-core@^1.0.0
npm install @swagger-api/apidom-error@^1.0.0
npm install @swagger-api/apidom-json-pointer@^1.0.0
npm install @swagger-api/apidom-ns-openapi-3-1@^1.0.0
npm install @swagger-api/apidom-reference@^1.0.0

# Update .nvmrc if minimum Node.js version changes
# Update package.json engines field
```

**1.2 Create Branch**

```bash
git checkout -b feat/add-openapi-X-Y-support
```

**1.3 Update GitHub Workflows (if needed)**

```yaml
# .github/workflows/nodejs.yml
# Add any new test jobs or update Node.js version matrix
```

---

### Phase 2: Version Detection

**2.1 Add Version Predicate**

Create or update `src/helpers/openapi-predicates.js`:

```javascript
// Example from OAS 3.1
export const isOpenAPIXY = (spec) => {
  const { openapi } = spec;
  return typeof openapi === 'string' && /^X\.Y\.(?:[1-9]\d*|0)$/.test(openapi);
};

// Or for Swagger 2.x style:
export const isSwaggerXY = (spec) => {
  const { swagger } = spec;
  return typeof swagger === 'string' && /^X\.Y$/.test(swagger);
};
```

**2.2 Update Execute Helper**

Update `src/execute/index.js` to recognize the new version:

```javascript
// If it shares execution with existing version:
export const isOpenAPIX = (spec) => isOpenAPIXY(spec) || isOpenAPIXZ(spec);

// Or if it needs separate execution:
export const isOpenAPIXY = (spec) => /* version check */;
```

---

### Phase 3: Resolver Strategy Implementation

#### Option A: Using Existing SpecMap Engine (simpler, like OAS 3.0)

**3.1 Create Strategy Directory**

```bash
mkdir -p src/resolver/strategies/openapi-X-Y
```

**3.2 Create Strategy Files**

`src/resolver/strategies/openapi-X-Y/index.js`:
```javascript
import resolveGenericStrategy from '../generic/index.js';

export default async function resolveOpenAPIXYStrategy(options) {
  // If minimal differences, delegate to generic
  return resolveGenericStrategy(options);

  // Or add custom logic:
  // const result = await resolveGenericStrategy(options);
  // return applyXYSpecificTransformations(result);
}
```

`src/resolver/strategies/openapi-X-Y/normalize.js`:
```javascript
// Either delegate to generic:
export { default } from '../generic/normalize.js';

// Or implement custom normalization:
export default function normalizeOpenAPIXY(spec) {
  // Apply version-specific normalization
  return normalizedSpec;
}
```

#### Option B: Using New Resolution Library (complex, like OAS 3.1)

**3.1 Create Strategy Directory Structure**

```bash
mkdir -p src/resolver/strategies/openapi-X-Y-{library-name}
mkdir -p src/helpers/{library-name}/reference/resolve/resolvers/http-swagger-client
mkdir -p src/helpers/{library-name}/reference/parse/parsers/json
mkdir -p src/helpers/{library-name}/reference/parse/parsers/yaml
mkdir -p src/helpers/{library-name}/reference/parse/parsers/openapi-json-X-Y
mkdir -p src/helpers/{library-name}/reference/parse/parsers/openapi-yaml-X-Y
mkdir -p src/helpers/{library-name}/reference/dereference/strategies/openapi-X-Y-swagger-client
```

**3.2 Implement Custom Parsers**

Create version-specific parsers that detect the new format:

`src/helpers/{library}/reference/parse/parsers/openapi-json-X-Y/index.js`:
```javascript
// Detection regex for the new version
const detectionRegExp = /"openapi"\s*:\s*"X\.Y\.(?:[1-9]\d*|0)"/;

class OpenAPIJsonXYParser extends Parser {
  canParse(file) {
    return detectionRegExp.test(file.toString());
  }

  async parse(file) {
    // Parse JSON and create appropriate Element
    const json = JSON.parse(file.toString());
    return OpenApiXYElement.refract(json);
  }
}
```

**3.3 Implement HTTP Resolver**

Create a custom HTTP resolver using swagger-js HTTP client:

`src/helpers/{library}/reference/resolve/resolvers/http-swagger-client/index.js`:
```javascript
class HTTPResolverSwaggerClient extends Resolver {
  constructor({ timeout, redirects }) {
    this.timeout = timeout;
    this.redirects = redirects;
  }

  async resolve(uri) {
    // Use swagger-js HTTP client with interceptors
    const response = await http({
      url: uri,
      timeout: this.timeout,
      // ... other config
    });
    return response;
  }
}
```

**3.4 Implement Dereference Strategy**

Create custom dereference strategy with swagger-js specific behavior:

`src/helpers/{library}/reference/dereference/strategies/openapi-X-Y-swagger-client/index.js`:
```javascript
class OpenAPIXYSwaggerClientDereferenceStrategy extends DereferenceStrategy {
  constructor({ allowMetaPatches, useCircularStructures }) {
    this.allowMetaPatches = allowMetaPatches;
    this.useCircularStructures = useCircularStructures;
  }

  async dereference(element, options) {
    // Implement dereferencing logic
    // Handle $refs, allOf, parameters, etc.
    return dereferencedElement;
  }
}
```

**3.5 Create Main Strategy**

`src/resolver/strategies/openapi-X-Y-{library}/index.js`:
```javascript
import { isPlainObject } from 'ramda-adjunct';
import { isElement } from '@{library}/core';

import resolveOpenAPIXYStrategy from './resolve.js';
import normalize, { pojoAdapter } from './normalize.js';
import { isOpenAPIXY } from '../../../helpers/openapi-predicates.js';

const openApiXY{Library}Strategy = {
  name: 'openapi-X-Y-{library}',
  match(spec) {
    return isOpenAPIXY(spec);
  },
  normalize(spec) {
    // Pre-normalization for POJO
    if (!isElement(spec) && isPlainObject(spec) && !spec.$$normalized) {
      const preNormalized = pojoAdapter(normalize)(spec);
      preNormalized.$$normalized = true;
      return preNormalized;
    }
    // Post-normalization for library elements
    if (isElement(spec)) {
      return normalize(spec);
    }
    return spec;
  },
  async resolve(options) {
    return resolveOpenAPIXYStrategy(options);
  },
};

export default openApiXY{Library}Strategy;
```

**3.6 Create Resolution Logic**

`src/resolver/strategies/openapi-X-Y-{library}/resolve.js`:
```javascript
import { toValue } from '@{library}/core';
import { OpenApiXYElement } from '@{library}/ns-openapi-X-Y';
import { dereference } from '@{library}/reference/configuration/empty';

import * as optionsUtil from '../utils/options.js';
import HttpResolverSwaggerClient from '../../helpers/{library}/reference/resolve/resolvers/http-swagger-client/index.js';
import JsonParser from '../../helpers/{library}/reference/parse/parsers/json/index.js';
import YamlParser from '../../helpers/{library}/reference/parse/parsers/yaml/index.js';
import OpenApiJsonXYParser from '../../helpers/{library}/reference/parse/parsers/openapi-json-X-Y/index.js';
import OpenApiYamlXYParser from '../../helpers/{library}/reference/parse/parsers/openapi-yaml-X-Y/index.js';
import OpenApiXYSwaggerClientDereferenceStrategy from '../../helpers/{library}/reference/dereference/strategies/openapi-X-Y-swagger-client/index.js';

const resolveOpenAPIXYStrategy = async (options) => {
  const {
    spec,
    timeout = 10000,
    redirects = 10,
    requestInterceptor,
    responseInterceptor,
    allowMetaPatches = false,
    useCircularStructures = false,
    skipNormalization = false,
  } = options;

  // Refract spec to library element
  const openApiElement = OpenApiXYElement.refract(spec);

  // Dereference using custom strategy
  const dereferenced = await dereference(openApiElement, {
    resolve: {
      baseURI: optionsUtil.retrievalURI(options),
      resolvers: [
        HttpResolverSwaggerClient({ timeout, redirects }),
      ],
      resolverOpts: {
        swaggerHTTPClientConfig: {
          requestInterceptor,
          responseInterceptor,
        },
      },
      strategies: [/* resolution strategies */],
    },
    parse: {
      parsers: [
        OpenApiJsonXYParser({ allowEmpty: false, sourceMap: false }),
        OpenApiYamlXYParser({ allowEmpty: false, sourceMap: false }),
        JsonParser({ allowEmpty: false, sourceMap: false }),
        YamlParser({ allowEmpty: false, sourceMap: false }),
      ],
    },
    dereference: {
      maxDepth: 100,
      strategies: [
        OpenApiXYSwaggerClientDereferenceStrategy({
          allowMetaPatches,
          useCircularStructures,
        }),
      ],
    },
  });

  const normalized = skipNormalization ? dereferenced : normalize(dereferenced);

  return { spec: toValue(normalized), errors: [] };
};

export default resolveOpenAPIXYStrategy;
```

**3.7 Create Normalization**

`src/resolver/strategies/openapi-X-Y-{library}/normalize.js`:
```javascript
import { transclude } from '@{library}/core';
import { refract } from '@{library}/ns-openapi-X-Y';

// Import normalization plugins
import refractorPluginNormalizeOperationIds from '@{library}/ns-openapi-X-Y/refractor/plugins/normalize-operation-ids';
import refractorPluginNormalizeParameters from '@{library}/ns-openapi-X-Y/refractor/plugins/normalize-parameters';
// ... other plugins

export const pojoAdapter = (normalize) => (spec) => {
  // Convert POJO to Element, normalize, convert back to POJO
  const element = refract(spec);
  const normalized = normalize(element);
  return transclude(spec, normalized);
};

const normalize = (element) => {
  const plugins = [
    refractorPluginNormalizeOperationIds(),
    refractorPluginNormalizeParameters(),
    // ... other normalization plugins
  ];

  return refract(element, { plugins });
};

export default normalize;
```

---

### Phase 4: Register Strategy

**4.1 Create Strategy Export**

`src/resolver/strategies/openapi-X-Y/index.js` or `src/resolver/strategies/openapi-X-Y-{library}/index.js`:
```javascript
import openApiXYStrategy from './resolve.js';
import normalize from './normalize.js';
import { isOpenAPIXY } from '../../helpers/openapi-predicates.js';

export default {
  name: 'openapi-X-Y',
  match: (spec) => isOpenAPIXY(spec),
  normalize,
  resolve: openApiXYStrategy,
};
```

**4.2 Update Resolver Index**

`src/resolver/index.js`:
```javascript
import openApiXYStrategy from './strategies/openapi-X-Y/index.js';
// ... other imports

export default makeResolve({
  strategies: [
    openApiXYStrategy,              // <-- Add new strategy FIRST if it's newer
    Swagger.resolveStrategies['openapi-3-1-apidom'],
    Swagger.resolveStrategies['openapi-3-0'],
    Swagger.resolveStrategies['openapi-2-0'],
    Swagger.resolveStrategies.generic,
  ],
});
```

**Important:** Strategy order matters! The first matching strategy wins. Place newer/more specific strategies first.

**4.3 Update Main Entry Point**

`src/index.js`:
```javascript
import openApiXYResolveStrategy from './resolver/strategies/openapi-X-Y/index.js';
// ... other imports

// Register strategy
Swagger.resolveStrategies = {
  'openapi-X-Y': openApiXYResolveStrategy,
  'openapi-3-1-apidom': openApi31ApiDOMResolveStrategy,
  'openapi-3-0': openApi30ResolveStrategy,
  'openapi-2-0': openApi2ResolveStrategy,
  generic: genericResolveStrategy,
};

// If using external library, expose public API
Swagger.{library} = {
  resolve: {
    resolvers: { HTTPResolverSwaggerClient },
  },
  parse: {
    parsers: {
      JsonParser,
      YamlParser,
      OpenApiJsonXYParser,
      OpenApiYamlXYParser,
    },
  },
  dereference: {
    strategies: { OpenApiXYSwaggerClientDereferenceStrategy },
  },
};
```

---

### Phase 5: Execution Logic (if needed)

**5.1 Determine if Execution Changes**

Does the new version have:
- New parameter styles or serialization?
- New security schemes?
- Different request body handling?
- New server URL templating?

If YES, proceed with 5.2-5.4. If NO, skip to Phase 6.

**5.2 Create Parameter Builders (if needed)**

`src/execute/openapi-X-Y/index.js`:
```javascript
export const buildPathParameter = ({ req, parameter, value }) => {
  // Implement path parameter building for new version
  req.url = req.url.replace(`{${parameter.name}}`, encodeURIComponent(value));
};

export const buildQueryParameter = ({ req, parameter, value }) => {
  // Implement query parameter building with new styles
  if (!req.query) req.query = {};
  req.query[parameter.name] = value;
};

// Export parameter builders object
export const OPENAPI_XY_PARAMETER_BUILDERS = {
  path: buildPathParameter,
  query: buildQueryParameter,
  header: buildHeaderParameter,
  cookie: buildCookieParameter,
  // ... other parameter locations
};
```

**5.3 Update Execute Index**

`src/execute/index.js`:
```javascript
import { OPENAPI_XY_PARAMETER_BUILDERS } from './openapi-X-Y/index.js';
import { isOpenAPIXY } from '../helpers/openapi-predicates.js';

export default function execute(options) {
  const { spec } = options;
  let { parameterBuilders } = options;

  if (!parameterBuilders) {
    if (isOpenAPIXY(spec)) {
      parameterBuilders = OPENAPI_XY_PARAMETER_BUILDERS;
    } else if (isOpenAPI3(spec)) {
      parameterBuilders = OAS3_PARAMETER_BUILDERS;
    } else {
      parameterBuilders = SWAGGER2_PARAMETER_BUILDERS;
    }
  }

  // ... rest of execution logic
}
```

**5.4 Update Security Handling (if needed)**

If the new version has new security schemes:

`src/execute/openapi-X-Y/build-request.js`:
```javascript
export default function buildRequest(options) {
  // Implement request building with new security schemes
  // Handle new authentication methods
  // Apply new server URL templating
}
```

---

### Phase 6: Testing

**6.1 Create Test Directory Structure**

```bash
mkdir -p test/resolver/strategies/openapi-X-Y/__fixtures__
mkdir -p test/resolver/strategies/openapi-X-Y/normalize
mkdir -p test/execute/openapi-X-Y
mkdir -p test/resolver/{library}  # If using new library
```

**6.2 Create Test Fixtures**

`test/resolver/strategies/openapi-X-Y/__fixtures__/petstore.json`:
```json
{
  "openapi": "X.Y.0",
  "info": {
    "title": "Swagger Petstore",
    "version": "1.0.0"
  },
  "paths": {
    "/pets": {
      "get": {
        "summary": "List all pets",
        "operationId": "listPets",
        "responses": {
          "200": {
            "description": "Array of pets"
          }
        }
      }
    }
  }
}
```

Create fixtures for:
- Basic spec resolution
- $ref resolution (internal and external)
- allOf/oneOf/anyOf handling
- Circular reference handling
- Parameter macros (if supported)
- Security schemes
- Server URL templating

**6.3 Write Resolver Tests**

`test/resolver/strategies/openapi-X-Y/index.js`:
```javascript
import Swagger from '../../../src/index.js';

describe('resolver - OpenAPI X.Y strategy', () => {
  test('should match OpenAPI X.Y.0 specs', () => {
    const spec = { openapi: 'X.Y.0', paths: {} };
    const strategy = Swagger.resolveStrategies['openapi-X-Y'];

    expect(strategy.match(spec)).toBe(true);
  });

  test('should resolve local spec object', async () => {
    const spec = {
      openapi: 'X.Y.0',
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
          },
        },
      },
    };

    const { spec: resolved } = await Swagger.resolve({ spec });

    expect(resolved.openapi).toBe('X.Y.0');
    expect(resolved.paths['/pets'].get.operationId).toBe('listPets');
  });

  test('should resolve external $refs', async () => {
    // Mock HTTP requests
    const mockAgent = new MockAgent();
    mockAgent.disableNetConnect();

    const mockPool = mockAgent.get('https://api.example.com');
    mockPool
      .intercept({ path: '/spec.json', method: 'GET' })
      .reply(200, JSON.stringify({ /* spec content */ }));

    // Test resolution with external refs
    const spec = {
      openapi: 'X.Y.0',
      paths: {
        '/pets': {
          $ref: 'https://api.example.com/spec.json#/components/paths/pets',
        },
      },
    };

    const { spec: resolved } = await Swagger.resolve({ spec });

    expect(resolved.paths['/pets']).toBeDefined();
    // Verify $ref was resolved
  });

  test('should handle circular references', async () => {
    const spec = {
      openapi: 'X.Y.0',
      components: {
        schemas: {
          Node: {
            type: 'object',
            properties: {
              children: {
                type: 'array',
                items: { $ref: '#/components/schemas/Node' },
              },
            },
          },
        },
      },
    };

    const { spec: resolved } = await Swagger.resolve({
      spec,
      useCircularStructures: true,
    });

    expect(resolved.components.schemas.Node).toBeDefined();
    // Verify circular structure handling
  });

  test('should normalize parameters', async () => {
    const spec = {
      openapi: 'X.Y.0',
      paths: {
        '/pets/{id}': {
          parameters: [
            { name: 'id', in: 'path', required: true },
          ],
          get: {
            operationId: 'getPet',
          },
        },
      },
    };

    const { spec: resolved } = await Swagger.resolve({ spec });

    // Verify parameters are normalized to operation level
    expect(resolved.paths['/pets/{id}'].get.parameters).toBeDefined();
    expect(resolved.paths['/pets/{id}'].get.parameters[0].name).toBe('id');
  });

  test('should support skipNormalization option', async () => {
    const spec = { openapi: 'X.Y.0', paths: {} };

    const { spec: resolved } = await Swagger.resolve({
      spec,
      skipNormalization: true,
    });

    // Verify normalization was skipped
    expect(resolved.$$normalized).toBeUndefined();
  });
});
```

**6.4 Write Normalization Tests**

`test/resolver/strategies/openapi-X-Y/normalize/index.js`:
```javascript
describe('resolver - OpenAPI X.Y normalization', () => {
  test('should normalize operation IDs', () => {
    // Test operation ID normalization
  });

  test('should normalize parameters', () => {
    // Test parameter normalization
  });

  test('should normalize security requirements', () => {
    // Test security normalization
  });

  // ... other normalization tests
});
```

**6.5 Write Execution Tests**

`test/execute/openapi-X-Y.js`:
```javascript
import Swagger from '../../src/index.js';

describe('execute - OpenAPI X.Y', () => {
  test('should execute operation with operationId', async () => {
    const spec = {
      openapi: 'X.Y.0',
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
          },
        },
      },
    };

    const request = await Swagger.buildRequest({
      spec,
      operationId: 'listPets',
    });

    expect(request.url).toBe('https://api.example.com/pets');
    expect(request.method).toBe('GET');
  });

  test('should execute operation with pathName + method', async () => {
    const spec = {
      openapi: 'X.Y.0',
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/pets/{id}': {
          get: {},
        },
      },
    };

    const request = await Swagger.buildRequest({
      spec,
      pathName: '/pets/{id}',
      method: 'get',
      parameters: { id: '123' },
    });

    expect(request.url).toBe('https://api.example.com/pets/123');
  });

  test('should handle query parameters', async () => {
    const spec = {
      openapi: 'X.Y.0',
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            parameters: [
              { name: 'limit', in: 'query', schema: { type: 'integer' } },
            ],
          },
        },
      },
    };

    const request = await Swagger.buildRequest({
      spec,
      operationId: 'listPets',
      parameters: { limit: 10 },
    });

    expect(request.url).toContain('limit=10');
  });

  test('should handle security', async () => {
    const spec = {
      openapi: 'X.Y.0',
      servers: [{ url: 'https://api.example.com' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      paths: {
        '/pets': {
          get: { operationId: 'listPets' },
        },
      },
    };

    const request = await Swagger.buildRequest({
      spec,
      operationId: 'listPets',
      securities: {
        authorized: {
          bearerAuth: { token: 'secret-token' },
        },
      },
    });

    expect(request.headers.Authorization).toBe('Bearer secret-token');
  });

  test('should work with client instance', async () => {
    const client = await Swagger({
      spec: {
        openapi: 'X.Y.0',
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/pets': {
            get: {
              operationId: 'listPets',
              tags: ['pet'],
            },
          },
        },
      },
    });

    expect(client.apis.pet.listPets).toBeDefined();
    expect(client.apis.listPets).toBeDefined();
  });
});
```

**6.6 Write Library Component Tests (if using new library)**

`test/resolver/{library}/http-resolver.js`:
```javascript
describe('resolver - {library} HTTP resolver', () => {
  test('should resolve HTTP URIs', async () => {
    // Test HTTP resolution
  });

  test('should handle timeouts', async () => {
    // Test timeout handling
  });

  test('should handle redirects', async () => {
    // Test redirect handling
  });
});
```

`test/resolver/{library}/parsers/openapi-json-X-Y.js`:
```javascript
describe('resolver - OpenAPI X.Y JSON parser', () => {
  test('should detect OpenAPI X.Y JSON', () => {
    const content = '{"openapi":"X.Y.0"}';
    const parser = new OpenApiJsonXYParser();

    expect(parser.canParse(content)).toBe(true);
  });

  test('should not detect other versions', () => {
    const content = '{"openapi":"3.0.0"}';
    const parser = new OpenApiJsonXYParser();

    expect(parser.canParse(content)).toBe(false);
  });

  test('should parse OpenAPI X.Y spec', async () => {
    const content = '{"openapi":"X.Y.0","paths":{}}';
    const parser = new OpenApiJsonXYParser();

    const element = await parser.parse(content);

    expect(element).toBeDefined();
    expect(element.openapi.toValue()).toBe('X.Y.0');
  });
});
```

**6.7 Run Tests**

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit -- test/resolver/strategies/openapi-X-Y

# Run with coverage
npm run test:unit:coverage

# Test build artifacts
npm run build
npm run test:artifact
```

---

### Phase 7: Documentation

**7.1 Update README.md**

Add new version to compatibility list:

```markdown
## Compatibility

- OpenAPI X.Y.0 (latest)
- OpenAPI 3.1.0
- OpenAPI 3.0.x (3.0.0 through 3.0.4)
- Swagger/OpenAPI 2.0
- Swagger 1.x (via version 2.x branch)
```

Add usage examples:

```markdown
### OpenAPI X.Y.0 Example

\`\`\`javascript
import Swagger from 'swagger-client';

const spec = {
  openapi: 'X.Y.0',
  servers: [{ url: 'https://api.example.com' }],
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
      },
    },
  },
};

const client = await Swagger({ spec });
const result = await client.apis.listPets();
\`\`\`
```

**7.2 Update CLAUDE.md**

Update project overview:

```markdown
## Project Overview

**swagger-js** supports:
- OpenAPI X.Y.0 (latest)
- OpenAPI 3.1.0
- OpenAPI 3.0.x
- Swagger/OpenAPI 2.0

**Current Version**: 3.XX.0
```

Add to resolver strategies section:

```markdown
#### Resolution Strategies

- `openapi-X-Y-{library}`: Uses {Library} library for OpenAPI X.Y (most modern)
- `openapi-3-1-apidom`: Uses ApiDOM library for OpenAPI 3.1
- `openapi-3-0`: Custom resolver for OpenAPI 3.0.x
- `openapi-2-0`: Custom resolver for Swagger 2.0
- `generic`: Fallback for unknown specs
```

Add architectural details:

```markdown
### OpenAPI X.Y Support

**Resolution Engine:** {Library}
**Key Packages:**
- `@{library}/core`
- `@{library}/ns-openapi-X-Y`
- `@{library}/reference`

**Features:**
- [List new features specific to this version]
- [Highlight differences from previous versions]
```

**7.3 Create Migration Guide (if breaking changes)**

`docs/migration/X.Y.md`:

```markdown
# Migrating to OpenAPI X.Y Support

## Overview

This guide helps you migrate from OpenAPI [previous version] to X.Y.

## Breaking Changes

1. **[Breaking change 1]**
   - **Old behavior:** ...
   - **New behavior:** ...
   - **Migration:** ...

2. **[Breaking change 2]**
   - ...

## New Features

1. **[New feature 1]**
   - Description
   - Usage example

## API Changes

### Resolver Options

New options available for OpenAPI X.Y:
- `optionName`: Description

### Execution Options

New execution options:
- `optionName`: Description

## Examples

### Before (OpenAPI [previous])

\`\`\`javascript
// Old code
\`\`\`

### After (OpenAPI X.Y)

\`\`\`javascript
// New code
\`\`\`
```

**7.4 Update Changelog (manually or via conventional commits)**

`CHANGELOG.md`:

```markdown
## [3.XX.0] - YYYY-MM-DD

### Added
- Support for OpenAPI X.Y.0 specification
- New resolver strategy `openapi-X-Y-{library}`
- New {library} integration for parsing and resolution
- [Other new features]

### Changed
- [Changes to existing functionality]

### Deprecated
- [Deprecated features]

### Fixed
- [Bug fixes]
```

---

### Phase 8: Build and CI

**8.1 Update Webpack Configuration (if needed)**

If the new library needs special bundling:

`config/webpack/browser.config.babel.js`:
```javascript
// Add externals, aliases, or plugins for new library
```

**8.2 Update Babel Configuration (if needed)**

`babel.config.js`:
```javascript
// Add any new transforms or plugins
```

**8.3 Update Browser Field (if needed)**

`package.json`:
```json
{
  "browser": {
    "./src/helpers/{library}/node-specific.js": "./src/helpers/{library}/browser-specific.js"
  }
}
```

**8.4 Build All Targets**

```bash
npm run clean
npm run build

# Verify output
ls -lh dist/swagger-client.browser.min.js
ls -lh lib/index.js
ls -lh es/index.js
```

**8.5 Test Artifact Builds**

```bash
npm run test:artifact:umd:browser
npm run test:artifact:commonjs
npm run test:artifact:es
```

**8.6 Analyze Bundle Size**

```bash
npm run analyze:umd:browser

# Check if bundle size increased significantly
# Consider if new library should be lazy-loaded or externalized
```

---

### Phase 9: Commit and PR

**9.1 Run Linter**

```bash
npm run lint:fix
```

**9.2 Verify All Tests Pass**

```bash
npm test
npm run lint
```

**9.3 Create Commits**

Follow conventional commits format:

```bash
# Initial commit
git add package.json package-lock.json
git commit -m "chore(deps): integrate {Library} into codebase

Refs #ISSUE_NUMBER"

# Parser commits
git add src/helpers/{library}/reference/parse/parsers/
git commit -m "feat(resolve): add {Library} parsers for OpenAPI X.Y

- Add generic JSON parser
- Add generic YAML parser
- Add OpenAPI X.Y specific JSON parser
- Add OpenAPI X.Y specific YAML parser

Refs #ISSUE_NUMBER"

# Resolver commit
git add src/helpers/{library}/reference/resolve/
git commit -m "feat(resolve): add {Library} HTTP resolver based on SwaggerClient

Refs #ISSUE_NUMBER"

# Dereference strategy commit
git add src/helpers/{library}/reference/dereference/
git commit -m "feat: add OpenAPI X.Y dereference strategy

Refs #ISSUE_NUMBER"

# Normalization commit
git add src/resolver/strategies/openapi-X-Y*/normalize.js
git commit -m "feat(normalization): introduce normalization for OpenAPI X.Y

Refs #ISSUE_NUMBER"

# Main resolution commit
git add src/resolver/strategies/openapi-X-Y*/
git commit -m "feat(resolver): add support for OpenAPI X.Y resolution

Refs #ISSUE_NUMBER"

# Subtree resolver (if applicable)
git add src/subtree-resolver/
git commit -m "feat(subtree-resolver): adapt to support OpenAPI X.Y

Refs #ISSUE_NUMBER"

# Tests commits
git add test/resolver/{library}/
git commit -m "test(resolve): add tests for {Library} components

Refs #ISSUE_NUMBER"

git add test/resolver/strategies/openapi-X-Y*/
git commit -m "test(resolver): add tests for OpenAPI X.Y resolution

Refs #ISSUE_NUMBER"

git add test/execute/openapi-X-Y.js
git commit -m "test: add OpenAPI X.Y test for HTTP Client

Refs #ISSUE_NUMBER"

# Integration commit
git add src/index.js src/resolver/index.js
git commit -m "feat: expose {Library} components as public API

Refs #ISSUE_NUMBER"

# Documentation commit
git add README.md CLAUDE.md docs/
git commit -m "docs: add documentation for OpenAPI X.Y support

Refs #ISSUE_NUMBER"
```

**9.4 Push and Create PR**

```bash
git push origin feat/add-openapi-X-Y-support

# Create PR with description:
```

**PR Template:**

```markdown
## Description

Adds support for OpenAPI X.Y.0 specification using {Library} resolution engine.

## Related Issue

Closes #ISSUE_NUMBER

## Changes

### Resolution
- [x] New resolver strategy `openapi-X-Y-{library}`
- [x] Custom HTTP resolver using swagger-js HTTP client
- [x] OpenAPI X.Y specific JSON/YAML parsers
- [x] Custom dereference strategy
- [x] Normalization plugins

### Execution
- [ ] New parameter builders (if applicable)
- [ ] Updated security handling (if applicable)
- [x] Shared execution with existing version

### Tests
- [x] Resolver tests (100+ test cases)
- [x] Normalization tests
- [x] Execution tests
- [x] Library component tests
- [x] Artifact tests passing

### Documentation
- [x] Updated README.md
- [x] Updated CLAUDE.md
- [x] Added migration guide (if breaking changes)
- [x] Updated changelog

### Build
- [x] All build targets working (UMD, CommonJS, ES)
- [x] Bundle size analyzed
- [x] No breaking changes to public API

## Testing

```bash
npm test
npm run lint
npm run build
npm run test:artifact
```

## Checklist

- [x] Code follows project style guide
- [x] Commits follow conventional commits format
- [x] All tests passing
- [x] Documentation updated
- [x] No breaking changes (or documented if unavoidable)
- [x] Bundle size impact acceptable
```

---

## Post-Merge Tasks

After the PR is merged:

1. **Monitor CI/CD**
   - Ensure release workflow creates proper version
   - Verify npm package published correctly

2. **Update Related Projects**
   - Test with swagger-ui
   - Update swagger-ui dependency if needed

3. **Announce**
   - Update GitHub releases
   - Announce on community channels
   - Update documentation sites

---

## Troubleshooting

### Common Issues

**1. Strategy Not Matching**
- Check regex in `isOpenAPIXY()` predicate
- Verify `openapi` field format in spec
- Check strategy order in `src/resolver/index.js`

**2. $refs Not Resolving**
- Verify HTTP resolver is working
- Check parser detection regex
- Ensure baseURI is set correctly
- Check dereference strategy implementation

**3. Tests Failing**
- Ensure fixtures are valid OpenAPI X.Y specs
- Mock HTTP requests properly with `undici.MockAgent`
- Check for async/await issues
- Verify normalization is applied correctly

**4. Build Failures**
- Check for missing imports or circular dependencies
- Verify Babel transpilation
- Check webpack configuration for library externals
- Ensure browser field mappings are correct

**5. Bundle Size Too Large**
- Consider lazy-loading the new library
- Externalize library from UMD bundle
- Tree-shake unused code
- Check if library has smaller alternative

**6. Type Errors (if using TypeScript)**
- Add type definitions for new library
- Update interface exports
- Check for breaking type changes

---

## Best Practices

1. **Follow Existing Patterns**
   - Study OAS 3.1 implementation as reference
   - Maintain consistency with existing code style
   - Use same error handling patterns

2. **Test Thoroughly**
   - Write tests before implementation (TDD)
   - Cover edge cases (circular refs, missing fields, invalid specs)
   - Test all build artifacts
   - Test with real-world specs

3. **Document Everything**
   - Update all relevant documentation
   - Add inline comments for complex logic
   - Provide migration guide if needed

4. **Consider Backwards Compatibility**
   - Don't break existing API
   - Deprecate gracefully if changes needed
   - Version appropriately (semver)

5. **Performance**
   - Cache where possible (see OAS 3.1 WeakMap caching)
   - Avoid unnecessary transformations
   - Lazy-load heavy dependencies

6. **Security**
   - Validate external inputs
   - Sanitize URLs and file paths
   - Handle errors gracefully without exposing internals

---

## Estimated Timeline

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| 1. Dependencies and Setup | 1-2 days | None |
| 2. Version Detection | 1 day | Phase 1 |
| 3. Resolver Strategy | 3-7 days | Phase 2 |
| 4. Register Strategy | 1 day | Phase 3 |
| 5. Execution Logic | 2-5 days | Phase 3 |
| 6. Testing | 3-5 days | Phases 3-5 |
| 7. Documentation | 2-3 days | Phases 3-6 |
| 8. Build and CI | 1-2 days | All phases |
| 9. Commit and PR | 1 day | All phases |
| **Total** | **15-31 days** | - |

**Note:** Timeline varies based on:
- Complexity of new version (simple like 3.0 vs complex like 3.1)
- Whether new library is needed
- Amount of execution changes required
- Team size and experience

---

## Success Criteria

✅ **Strategy Implementation**
- [ ] New version detected correctly
- [ ] $refs resolve (internal and external)
- [ ] Circular references handled
- [ ] Normalization applied

✅ **Execution**
- [ ] Operations execute correctly
- [ ] Parameters serialized properly
- [ ] Security schemes work
- [ ] Server URLs templated correctly

✅ **Tests**
- [ ] 90%+ code coverage for new code
- [ ] All edge cases covered
- [ ] All build artifacts tested
- [ ] No test failures

✅ **Documentation**
- [ ] README updated
- [ ] CLAUDE.md updated
- [ ] Migration guide created (if needed)
- [ ] API documentation complete

✅ **Build**
- [ ] UMD bundle builds
- [ ] CommonJS builds
- [ ] ES modules build
- [ ] Bundle size acceptable (<5% increase)

✅ **Integration**
- [ ] Works with swagger-ui
- [ ] No breaking changes
- [ ] CI/CD passing

---

## References

### Commits to Study

**OAS 3.1 Implementation:**
- `ace708ac`: Initial ApiDOM integration
- `0ce91cc9`: ApiDOM JSON parser
- `f9f9222c`: ApiDOM YAML parser
- `f231a61e`: OpenAPI 3.1 JSON parser
- `48340c62`: OpenAPI 3.1 YAML parser
- `551c1010`: ApiDOM HTTP resolver
- `62b47456`: OpenAPI 3.1 dereference strategy
- `35e53d57`: Normalization for OAS 3.1
- `19ecbe43`: Main OAS 3.1 resolution support
- `c20b5264`: Subtree resolver adaptation
- `b7ddc50f`: Expose ApiDOM as public API

### Key Files to Reference

**Strategy Implementation:**
- `src/resolver/strategies/openapi-3-1-apidom/index.js`
- `src/resolver/strategies/openapi-3-1-apidom/resolve.js`
- `src/resolver/strategies/openapi-3-1-apidom/normalize.js`
- `src/resolver/strategies/openapi-3-0/index.js`
- `src/resolver/strategies/openapi-2/index.js`

**Helpers:**
- `src/helpers/openapi-predicates.js`
- `src/helpers/apidom/reference/`

**Tests:**
- `test/resolver/strategies/openapi-3-1-apidom/index.js`
- `test/execute/openapi-3-1.js`
- `test/resolver/apidom/`

### External Resources

- OpenAPI Specification: https://spec.openapis.org/
- ApiDOM Documentation: https://github.com/swagger-api/apidom
- SpecMap Library: Internal to swagger-js
- Conventional Commits: https://www.conventionalcommits.org/

---

## Questions or Issues?

If you encounter any issues or have questions:

1. Review the OAS 3.1 implementation as a reference
2. Check existing tests for patterns
3. Consult CLAUDE.md for project conventions
4. Open a GitHub discussion for architectural questions
5. Ask maintainers for guidance on complex decisions

---

**Skill Version:** 1.0
**Last Updated:** 2026-01-23
**Maintained By:** swagger-js maintainers