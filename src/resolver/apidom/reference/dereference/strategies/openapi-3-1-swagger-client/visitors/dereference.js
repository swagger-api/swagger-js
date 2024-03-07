/* eslint-disable camelcase */
import {
  isObjectElement,
  isPrimitiveElement,
  isStringElement,
  isMemberElement,
  IdentityManager,
  visit,
  includesClasses,
  toValue,
  cloneShallow,
  cloneDeep,
} from '@swagger-api/apidom-core';
import { ApiDOMError } from '@swagger-api/apidom-error';
import {
  isReferenceLikeElement,
  isBooleanJsonSchemaElement,
  ReferenceElement,
  PathItemElement,
  SchemaElement,
  getNodeType,
  keyMap,
} from '@swagger-api/apidom-ns-openapi-3-1';
import { evaluate as jsonPointerEvaluate, uriToPointer } from '@swagger-api/apidom-json-pointer';
import {
  url,
  MaximumDereferenceDepthError,
  File,
} from '@swagger-api/apidom-reference/configuration/empty';
import {
  OpenApi3_1DereferenceVisitor,
  resolveSchema$refField,
  maybeRefractToSchemaElement,
} from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1';
import {
  isAnchor,
  uriToAnchor,
  evaluate as $anchorEvaluate,
} from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1/selectors/$anchor';
import {
  evaluate as uriEvaluate,
  EvaluationJsonSchemaUriError,
} from '@swagger-api/apidom-reference/dereference/strategies/openapi-3-1/selectors/uri';

import toPath from '../utils/to-path.js';
import getRootCause from '../utils/get-root-cause.js';
import specMapMod from '../../../../../../../specmap/lib/refs.js';
import { SchemaRefError } from '../errors/index.js';

const { wrapError } = specMapMod;

const visitAsync = visit[Symbol.for('nodejs.util.promisify.custom')];

// initialize element identity manager
const identityManager = IdentityManager();

/**
 * Predicate for detecting if element was created by merging referencing
 * element with particular element identity with a referenced element.
 */
const wasReferencedBy = (referencingElement) => (element) =>
  element.meta.hasKey('ref-referencing-element-id') &&
  element.meta
    .get('ref-referencing-element-id')
    .equals(toValue(identityManager.identify(referencingElement)));

const OpenApi3_1SwaggerClientDereferenceVisitor = OpenApi3_1DereferenceVisitor.compose({
  props: {
    useCircularStructures: true,
    allowMetaPatches: false,
    basePath: null,
  },
  init({
    allowMetaPatches = this.allowMetaPatches,
    useCircularStructures = this.useCircularStructures,
    basePath = this.basePath,
  }) {
    this.allowMetaPatches = allowMetaPatches;
    this.useCircularStructures = useCircularStructures;
    this.basePath = basePath;
  },
  methods: {
    async ReferenceElement(referencingElement, key, parent, path, ancestors) {
      try {
        const [ancestorsLineage, directAncestors] = this.toAncestorLineage([...ancestors, parent]);

        // skip already identified cycled Path Item Objects
        if (includesClasses(['cycle'], referencingElement.$ref)) {
          return false;
        }

        // detect possible cycle in traversal and avoid it
        if (ancestorsLineage.includesCycle(referencingElement)) {
          return false;
        }

        const retrievalURI = this.toBaseURI(toValue(referencingElement.$ref));
        const isInternalReference = url.stripHash(this.reference.uri) === retrievalURI;
        const isExternalReference = !isInternalReference;

        // ignore resolving internal Reference Objects
        if (!this.options.resolve.internal && isInternalReference) {
          return false;
        }
        // ignore resolving external Reference Objects
        if (!this.options.resolve.external && isExternalReference) {
          return false;
        }

        const reference = await this.toReference(toValue(referencingElement.$ref));
        const $refBaseURI = url.resolve(retrievalURI, toValue(referencingElement.$ref));

        this.indirections.push(referencingElement);

        const jsonPointer = uriToPointer($refBaseURI);

        // possibly non-semantic fragment
        let referencedElement = jsonPointerEvaluate(jsonPointer, reference.value.result);

        // applying semantics to a fragment
        if (isPrimitiveElement(referencedElement)) {
          const referencedElementType = toValue(referencingElement.meta.get('referenced-element'));
          const cacheKey = `${referencedElementType}-${toValue(identityManager.identify(referencedElement))}`;

          if (this.refractCache.has(cacheKey)) {
            referencedElement = this.refractCache.get(cacheKey);
          } else if (isReferenceLikeElement(referencedElement)) {
            // handling indirect references
            referencedElement = ReferenceElement.refract(referencedElement);
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
        if (this.indirections.includes(referencedElement)) {
          throw new ApiDOMError('Recursive JSON Pointer detected');
        }

        // detect maximum depth of dereferencing
        if (this.indirections.length > this.options.dereference.maxDepth) {
          throw new MaximumDereferenceDepthError(
            `Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`
          );
        }

        if (!this.useCircularStructures) {
          const hasCycles = ancestorsLineage.includes(referencedElement);
          if (hasCycles) {
            if (url.isHttpUrl(retrievalURI) || url.isFileSystemPath(retrievalURI)) {
              // make the referencing URL or file system path absolute
              const cycledReferenceElement = new ReferenceElement(
                { $ref: $refBaseURI },
                cloneDeep(referencingElement.meta),
                cloneDeep(referencingElement.attributes)
              );
              cycledReferenceElement.get('$ref').classes.push('cycle');
              return cycledReferenceElement;
            }
            // skip processing this reference
            return false;
          }
        }

        // append referencing schema to ancestors lineage
        directAncestors.add(referencingElement);

        // dive deep into the fragment
        const visitor = OpenApi3_1SwaggerClientDereferenceVisitor({
          reference,
          namespace: this.namespace,
          indirections: [...this.indirections],
          options: this.options,
          ancestors: ancestorsLineage,
          allowMetaPatches: this.allowMetaPatches,
          useCircularStructures: this.useCircularStructures,
          basePath: this.basePath ?? [
            ...toPath([...ancestors, parent, referencingElement]),
            '$ref',
          ],
        });
        referencedElement = await visitAsync(referencedElement, visitor, {
          keyMap,
          nodeTypeGetter: getNodeType,
        });

        // remove referencing schema from ancestors lineage
        directAncestors.delete(referencingElement);

        this.indirections.pop();

        const mergeAndAnnotateReferencedElement = (refedElement) => {
          const copy = cloneShallow(refedElement);

          // annotate fragment with info about original Reference element
          copy.setMetaProperty('ref-fields', {
            $ref: toValue(referencingElement.$ref),
            description: toValue(referencingElement.description),
            summary: toValue(referencingElement.summary),
          });
          // annotate fragment with info about origin
          copy.setMetaProperty('ref-origin', reference.uri);
          // annotate fragment with info about referencing element
          copy.setMetaProperty(
            'ref-referencing-element-id',
            cloneDeep(identityManager.identify(referencingElement))
          );

          // override description and summary (outer has higher priority then inner)
          if (isObjectElement(refedElement)) {
            if (referencingElement.hasKey('description') && 'description' in refedElement) {
              copy.remove('description');
              copy.set('description', referencingElement.get('description'));
            }
            if (referencingElement.hasKey('summary') && 'summary' in refedElement) {
              copy.remove('summary');
              copy.set('summary', referencingElement.get('summary'));
            }
          }

          // apply meta patches
          if (this.allowMetaPatches && isObjectElement(copy)) {
            // apply meta patch only when not already applied
            if (!copy.hasKey('$$ref')) {
              const baseURI = url.resolve(retrievalURI, $refBaseURI);
              copy.set('$$ref', baseURI);
            }
          }

          return copy;
        };

        // attempting to create cycle
        if (
          ancestorsLineage.includes(referencingElement) ||
          ancestorsLineage.includes(referencedElement)
        ) {
          const replaceWith =
            ancestorsLineage.findItem(wasReferencedBy(referencingElement)) ??
            mergeAndAnnotateReferencedElement(referencedElement);
          if (isMemberElement(parent)) {
            parent.value = replaceWith; // eslint-disable-line no-param-reassign
          } else if (Array.isArray(parent)) {
            parent[key] = replaceWith; // eslint-disable-line no-param-reassign
          }
          return false;
        }

        // transclude the element for a fragment
        return mergeAndAnnotateReferencedElement(referencedElement);
      } catch (error) {
        const rootCause = getRootCause(error);
        const wrappedError = wrapError(rootCause, {
          baseDoc: this.reference.uri,
          $ref: toValue(referencingElement.$ref),
          pointer: uriToPointer(toValue(referencingElement.$ref)),
          fullPath: this.basePath ?? [
            ...toPath([...ancestors, parent, referencingElement]),
            '$ref',
          ],
        });
        this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);

        return undefined;
      }
    },

    async PathItemElement(pathItemElement, key, parent, path, ancestors) {
      try {
        const [ancestorsLineage, directAncestors] = this.toAncestorLineage([...ancestors, parent]);

        // ignore PathItemElement without $ref field
        if (!isStringElement(pathItemElement.$ref)) {
          return undefined;
        }

        // skip already identified cycled Path Item Objects
        if (includesClasses(['cycle'], pathItemElement.$ref)) {
          return false;
        }

        // detect possible cycle in traversal and avoid it
        if (ancestorsLineage.includesCycle(pathItemElement)) {
          return false;
        }

        const retrievalURI = this.toBaseURI(toValue(pathItemElement.$ref));
        const isInternalReference = url.stripHash(this.reference.uri) === retrievalURI;
        const isExternalReference = !isInternalReference;

        // ignore resolving internal Path Item Elements
        if (!this.options.resolve.internal && isInternalReference) {
          return undefined;
        }
        // ignore resolving external Path Item Elements
        if (!this.options.resolve.external && isExternalReference) {
          return undefined;
        }

        const reference = await this.toReference(toValue(pathItemElement.$ref));
        const $refBaseURI = url.resolve(retrievalURI, toValue(pathItemElement.$ref));

        this.indirections.push(pathItemElement);

        const jsonPointer = uriToPointer($refBaseURI);

        // possibly non-semantic referenced element
        let referencedElement = jsonPointerEvaluate(jsonPointer, reference.value.result);

        // applying semantics to a referenced element
        if (isPrimitiveElement(referencedElement)) {
          const cacheKey = `pathItem-${toValue(identityManager.identify(referencedElement))}`;

          if (this.refractCache.has(cacheKey)) {
            referencedElement = this.refractCache.get(cacheKey);
          } else {
            referencedElement = PathItemElement.refract(referencedElement);
            this.refractCache.set(cacheKey, referencedElement);
          }
        }

        // detect direct or indirect reference
        if (this.indirections.includes(referencedElement)) {
          throw new ApiDOMError('Recursive JSON Pointer detected');
        }

        // detect maximum depth of dereferencing
        if (this.indirections.length > this.options.dereference.maxDepth) {
          throw new MaximumDereferenceDepthError(
            `Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`
          );
        }

        if (!this.useCircularStructures) {
          const hasCycles = ancestorsLineage.includes(referencedElement);
          if (hasCycles) {
            if (url.isHttpUrl(retrievalURI) || url.isFileSystemPath(retrievalURI)) {
              // make the referencing URL or file system path absolute
              const cycledPathItemElement = new PathItemElement(
                { $ref: $refBaseURI },
                cloneDeep(pathItemElement.meta),
                cloneDeep(pathItemElement.attributes)
              );
              cycledPathItemElement.get('$ref').classes.push('cycle');
              return cycledPathItemElement;
            }
            // skip processing this path item and all it's child elements
            return false;
          }
        }

        // append referencing schema to ancestors lineage
        directAncestors.add(pathItemElement);

        // dive deep into the referenced element
        const visitor = OpenApi3_1SwaggerClientDereferenceVisitor({
          reference,
          namespace: this.namespace,
          indirections: [...this.indirections],
          options: this.options,
          ancestors: ancestorsLineage,
          allowMetaPatches: this.allowMetaPatches,
          useCircularStructures: this.useCircularStructures,
          basePath: this.basePath ?? [...toPath([...ancestors, parent, pathItemElement]), '$ref'],
        });
        referencedElement = await visitAsync(referencedElement, visitor, {
          keyMap,
          nodeTypeGetter: getNodeType,
        });

        // remove referencing schema from ancestors lineage
        directAncestors.delete(pathItemElement);

        this.indirections.pop();

        const mergeAndAnnotateReferencedElement = (refedElement) => {
          // merge fields from referenced Path Item with referencing one
          const mergedElement = new PathItemElement(
            [...refedElement.content],
            cloneDeep(refedElement.meta),
            cloneDeep(refedElement.attributes)
          );
          // existing keywords from referencing PathItemElement overrides ones from referenced element
          pathItemElement.forEach((value, keyElement, item) => {
            mergedElement.remove(toValue(keyElement));
            mergedElement.content.push(item);
          });
          mergedElement.remove('$ref');

          // annotate referenced element with info about original referencing element
          mergedElement.setMetaProperty('ref-fields', {
            $ref: toValue(pathItemElement.$ref),
          });
          // annotate referenced element with info about origin
          mergedElement.setMetaProperty('ref-origin', reference.uri);
          // annotate fragment with info about referencing element
          mergedElement.setMetaProperty(
            'ref-referencing-element-id',
            cloneDeep(identityManager.identify(pathItemElement))
          );

          // apply meta patches
          if (this.allowMetaPatches) {
            // apply meta patch only when not already applied
            if (typeof mergedElement.get('$$ref') === 'undefined') {
              const baseURI = url.resolve(retrievalURI, $refBaseURI);
              mergedElement.set('$$ref', baseURI);
            }
          }

          return mergedElement;
        };

        // attempting to create cycle
        if (
          ancestorsLineage.includes(pathItemElement) ||
          ancestorsLineage.includes(referencedElement)
        ) {
          const replaceWith =
            ancestorsLineage.findItem(wasReferencedBy(pathItemElement)) ??
            mergeAndAnnotateReferencedElement(referencedElement);
          if (isMemberElement(parent)) {
            parent.value = replaceWith; // eslint-disable-line no-param-reassign
          } else if (Array.isArray(parent)) {
            parent[key] = replaceWith; // eslint-disable-line no-param-reassign
          }
          return false;
        }

        // transclude referencing element with merged referenced element
        return mergeAndAnnotateReferencedElement(referencedElement);
      } catch (error) {
        const rootCause = getRootCause(error);
        const wrappedError = wrapError(rootCause, {
          baseDoc: this.reference.uri,
          $ref: toValue(pathItemElement.$ref),
          pointer: uriToPointer(toValue(pathItemElement.$ref)),
          fullPath: this.basePath ?? [...toPath([...ancestors, parent, pathItemElement]), '$ref'],
        });
        this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);

        return undefined;
      }
    },

    async SchemaElement(referencingElement, key, parent, path, ancestors) {
      try {
        const [ancestorsLineage, directAncestors] = this.toAncestorLineage([...ancestors, parent]);

        // skip current referencing schema as $ref keyword was not defined
        if (!isStringElement(referencingElement.$ref)) {
          // skip traversing this schema but traverse all it's child schemas
          return undefined;
        }

        // skip already identified cycled Path Item Objects
        if (includesClasses(['cycle'], referencingElement.$ref)) {
          return false;
        }

        // detect possible cycle in traversal and avoid it
        if (ancestorsLineage.includesCycle(referencingElement)) {
          return false;
        }

        // compute baseURI using rules around $id and $ref keywords
        let reference = await this.toReference(url.unsanitize(this.reference.uri));
        let { uri: retrievalURI } = reference;
        const $refBaseURI = resolveSchema$refField(retrievalURI, referencingElement);
        const $refBaseURIStrippedHash = url.stripHash($refBaseURI);
        const file = File({ uri: $refBaseURIStrippedHash });
        const isUnknownURI = !this.options.resolve.resolvers.some((r) => r.canRead(file));
        const isURL = !isUnknownURI;
        const isInternalReference = (uri) => url.stripHash(this.reference.uri) === uri;
        const isExternalReference = (uri) => !isInternalReference(uri);

        this.indirections.push(referencingElement);

        // determining reference, proper evaluation and selection mechanism
        let referencedElement;

        try {
          if (isUnknownURI || isURL) {
            // we're dealing with canonical URI or URL with possible fragment
            const selector = $refBaseURI;
            referencedElement = uriEvaluate(
              selector,
              maybeRefractToSchemaElement(reference.value.result)
            );
          } else {
            // we're assuming here that we're dealing with JSON Pointer here
            retrievalURI = this.toBaseURI(toValue($refBaseURI));

            // ignore resolving internal Schema Objects
            if (!this.options.resolve.internal && isInternalReference(retrievalURI)) {
              // skip traversing this schema element but traverse all it's child elements
              return undefined;
            }
            // ignore resolving external Schema Objects
            if (!this.options.resolve.external && isExternalReference(retrievalURI)) {
              // skip traversing this schema element but traverse all it's child elements
              return undefined;
            }

            reference = await this.toReference(url.unsanitize($refBaseURI));
            const selector = uriToPointer($refBaseURI);
            referencedElement = maybeRefractToSchemaElement(
              jsonPointerEvaluate(selector, reference.value.result)
            );
          }
        } catch (error) {
          /**
           * No SchemaElement($id=URL) was not found, so we're going to try to resolve
           * the URL and assume the returned response is a JSON Schema.
           */
          if (isURL && error instanceof EvaluationJsonSchemaUriError) {
            if (isAnchor(uriToAnchor($refBaseURI))) {
              // we're dealing with JSON Schema $anchor here
              retrievalURI = this.toBaseURI(toValue($refBaseURI));

              // ignore resolving internal Schema Objects
              if (!this.options.resolve.internal && isInternalReference(retrievalURI)) {
                // skip traversing this schema element but traverse all it's child elements
                return undefined;
              }
              // ignore resolving external Schema Objects
              if (!this.options.resolve.external && isExternalReference(retrievalURI)) {
                // skip traversing this schema element but traverse all it's child elements
                return undefined;
              }

              reference = await this.toReference(url.unsanitize($refBaseURI));
              const selector = uriToAnchor($refBaseURI);
              referencedElement = $anchorEvaluate(
                selector,
                maybeRefractToSchemaElement(reference.value.result)
              );
            } else {
              // we're assuming here that we're dealing with JSON Pointer here
              retrievalURI = this.toBaseURI(toValue($refBaseURI));

              // ignore resolving internal Schema Objects
              if (!this.options.resolve.internal && isInternalReference(retrievalURI)) {
                // skip traversing this schema element but traverse all it's child elements
                return undefined;
              }
              // ignore resolving external Schema Objects
              if (!this.options.resolve.external && isExternalReference(retrievalURI)) {
                // skip traversing this schema element but traverse all it's child elements
                return undefined;
              }

              reference = await this.toReference(url.unsanitize($refBaseURI));
              const selector = uriToPointer($refBaseURI);
              referencedElement = maybeRefractToSchemaElement(
                jsonPointerEvaluate(selector, reference.value.result)
              );
            }
          } else {
            throw error;
          }
        }

        // detect direct or indirect reference
        if (this.indirections.includes(referencedElement)) {
          throw new ApiDOMError('Recursive Schema Object reference detected');
        }

        // detect maximum depth of dereferencing
        if (this.indirections.length > this.options.dereference.maxDepth) {
          throw new MaximumDereferenceDepthError(
            `Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`
          );
        }

        // useCircularStructures option processing
        if (!this.useCircularStructures) {
          const hasCycles = ancestorsLineage.includes(referencedElement);
          if (hasCycles) {
            if (url.isHttpUrl(retrievalURI) || url.isFileSystemPath(retrievalURI)) {
              // make the referencing URL or file system path absolute
              const baseURI = url.resolve(retrievalURI, $refBaseURI);
              const cycledSchemaElement = new SchemaElement(
                { $ref: baseURI },
                cloneDeep(referencingElement.meta),
                cloneDeep(referencingElement.attributes)
              );
              cycledSchemaElement.get('$ref').classes.push('cycle');
              return cycledSchemaElement;
            }
            // skip processing this schema and all it's child schemas
            return false;
          }
        }

        // append referencing schema to ancestors lineage
        directAncestors.add(referencingElement);

        // dive deep into the fragment
        const mergeVisitor = OpenApi3_1SwaggerClientDereferenceVisitor({
          reference,
          namespace: this.namespace,
          indirections: [...this.indirections],
          options: this.options,
          useCircularStructures: this.useCircularStructures,
          allowMetaPatches: this.allowMetaPatches,
          ancestors: ancestorsLineage,
          basePath: this.basePath ?? [
            ...toPath([...ancestors, parent, referencingElement]),
            '$ref',
          ],
        });
        referencedElement = await visitAsync(referencedElement, mergeVisitor, {
          keyMap,
          nodeTypeGetter: getNodeType,
        });

        // remove referencing schema from ancestors lineage
        directAncestors.delete(referencingElement);

        this.indirections.pop();

        if (isBooleanJsonSchemaElement(referencedElement)) {
          const booleanJsonSchemaElement = cloneDeep(referencedElement);
          // annotate referenced element with info about original referencing element
          booleanJsonSchemaElement.setMetaProperty('ref-fields', {
            $ref: toValue(referencingElement.$ref),
          });
          // annotate referenced element with info about origin
          booleanJsonSchemaElement.setMetaProperty('ref-origin', reference.uri);
          // annotate fragment with info about referencing element
          booleanJsonSchemaElement.setMetaProperty(
            'ref-referencing-element-id',
            cloneDeep(identityManager.identify(referencingElement))
          );
          return booleanJsonSchemaElement;
        }

        const mergeAndAnnotateReferencedElement = (refedElement) => {
          // Schema Object - merge keywords from referenced schema with referencing schema
          const mergedElement = new SchemaElement(
            [...refedElement.content],
            cloneDeep(refedElement.meta),
            cloneDeep(refedElement.attributes)
          );
          // existing keywords from referencing schema overrides ones from referenced schema
          referencingElement.forEach((value, keyElement, item) => {
            mergedElement.remove(toValue(keyElement));
            mergedElement.content.push(item);
          });
          mergedElement.remove('$ref');
          // annotate referenced element with info about original referencing element
          mergedElement.setMetaProperty('ref-fields', {
            $ref: toValue(referencingElement.$ref),
          });
          // annotate fragment with info about origin
          mergedElement.setMetaProperty('ref-origin', reference.uri);
          // annotate fragment with info about referencing element
          mergedElement.setMetaProperty(
            'ref-referencing-element-id',
            cloneDeep(identityManager.identify(referencingElement))
          );

          // allowMetaPatches option processing
          if (this.allowMetaPatches) {
            // apply meta patch only when not already applied
            if (typeof mergedElement.get('$$ref') === 'undefined') {
              const baseURI = url.resolve(retrievalURI, $refBaseURI);
              mergedElement.set('$$ref', baseURI);
            }
          }

          return mergedElement;
        };

        // attempting to create cycle
        if (
          ancestorsLineage.includes(referencingElement) ||
          ancestorsLineage.includes(referencedElement)
        ) {
          const replaceWith =
            ancestorsLineage.findItem(wasReferencedBy(referencingElement)) ??
            mergeAndAnnotateReferencedElement(referencedElement);
          if (isMemberElement(parent)) {
            parent.value = replaceWith; // eslint-disable-line no-param-reassign
          } else if (Array.isArray(parent)) {
            parent[key] = replaceWith; // eslint-disable-line no-param-reassign
          }
          return false;
        }

        // transclude referencing element with merged referenced element
        return mergeAndAnnotateReferencedElement(referencedElement);
      } catch (error) {
        const rootCause = getRootCause(error);
        const wrappedError = new SchemaRefError(
          `Could not resolve reference: ${rootCause.message}`,
          {
            baseDoc: this.reference.uri,
            $ref: toValue(referencingElement.$ref),
            fullPath: this.basePath ?? [
              ...toPath([...ancestors, parent, referencingElement]),
              '$ref',
            ],
          },
          rootCause
        );
        this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);

        return undefined;
      }
    },

    async LinkElement() {
      /**
       * OpenApi3_1DereferenceVisitor is doing lookup of Operation Objects
       * and assigns them to Link Object metadata. This is not needed in
       * swagger-client context, so we're disabling it here.
       */
      return undefined;
    },

    async ExampleElement(exampleElement, key, parent, path, ancestors) {
      try {
        return await OpenApi3_1DereferenceVisitor.compose.methods.ExampleElement.call(
          this,
          exampleElement,
          key,
          parent,
          path,
          ancestors
        );
      } catch (error) {
        const rootCause = getRootCause(error);
        const wrappedError = wrapError(rootCause, {
          baseDoc: this.reference.uri,
          externalValue: toValue(exampleElement.externalValue),
          fullPath: this.basePath ?? [
            ...toPath([...ancestors, parent, exampleElement]),
            'externalValue',
          ],
        });
        this.options.dereference.dereferenceOpts?.errors?.push?.(wrappedError);

        return undefined;
      }
    },
  },
});

export default OpenApi3_1SwaggerClientDereferenceVisitor;
/* eslint-enable camelcase */
