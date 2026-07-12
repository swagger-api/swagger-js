"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/includes"));
var _apidomCore = require("@swagger-api/apidom-core");
var _apidomError = require("@swagger-api/apidom-error");
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-1");
var _modern = require("@swagger-api/apidom-json-pointer/modern");
var _empty = require("@swagger-api/apidom-reference/configuration/empty");
var _openapi = require("@swagger-api/apidom-reference/dereference/strategies/openapi-3-1");
var _$anchor = require("@swagger-api/apidom-reference/dereference/strategies/openapi-3-1/selectors/$anchor");
var _uri = require("@swagger-api/apidom-reference/dereference/strategies/openapi-3-1/selectors/uri");
var _toPath = _interopRequireDefault(require("../utils/to-path.js"));
var _getRootCause = _interopRequireDefault(require("../utils/get-root-cause.js"));
var _refs = _interopRequireDefault(require("../../../../../../specmap/lib/refs.js"));
var _SchemaRefError = _interopRequireDefault(require("../errors/SchemaRefError.js"));
/* eslint-disable camelcase */

const {
  wrapError
} = _refs.default;
const visitAsync = _apidomCore.visit[Symbol.for('nodejs.util.promisify.custom')];

// initialize element identity manager
const identityManager = new _apidomCore.IdentityManager();

// custom mutation replacer
const mutationReplacer = (newElement, oldElement, key, parent) => {
  if ((0, _apidomCore.isMemberElement)(parent)) {
    parent.value = newElement; // eslint-disable-line no-param-reassign
  } else if (Array.isArray(parent)) {
    parent[key] = newElement; // eslint-disable-line no-param-reassign
  }
};
class OpenAPI3_1SwaggerClientDereferenceVisitor extends _openapi.OpenAPI3_1DereferenceVisitor {
  useCircularStructures;
  allowMetaPatches;
  basePath;
  constructor({
    allowMetaPatches = true,
    useCircularStructures = false,
    basePath = null,
    ...rest
  }) {
    super(rest);
    this.allowMetaPatches = allowMetaPatches;
    this.useCircularStructures = useCircularStructures;
    this.basePath = basePath;
  }
  async ReferenceElement(referencingElement, key, parent, path, ancestors, link) {
    try {
      var _context, _context2;
      // skip current referencing element as it's already been access
      if ((0, _includes.default)(_context = this.indirections).call(_context, referencingElement)) {
        return false;
      }
      const [ancestorsLineage, directAncestors] = this.toAncestorLineage([...ancestors, parent]);
      const retrievalURI = this.toBaseURI((0, _apidomCore.toValue)(referencingElement.$ref));
      const isInternalReference = _empty.url.stripHash(this.reference.uri) === retrievalURI;
      const isExternalReference = !isInternalReference;

      // ignore resolving internal Reference Objects
      if (!this.options.resolve.internal && isInternalReference) {
        return false;
      }
      // ignore resolving external Reference Objects
      if (!this.options.resolve.external && isExternalReference) {
        return false;
      }
      const reference = await this.toReference((0, _apidomCore.toValue)(referencingElement.$ref));
      const $refBaseURI = _empty.url.resolve(retrievalURI, (0, _apidomCore.toValue)(referencingElement.$ref));
      this.indirections.push(referencingElement);
      const jsonPointer = _modern.URIFragmentIdentifier.fromURIReference($refBaseURI);

      // possibly non-semantic fragment
      let referencedElement = (0, _modern.evaluate)(reference.value.result, jsonPointer);
      referencedElement.id = identityManager.identify(referencedElement);

      // applying semantics to a fragment
      if ((0, _apidomCore.isPrimitiveElement)(referencedElement)) {
        const referencedElementType = (0, _apidomCore.toValue)(referencingElement.meta.get('referenced-element'));
        const cacheKey = `${referencedElementType}-${(0, _apidomCore.toValue)(identityManager.identify(referencedElement))}`;
        if (this.refractCache.has(cacheKey)) {
          referencedElement = this.refractCache.get(cacheKey);
        } else if ((0, _apidomNsOpenapi.isReferenceLikeElement)(referencedElement)) {
          // handling indirect references
          referencedElement = _apidomNsOpenapi.ReferenceElement.refract(referencedElement);
          referencedElement.setMetaProperty('referenced-element', referencedElementType);
          this.refractCache.set(cacheKey, referencedElement);
        } else {
          // handling direct references
          const ElementClass = this.namespace.getElementClass(referencedElementType);
          referencedElement = ElementClass.refract(referencedElement);
          this.refractCache.set(cacheKey, referencedElement);
        }
      }

      // detect direct or indirect reference
      if (referencingElement === referencedElement) {
        throw new _apidomError.ApiDOMError('Recursive Reference Object detected');
      }

      // detect maximum depth of dereferencing
      if (this.indirections.length > this.options.dereference.maxDepth) {
        throw new _empty.MaximumDereferenceDepthError(`Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`);
      }

      // detect second deep dive into the same fragment and avoid it
      if ((0, _includes.default)(ancestorsLineage).call(ancestorsLineage, referencedElement)) {
        reference.refSet.circular = true;
        if (this.options.dereference.circular === 'error') {
          throw new _apidomError.ApiDOMError('Circular reference detected');
        } else if (this.options.dereference.circular === 'replace') {
          const refElement = new _apidomCore.RefElement(referencedElement.id, {
            type: 'reference',
            uri: reference.uri,
            $ref: (0, _apidomCore.toValue)(referencingElement.$ref),
            baseURI: $refBaseURI,
            referencingElement
          });
          const replacer = this.options.dereference.strategyOpts['openapi-3-1']?.circularReplacer ?? this.options.dereference.circularReplacer;
          const replacement = replacer(refElement);
          link.replaceWith(refElement, mutationReplacer);
          return !parent ? replacement : false;
        }
      }

      /**
       * Dive deep into the fragment.
       *
       * Cases to consider:
       *  1. We're crossing document boundary
       *  2. Fragment is from non-root document
       *  3. Fragment is a Reference Object. We need to follow it to get the eventual value
       *  4. We are dereferencing the fragment lazily/eagerly depending on circular mode
       */
      const isNonRootDocument = _empty.url.stripHash(reference.refSet.rootRef.uri) !== reference.uri;
      const shouldDetectCircular = (0, _includes.default)(_context2 = ['error', 'replace']).call(_context2, this.options.dereference.circular);
      if ((isExternalReference || isNonRootDocument || (0, _apidomNsOpenapi.isReferenceElement)(referencedElement) || shouldDetectCircular) && !ancestorsLineage.includesCycle(referencedElement)) {
        // append referencing reference to ancestors lineage
        directAncestors.add(referencingElement);
        const visitor = new OpenAPI3_1SwaggerClientDereferenceVisitor({
          reference,
          namespace: this.namespace,
          indirections: [...this.indirections],
          options: this.options,
          refractCache: this.refractCache,
          ancestors: ancestorsLineage,
          allowMetaPatches: this.allowMetaPatches,
          useCircularStructures: this.useCircularStructures,
          basePath: this.basePath ?? [...(0, _toPath.default)([...ancestors, parent, referencingElement]), '$ref']
        });
        referencedElement = await visitAsync(referencedElement, visitor, {
          keyMap: _apidomNsOpenapi.keyMap,
          nodeTypeGetter: _apidomNsOpenapi.getNodeType
        });

        // remove referencing reference from ancestors lineage
        directAncestors.delete(referencingElement);
      }
      this.indirections.pop();
      const mergedElement = (0, _apidomCore.cloneShallow)(referencedElement);

      // annotate fragment with info about original Reference element
      mergedElement.setMetaProperty('ref-fields', {
        $ref: (0, _apidomCore.toValue)(referencingElement.$ref),
        description: (0, _apidomCore.toValue)(referencingElement.description),
        summary: (0, _apidomCore.toValue)(referencingElement.summary)
      });
      // annotate fragment with info about origin
      mergedElement.setMetaProperty('ref-origin', reference.uri);
      // annotate fragment with info about referencing element
      mergedElement.setMetaProperty('ref-referencing-element-id', (0, _apidomCore.cloneDeep)(identityManager.identify(referencingElement)));

      // override description and summary (outer has higher priority then inner)
      if ((0, _apidomCore.isObjectElement)(referencedElement)) {
        if (referencingElement.hasKey('description') && 'description' in referencedElement) {
          mergedElement.remove('description');
          mergedElement.set('description', referencingElement.get('description'));
        }
        if (referencingElement.hasKey('summary') && 'summary' in referencedElement) {
          mergedElement.remove('summary');
          mergedElement.set('summary', referencingElement.get('summary'));
        }
      }

      // apply meta patches
      if (this.allowMetaPatches && (0, _apidomCore.isObjectElement)(mergedElement)) {
        // apply meta patch only when not already applied
        if (!mergedElement.hasKey('$$ref')) {
          const baseURI = _empty.url.resolve(retrievalURI, $refBaseURI);
          mergedElement.set('$$ref', baseURI);
        }
      }

      /**
       * Transclude referencing element with merged referenced element.
       */
      link.replaceWith(mergedElement, mutationReplacer);

      /**
       * We're at the root of the tree, so we're just replacing the entire tree.
       */
      return !parent ? mergedElement : false;
    } catch (error) {
      const rootCause = (0, _getRootCause.default)(error);
      const wrappedError = wrapError(rootCause, {
        baseDoc: this.reference.uri,
        $ref: (0, _apidomCore.toValue)(referencingElement.$ref),
        pointer: _modern.URIFragmentIdentifier.fromURIReference((0, _apidomCore.toValue)(referencingElement.$ref)),
        fullPath: this.basePath ?? [...(0, _toPath.default)([...ancestors, parent, referencingElement]), '$ref']
      });
      this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);
      return undefined;
    }
  }
  async PathItemElement(pathItemElement, key, parent, path, ancestors, link) {
    try {
      var _context3, _context4;
      // ignore PathItemElement without $ref field
      if (!(0, _apidomCore.isStringElement)(pathItemElement.$ref)) {
        return undefined;
      }

      // skip current referencing element as it's already been access
      if ((0, _includes.default)(_context3 = this.indirections).call(_context3, pathItemElement)) {
        return false;
      }

      // skip already identified cycled Path Item Objects
      if ((0, _apidomCore.includesClasses)(['cycle'], pathItemElement.$ref)) {
        return false;
      }
      const [ancestorsLineage, directAncestors] = this.toAncestorLineage([...ancestors, parent]);
      const retrievalURI = this.toBaseURI((0, _apidomCore.toValue)(pathItemElement.$ref));
      const isInternalReference = _empty.url.stripHash(this.reference.uri) === retrievalURI;
      const isExternalReference = !isInternalReference;

      // ignore resolving internal Path Item Elements
      if (!this.options.resolve.internal && isInternalReference) {
        return undefined;
      }
      // ignore resolving external Path Item Elements
      if (!this.options.resolve.external && isExternalReference) {
        return undefined;
      }
      const reference = await this.toReference((0, _apidomCore.toValue)(pathItemElement.$ref));
      const $refBaseURI = _empty.url.resolve(retrievalURI, (0, _apidomCore.toValue)(pathItemElement.$ref));
      this.indirections.push(pathItemElement);
      const jsonPointer = _modern.URIFragmentIdentifier.fromURIReference($refBaseURI);

      // possibly non-semantic referenced element
      let referencedElement = (0, _modern.evaluate)(reference.value.result, jsonPointer);
      referencedElement.id = identityManager.identify(referencedElement);

      // applying semantics to a referenced element
      if ((0, _apidomCore.isPrimitiveElement)(referencedElement)) {
        const cacheKey = `path-item-${(0, _apidomCore.toValue)(identityManager.identify(referencedElement))}`;
        if (this.refractCache.has(cacheKey)) {
          referencedElement = this.refractCache.get(cacheKey);
        } else {
          referencedElement = _apidomNsOpenapi.PathItemElement.refract(referencedElement);
          this.refractCache.set(cacheKey, referencedElement);
        }
      }

      // detect direct or indirect reference
      if (pathItemElement === referencedElement) {
        throw new _apidomError.ApiDOMError('Recursive Path Item Object reference detected');
      }

      // detect maximum depth of dereferencing
      if (this.indirections.length > this.options.dereference.maxDepth) {
        throw new _empty.MaximumDereferenceDepthError(`Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`);
      }

      // detect second deep dive into the same fragment and avoid it
      if ((0, _includes.default)(ancestorsLineage).call(ancestorsLineage, referencedElement)) {
        reference.refSet.circular = true;
        if (this.options.dereference.circular === 'error') {
          throw new _apidomError.ApiDOMError('Circular reference detected');
        } else if (this.options.dereference.circular === 'replace') {
          const refElement = new _apidomCore.RefElement(referencedElement.id, {
            type: 'path-item',
            uri: reference.uri,
            $ref: (0, _apidomCore.toValue)(pathItemElement.$ref),
            baseURI: $refBaseURI,
            referencingElement: pathItemElement
          });
          const replacer = this.options.dereference.strategyOpts['openapi-3-1']?.circularReplacer ?? this.options.dereference.circularReplacer;
          const replacement = replacer(refElement);
          link.replaceWith(refElement, mutationReplacer);
          return !parent ? replacement : false;
        }
      }

      /**
       * Dive deep into the fragment.
       *
       * Cases to consider:
       *  1. We're crossing document boundary
       *  2. Fragment is from non-root document
       *  3. Fragment is a Path Item Object with $ref field. We need to follow it to get the eventual value
       *  4. We are dereferencing the fragment lazily/eagerly depending on circular mode
       */
      const isNonRootDocument = _empty.url.stripHash(reference.refSet.rootRef.uri) !== reference.uri;
      const shouldDetectCircular = (0, _includes.default)(_context4 = ['error', 'replace']).call(_context4, this.options.dereference.circular);
      if ((isExternalReference || isNonRootDocument || (0, _apidomNsOpenapi.isPathItemElement)(referencedElement) && (0, _apidomCore.isStringElement)(referencedElement.$ref) || shouldDetectCircular) && !ancestorsLineage.includesCycle(referencedElement)) {
        // append referencing schema to ancestors lineage
        directAncestors.add(pathItemElement);

        // dive deep into the referenced element
        const visitor = new OpenAPI3_1SwaggerClientDereferenceVisitor({
          reference,
          namespace: this.namespace,
          indirections: [...this.indirections],
          options: this.options,
          ancestors: ancestorsLineage,
          allowMetaPatches: this.allowMetaPatches,
          useCircularStructures: this.useCircularStructures,
          basePath: this.basePath ?? [...(0, _toPath.default)([...ancestors, parent, pathItemElement]), '$ref']
        });
        referencedElement = await visitAsync(referencedElement, visitor, {
          keyMap: _apidomNsOpenapi.keyMap,
          nodeTypeGetter: _apidomNsOpenapi.getNodeType
        });

        // remove referencing schema from ancestors lineage
        directAncestors.delete(pathItemElement);
      }
      this.indirections.pop();

      /**
       * Creating a new version of Path Item by merging fields from referenced Path Item with referencing one.
       */
      if ((0, _apidomNsOpenapi.isPathItemElement)(referencedElement)) {
        const mergedElement = new _apidomNsOpenapi.PathItemElement([...referencedElement.content], (0, _apidomCore.cloneDeep)(referencedElement.meta), (0, _apidomCore.cloneDeep)(referencedElement.attributes));
        // existing keywords from referencing PathItemElement overrides ones from referenced element
        pathItemElement.forEach((value, keyElement, item) => {
          mergedElement.remove((0, _apidomCore.toValue)(keyElement));
          mergedElement.content.push(item);
        });
        mergedElement.remove('$ref');

        // annotate referenced element with info about original referencing element
        mergedElement.setMetaProperty('ref-fields', {
          $ref: (0, _apidomCore.toValue)(pathItemElement.$ref)
        });
        // annotate referenced element with info about origin
        mergedElement.setMetaProperty('ref-origin', reference.uri);
        // annotate fragment with info about referencing element
        mergedElement.setMetaProperty('ref-referencing-element-id', (0, _apidomCore.cloneDeep)(identityManager.identify(pathItemElement)));

        // apply meta patches
        if (this.allowMetaPatches) {
          // apply meta patch only when not already applied
          if (typeof mergedElement.get('$$ref') === 'undefined') {
            const baseURI = _empty.url.resolve(retrievalURI, $refBaseURI);
            mergedElement.set('$$ref', baseURI);
          }
        }
        referencedElement = mergedElement;
      }

      /**
       * Transclude referencing element with merged referenced element.
       */
      link.replaceWith(referencedElement, mutationReplacer);

      /**
       * We're at the root of the tree, so we're just replacing the entire tree.
       */
      return !parent ? referencedElement : undefined;
    } catch (error) {
      const rootCause = (0, _getRootCause.default)(error);
      const wrappedError = wrapError(rootCause, {
        baseDoc: this.reference.uri,
        $ref: (0, _apidomCore.toValue)(pathItemElement.$ref),
        pointer: _modern.URIFragmentIdentifier.fromURIReference((0, _apidomCore.toValue)(pathItemElement.$ref)),
        fullPath: this.basePath ?? [...(0, _toPath.default)([...ancestors, parent, pathItemElement]), '$ref']
      });
      this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);
      return undefined;
    }
  }
  async SchemaElement(referencingElement, key, parent, path, ancestors, link) {
    try {
      var _context5, _context6;
      // skip current referencing schema as $ref keyword was not defined
      if (!(0, _apidomCore.isStringElement)(referencingElement.$ref)) {
        // skip traversing this schema but traverse all it's child schemas
        return undefined;
      }

      // skip current referencing element as it's already been access
      if ((0, _includes.default)(_context5 = this.indirections).call(_context5, referencingElement)) {
        return false;
      }
      const [ancestorsLineage, directAncestors] = this.toAncestorLineage([...ancestors, parent]);

      // compute baseURI using rules around $id and $ref keywords
      let reference = await this.toReference(_empty.url.unsanitize(this.reference.uri));
      let {
        uri: retrievalURI
      } = reference;
      const $refBaseURI = (0, _openapi.resolveSchema$refField)(retrievalURI, referencingElement);
      const $refBaseURIStrippedHash = _empty.url.stripHash($refBaseURI);
      const file = new _empty.File({
        uri: $refBaseURIStrippedHash
      });
      const isUnknownURI = !this.options.resolve.resolvers.some(r => r.canRead(file));
      const isURL = !isUnknownURI;
      let isInternalReference = _empty.url.stripHash(this.reference.uri) === $refBaseURI;
      let isExternalReference = !isInternalReference;
      this.indirections.push(referencingElement);

      // determining reference, proper evaluation and selection mechanism
      let referencedElement;
      try {
        if (isUnknownURI || isURL) {
          // we're dealing with canonical URI or URL with possible fragment
          retrievalURI = this.toBaseURI($refBaseURI);
          const selector = $refBaseURI;
          const referenceAsSchema = (0, _openapi.maybeRefractToSchemaElement)(reference.value.result);
          referencedElement = (0, _uri.evaluate)(selector, referenceAsSchema);
          referencedElement = (0, _openapi.maybeRefractToSchemaElement)(referencedElement);
          referencedElement.id = identityManager.identify(referencedElement);

          // ignore resolving internal Schema Objects
          if (!this.options.resolve.internal && isInternalReference) {
            // skip traversing this schema element but traverse all it's child elements
            return undefined;
          }
          // ignore resolving external Schema Objects
          if (!this.options.resolve.external && isExternalReference) {
            // skip traversing this schema element but traverse all it's child elements
            return undefined;
          }
        } else {
          // we're assuming here that we're dealing with JSON Pointer here
          retrievalURI = this.toBaseURI($refBaseURI);
          isInternalReference = _empty.url.stripHash(this.reference.uri) === retrievalURI;
          isExternalReference = !isInternalReference;

          // ignore resolving internal Schema Objects
          if (!this.options.resolve.internal && isInternalReference) {
            // skip traversing this schema element but traverse all it's child elements
            return undefined;
          }
          // ignore resolving external Schema Objects
          if (!this.options.resolve.external && isExternalReference) {
            // skip traversing this schema element but traverse all it's child elements
            return undefined;
          }
          reference = await this.toReference(_empty.url.unsanitize($refBaseURI));
          const selector = _modern.URIFragmentIdentifier.fromURIReference($refBaseURI);
          const referenceAsSchema = (0, _openapi.maybeRefractToSchemaElement)(reference.value.result);
          referencedElement = (0, _modern.evaluate)(referenceAsSchema, selector);
          referencedElement = (0, _openapi.maybeRefractToSchemaElement)(referencedElement);
          referencedElement.id = identityManager.identify(referencedElement);
        }
      } catch (error) {
        /**
         * No SchemaElement($id=URL) was not found, so we're going to try to resolve
         * the URL and assume the returned response is a JSON Schema.
         */
        if (isURL && error instanceof _uri.EvaluationJsonSchemaUriError) {
          if ((0, _$anchor.isAnchor)((0, _$anchor.uriToAnchor)($refBaseURI))) {
            // we're dealing with JSON Schema $anchor here
            isInternalReference = _empty.url.stripHash(this.reference.uri) === retrievalURI;
            isExternalReference = !isInternalReference;

            // ignore resolving internal Schema Objects
            if (!this.options.resolve.internal && isInternalReference) {
              // skip traversing this schema element but traverse all it's child elements
              return undefined;
            }
            // ignore resolving external Schema Objects
            if (!this.options.resolve.external && isExternalReference) {
              // skip traversing this schema element but traverse all it's child elements
              return undefined;
            }
            reference = await this.toReference(_empty.url.unsanitize($refBaseURI));
            const selector = (0, _$anchor.uriToAnchor)($refBaseURI);
            const referenceAsSchema = (0, _openapi.maybeRefractToSchemaElement)(reference.value.result);
            referencedElement = (0, _$anchor.evaluate)(selector, referenceAsSchema);
            referencedElement = (0, _openapi.maybeRefractToSchemaElement)(referencedElement);
            referencedElement.id = identityManager.identify(referencedElement);
          } else {
            // we're assuming here that we're dealing with JSON Pointer here
            retrievalURI = this.toBaseURI((0, _apidomCore.toValue)($refBaseURI));
            isInternalReference = _empty.url.stripHash(this.reference.uri) === retrievalURI;
            isExternalReference = !isInternalReference;

            // ignore resolving internal Schema Objects
            if (!this.options.resolve.internal && isInternalReference) {
              // skip traversing this schema element but traverse all it's child elements
              return undefined;
            }
            // ignore resolving external Schema Objects
            if (!this.options.resolve.external && isExternalReference) {
              // skip traversing this schema element but traverse all it's child elements
              return undefined;
            }
            reference = await this.toReference(_empty.url.unsanitize($refBaseURI));
            const selector = _modern.URIFragmentIdentifier.fromURIReference($refBaseURI);
            const referenceAsSchema = (0, _openapi.maybeRefractToSchemaElement)(reference.value.result);
            referencedElement = (0, _modern.evaluate)(referenceAsSchema, selector);
            referencedElement = (0, _openapi.maybeRefractToSchemaElement)(referencedElement);
            referencedElement.id = identityManager.identify(referencedElement);
          }
        } else {
          throw error;
        }
      }

      // detect direct or indirect reference
      if (referencingElement === referencedElement) {
        throw new _apidomError.ApiDOMError('Recursive Schema Object reference detected');
      }

      // detect maximum depth of dereferencing
      if (this.indirections.length > this.options.dereference.maxDepth) {
        throw new _empty.MaximumDereferenceDepthError(`Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`);
      }

      // detect second deep dive into the same fragment and avoid it
      if ((0, _includes.default)(ancestorsLineage).call(ancestorsLineage, referencedElement)) {
        reference.refSet.circular = true;
        if (this.options.dereference.circular === 'error') {
          throw new _apidomError.ApiDOMError('Circular reference detected');
        } else if (this.options.dereference.circular === 'replace') {
          const refElement = new _apidomCore.RefElement(referencedElement.id, {
            type: 'json-schema',
            uri: reference.uri,
            $ref: (0, _apidomCore.toValue)(referencingElement.$ref),
            baseURI: _empty.url.resolve(retrievalURI, $refBaseURI),
            referencingElement
          });
          const replacer = this.options.dereference.strategyOpts['openapi-3-1']?.circularReplacer ?? this.options.dereference.circularReplacer;
          const replacement = replacer(refElement);
          link.replaceWith(replacement, mutationReplacer);
          return !parent ? replacement : false;
        }
      }

      /**
       * Dive deep into the fragment.
       *
       * Cases to consider:
       *  1. We're crossing document boundary
       *  2. Fragment is from non-root document
       *  3. Fragment is a Schema Object with $ref field. We need to follow it to get the eventual value
       *  4. We are dereferencing the fragment lazily/eagerly depending on circular mode
       */
      const isNonRootDocument = _empty.url.stripHash(reference.refSet.rootRef.uri) !== reference.uri;
      const shouldDetectCircular = (0, _includes.default)(_context6 = ['error', 'replace']).call(_context6, this.options.dereference.circular);
      if ((isExternalReference || isNonRootDocument || (0, _apidomNsOpenapi.isSchemaElement)(referencedElement) && (0, _apidomCore.isStringElement)(referencedElement.$ref) || shouldDetectCircular) && !ancestorsLineage.includesCycle(referencedElement)) {
        // append referencing schema to ancestors lineage
        directAncestors.add(referencingElement);

        // dive deep into the fragment
        const mergeVisitor = new OpenAPI3_1SwaggerClientDereferenceVisitor({
          reference,
          namespace: this.namespace,
          indirections: [...this.indirections],
          options: this.options,
          useCircularStructures: this.useCircularStructures,
          allowMetaPatches: this.allowMetaPatches,
          ancestors: ancestorsLineage,
          basePath: this.basePath ?? [...(0, _toPath.default)([...ancestors, parent, referencingElement]), '$ref']
        });
        referencedElement = await visitAsync(referencedElement, mergeVisitor, {
          keyMap: _apidomNsOpenapi.keyMap,
          nodeTypeGetter: _apidomNsOpenapi.getNodeType
        });

        // remove referencing schema from ancestors lineage
        directAncestors.delete(referencingElement);
      }
      this.indirections.pop();
      if ((0, _apidomNsOpenapi.isBooleanJsonSchemaElement)(referencedElement)) {
        const booleanJsonSchemaElement = (0, _apidomCore.cloneDeep)(referencedElement);
        // annotate referenced element with info about original referencing element
        booleanJsonSchemaElement.setMetaProperty('ref-fields', {
          $ref: (0, _apidomCore.toValue)(referencingElement.$ref)
        });
        // annotate referenced element with info about origin
        booleanJsonSchemaElement.setMetaProperty('ref-origin', reference.uri);
        // annotate fragment with info about referencing element
        booleanJsonSchemaElement.setMetaProperty('ref-referencing-element-id', (0, _apidomCore.cloneDeep)(identityManager.identify(referencingElement)));
        link.replaceWith(booleanJsonSchemaElement, mutationReplacer);
        return !parent ? booleanJsonSchemaElement : false;
      }

      /**
       * Creating a new version of Schema Object by merging fields from referenced Schema Object with referencing one.
       */
      if ((0, _apidomNsOpenapi.isSchemaElement)(referencedElement)) {
        // Schema Object - merge keywords from referenced schema with referencing schema
        const mergedElement = new _apidomNsOpenapi.SchemaElement([...referencedElement.content], (0, _apidomCore.cloneDeep)(referencedElement.meta), (0, _apidomCore.cloneDeep)(referencedElement.attributes));
        // existing keywords from referencing schema overrides ones from referenced schema
        referencingElement.forEach((value, keyElement, item) => {
          mergedElement.remove((0, _apidomCore.toValue)(keyElement));
          mergedElement.content.push(item);
        });
        mergedElement.remove('$ref');
        // annotate referenced element with info about original referencing element
        mergedElement.setMetaProperty('ref-fields', {
          $ref: (0, _apidomCore.toValue)(referencingElement.$ref)
        });
        // annotate fragment with info about origin
        mergedElement.setMetaProperty('ref-origin', reference.uri);
        // annotate fragment with info about referencing element
        mergedElement.setMetaProperty('ref-referencing-element-id', (0, _apidomCore.cloneDeep)(identityManager.identify(referencingElement)));

        // allowMetaPatches option processing
        if (this.allowMetaPatches) {
          // apply meta patch only when not already applied
          if (typeof mergedElement.get('$$ref') === 'undefined') {
            const baseURI = _empty.url.resolve(retrievalURI, $refBaseURI);
            mergedElement.set('$$ref', baseURI);
          }
        }
        referencedElement = mergedElement;
      }

      /**
       * Transclude referencing element with merged referenced element.
       */
      link.replaceWith(referencedElement, mutationReplacer);

      /**
       * We're at the root of the tree, so we're just replacing the entire tree.
       */
      return !parent ? referencedElement : undefined;
    } catch (error) {
      const rootCause = (0, _getRootCause.default)(error);
      const wrappedError = new _SchemaRefError.default(`Could not resolve reference: ${rootCause.message}`, {
        baseDoc: this.reference.uri,
        $ref: (0, _apidomCore.toValue)(referencingElement.$ref),
        fullPath: this.basePath ?? [...(0, _toPath.default)([...ancestors, parent, referencingElement]), '$ref'],
        cause: rootCause
      });
      this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);
      return undefined;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async LinkElement() {
    /**
     * OpenApi3_1DereferenceVisitor is doing lookup of Operation Objects
     * and assigns them to Link Object metadata. This is not needed in
     * swagger-client context, so we're disabling it here.
     */
    return undefined;
  }
  async ExampleElement(exampleElement, key, parent, path, ancestors, link) {
    try {
      return await super.ExampleElement(exampleElement, key, parent, path, ancestors, link);
    } catch (error) {
      const rootCause = (0, _getRootCause.default)(error);
      const wrappedError = wrapError(rootCause, {
        baseDoc: this.reference.uri,
        externalValue: (0, _apidomCore.toValue)(exampleElement.externalValue),
        fullPath: this.basePath ?? [...(0, _toPath.default)([...ancestors, parent, exampleElement]), 'externalValue']
      });
      this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);
      return undefined;
    }
  }
}
var _default = exports.default = OpenAPI3_1SwaggerClientDereferenceVisitor;
/* eslint-enable camelcase */