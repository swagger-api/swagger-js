# Swagger Client <img src="https://raw.githubusercontent.com/swagger-api/swagger.io/wordpress/images/assets/SW-logo-clr.png" height="50" align="right">

[![Build Status](https://github.com/swagger-api/swagger-js/actions/workflows/nodejs.yml/badge.svg)](https://github.com/swagger-api/swagger-js/actions)

**Swagger Client** is a JavaScript module that allows you to fetch, resolve, and interact with Swagger/OpenAPI documents.

## New!

**This is the new version of swagger-js, 3.x.** The new version supports Swagger 2.0 as well as OpenAPI 3.

Want to learn more? Check out our [FAQ](docs/migration/migration-2-x-to-3-x.md).

For features known to be missing from 3.x please see the [Graveyard](docs/migration/graveyard-3-x.md).


For the older version of swagger-js, refer to the [*2.x branch*](https://github.com/swagger-api/swagger-js/tree/2.x).

> *The npm package is called `swagger-client` and the GitHub repository is `swagger-js`.
We'll be consolidating that soon. Just giving you the heads up. You may see references to both names.*

## Compatibility
The OpenAPI Specification has undergone multiple revisions since initial creation in 2010. 
Compatibility between Swagger Client and the OpenAPI Specification is as follows:

Swagger Client Version | Release Date | OpenAPI Spec compatibility | Notes
------------------ | ------------ | -------------------------- | -----
3.10.x | 2020-01-17 | 2.0, 3.0.0, 3.0.1, 3.0.2, 3.0.3 | [tag v3.10.0](https://github.com/swagger-api/swagger-js/tree/v3.10.0)
2.1.32 | 2017-01-12 | 1.0, 1.1, 1.2 | [tag v2.1.32](https://github.com/swagger-api/swagger-js/tree/v2.1.32). This [release](https://github.com/swagger-api/swagger-js/releases/tag/v2.1.32) is only available on GitHub.

## Documentation

#### Usage

- [Installation](docs/usage/installation.md)
- [Tags Interface](docs/usage/tags-interface.md)
- [HTTP client for OAS operations](docs/usage/http-client-for-oas-operations.md)
- [OpenAPI Definition Resolver](docs/usage/openapi-definition-resolver.md)
- [HTTP Client](docs/usage/http-client.md)
- [Swagger Client API](docs/usage/api.md)

#### Development

- [Contributing](https://github.com/swagger-api/.github/blob/master/CONTRIBUTING.md)
- [Setting up](docs/development/setting-up.md)
- [Scripts](docs/development/scripts.md)

#### Migrations 

- [Migration guide](docs/migration/migration-2-x-to-3-x.md)
- [Graveyard](docs/migration/graveyard-3-x.md)

### Runtime 

- Node.js `>=` 12.4.x
- `swagger-client` works in the latest versions of Chrome, Safari, Firefox, and Edge.

## Security contact

Please disclose any security-related issues or vulnerabilities by emailing [security@swagger.io](mailto:security@swagger.io), instead of using the public issue tracker.
