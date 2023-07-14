/* eslint-disable camelcase */
import {
  isObjectElement,
  isPrimitiveElement,
  isStringElement,
  visit,
  includesClasses,
} from '@swagger-api/apidom-core';
import {
  isReferenceElementExternal,
  isReferenceLikeElement,
  isPathItemElementExternal,
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
    async ReferenceElement(referenceElement, key, parent, path, ancestors) {
      try {
        const [ancestorsLineage, directAncestors] = this.toAncestorLineage([...ancestors, parent]);

        // skip already identified cycled Path Item Objects
        if (includesClasses(['cycle'], referenceElement.$ref)) {
          return false;
        }

        // detect possible cycle in traversal and avoid it
        if (ancestorsLineage.some((ancs) => ancs.has(referenceElement))) {
          // skip processing this schema and all it's child schemas
          return false;
        }

        // ignore resolving external Reference Objects
        if (!this.options.resolve.external && isReferenceElementExternal(referenceElement)) {
          return false;
        }

        const reference = await this.toReference(referenceElement.$ref.toValue());
        const { uri: retrievalURI } = reference;
        const $refBaseURI = url.resolve(retrievalURI, referenceElement.$ref.toValue());

        this.indirections.push(referenceElement);

        const jsonPointer = uriToPointer($refBaseURI);

        // possibly non-semantic fragment
        let fragment = jsonPointerEvaluate(jsonPointer, reference.value.result);

        // applying semantics to a fragment
        if (isPrimitiveElement(fragment)) {
          const referencedElementType = referenceElement.meta.get('referenced-element').toValue();

          if (isReferenceLikeElement(fragment)) {
            // handling indirect references
            fragment = ReferenceElement.refract(fragment);
            fragment.setMetaProperty('referenced-element', referencedElementType);
          } else {
            // handling direct references
            const ElementClass = this.namespace.getElementClass(referencedElementType);
            fragment = ElementClass.refract(fragment);
          }
        }

        // detect direct or indirect reference
        if (this.indirections.includes(fragment)) {
          throw new Error('Recursive JSON Pointer detected');
        }

        // detect maximum depth of dereferencing
        if (this.indirections.length > this.options.dereference.maxDepth) {
          throw new MaximumDereferenceDepthError(
            `Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`
          );
        }

        if (!this.useCircularStructures) {
          const hasCycles = ancestorsLineage.some((ancs) => ancs.has(fragment));
          if (hasCycles) {
            if (url.isHttpUrl(retrievalURI) || url.isFileSystemPath(retrievalURI)) {
              // make the referencing URL or file system path absolute
              const cycledReferenceElement = new ReferenceElement(
                { $ref: $refBaseURI },
                referenceElement.meta.clone(),
                referenceElement.attributes.clone()
              );
              cycledReferenceElement.get('$ref').classes.push('cycle');
              return cycledReferenceElement;
            }
            // skip processing this schema and all it's child schemas
            return false;
          }
        }

        // append referencing schema to ancestors lineage
        directAncestors.add(referenceElement);

        // dive deep into the fragment
        const visitor = OpenApi3_1SwaggerClientDereferenceVisitor({
          reference,
          namespace: this.namespace,
          indirections: [...this.indirections],
          options: this.options,
          ancestors: ancestorsLineage,
          allowMetaPatches: this.allowMetaPatches,
          useCircularStructures: this.useCircularStructures,
          basePath: this.basePath ?? [...toPath([...ancestors, parent, referenceElement]), '$ref'],
        });
        fragment = await visitAsync(fragment, visitor, { keyMap, nodeTypeGetter: getNodeType });

        // remove referencing schema from ancestors lineage
        directAncestors.delete(referenceElement);

        this.indirections.pop();

        fragment = fragment.clone();
        fragment.setMetaProperty('ref-fields', {
          $ref: referenceElement.$ref?.toValue(),
          description: referenceElement.description?.toValue(),
          summary: referenceElement.summary?.toValue(),
        });
        // annotate fragment with info about origin
        fragment.setMetaProperty('ref-origin', reference.uri);

        // override description and summary (outer has higher priority then inner)
        const hasDescription = typeof referenceElement.description !== 'undefined';
        const hasSummary = typeof referenceElement.summary !== 'undefined';
        if (hasDescription && 'description' in fragment) {
          fragment.description = referenceElement.description;
        }
        if (hasSummary && 'summary' in fragment) {
          fragment.summary = referenceElement.summary;
        }

        // apply meta patches
        if (this.allowMetaPatches && isObjectElement(fragment)) {
          const objectFragment = fragment;
          // apply meta patch only when not already applied
          if (typeof objectFragment.get('$$ref') === 'undefined') {
            const baseURI = url.resolve(retrievalURI, $refBaseURI);
            objectFragment.set('$$ref', baseURI);
          }
        }

        // transclude the element for a fragment
        return fragment;
      } catch (error) {
        const rootCause = getRootCause(error);
        const wrappedError = wrapError(rootCause, {
          baseDoc: this.reference.uri,
          $ref: referenceElement.$ref.toValue(),
          pointer: uriToPointer(referenceElement.$ref.toValue()),
          fullPath: this.basePath ?? [...toPath([...ancestors, parent, referenceElement]), '$ref'],
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
        if (ancestorsLineage.some((ancs) => ancs.has(pathItemElement))) {
          // skip processing this schema and all it's child schemas
          return false;
        }

        // ignore resolving external Path Item Elements
        if (!this.options.resolve.external && isPathItemElementExternal(pathItemElement)) {
          return undefined;
        }

        const reference = await this.toReference(pathItemElement.$ref.toValue());
        const { uri: retrievalURI } = reference;
        const $refBaseURI = url.resolve(retrievalURI, pathItemElement.$ref.toValue());

        this.indirections.push(pathItemElement);

        const jsonPointer = uriToPointer($refBaseURI);

        // possibly non-semantic referenced element
        let referencedElement = jsonPointerEvaluate(jsonPointer, reference.value.result);

        // applying semantics to a referenced element
        if (isPrimitiveElement(referencedElement)) {
          referencedElement = PathItemElement.refract(referencedElement);
        }

        // detect direct or indirect reference
        if (this.indirections.includes(referencedElement)) {
          throw new Error('Recursive JSON Pointer detected');
        }

        // detect maximum depth of dereferencing
        if (this.indirections.length > this.options.dereference.maxDepth) {
          throw new MaximumDereferenceDepthError(
            `Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`
          );
        }

        if (!this.useCircularStructures) {
          const hasCycles = ancestorsLineage.some((ancs) => ancs.has(referencedElement));
          if (hasCycles) {
            if (url.isHttpUrl(retrievalURI) || url.isFileSystemPath(retrievalURI)) {
              // make the referencing URL or file system path absolute
              const cycledPathItemElement = new PathItemElement(
                { $ref: $refBaseURI },
                pathItemElement.meta.clone(),
                pathItemElement.attributes.clone()
              );
              cycledPathItemElement.get('$ref').classes.push('cycle');
              return cycledPathItemElement;
            }
            // skip processing this schema and all it's child schemas
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

        // merge fields from referenced Path Item with referencing one
        const mergedPathItemElement = new PathItemElement(
          [...referencedElement.content],
          referencedElement.meta.clone(),
          referencedElement.attributes.clone()
        );
        // existing keywords from referencing PathItemElement overrides ones from referenced element
        pathItemElement.forEach((valueElement, keyElement, item) => {
          mergedPathItemElement.remove(keyElement.toValue());
          mergedPathItemElement.content.push(item);
        });
        mergedPathItemElement.remove('$ref');

        // annotate referenced element with info about original referencing element
        mergedPathItemElement.setMetaProperty('ref-fields', {
          $ref: pathItemElement.$ref?.toValue(),
        });
        // annotate referenced element with info about origin
        mergedPathItemElement.setMetaProperty('ref-origin', reference.uri);

        // apply meta patches
        if (this.allowMetaPatches) {
          // apply meta patch only when not already applied
          if (typeof mergedPathItemElement.get('$$ref') === 'undefined') {
            const baseURI = url.resolve(retrievalURI, $refBaseURI);
            mergedPathItemElement.set('$$ref', baseURI);
          }
        }

        // transclude referencing element with merged referenced element
        return mergedPathItemElement;
      } catch (error) {
        const rootCause = getRootCause(error);
        const wrappedError = wrapError(rootCause, {
          baseDoc: this.reference.uri,
          $ref: pathItemElement.$ref.toValue(),
          pointer: uriToPointer(pathItemElement.$ref.toValue()),
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

        // skip already identified cycled schemas
        if (includesClasses(['cycle'], referencingElement.$ref)) {
          return false;
        }

        // detect possible cycle in traversal and avoid it
        if (ancestorsLineage.some((ancs) => ancs.has(referencingElement))) {
          // skip processing this schema and all it's child schemas
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
        const isExternal = isURL && retrievalURI !== $refBaseURIStrippedHash;

        // ignore resolving external Schema Objects
        if (!this.options.resolve.external && isExternal) {
          // skip traversing this schema but traverse all it's child schemas
          return undefined;
        }

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
            reference = await this.toReference(url.unsanitize($refBaseURI));
            retrievalURI = reference.uri;
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
              reference = await this.toReference(url.unsanitize($refBaseURI));
              retrievalURI = reference.uri;
              const selector = uriToAnchor($refBaseURI);
              referencedElement = $anchorEvaluate(
                selector,
                maybeRefractToSchemaElement(reference.value.result)
              );
            } else {
              // we're assuming here that we're dealing with JSON Pointer here
              reference = await this.toReference(url.unsanitize($refBaseURI));
              retrievalURI = reference.uri;
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
          throw new Error('Recursive Schema Object reference detected');
        }

        // detect maximum depth of dereferencing
        if (this.indirections.length > this.options.dereference.maxDepth) {
          throw new MaximumDereferenceDepthError(
            `Maximum dereference depth of "${this.options.dereference.maxDepth}" has been exceeded in file "${this.reference.uri}"`
          );
        }

        // useCircularStructures option processing
        if (!this.useCircularStructures) {
          const hasCycles = ancestorsLineage.some((ancs) => ancs.has(referencedElement));
          if (hasCycles) {
            if (url.isHttpUrl(retrievalURI) || url.isFileSystemPath(retrievalURI)) {
              // make the referencing URL or file system path absolute
              const baseURI = url.resolve(retrievalURI, $refBaseURI);
              const cycledSchemaElement = new SchemaElement(
                { $ref: baseURI },
                referencingElement.meta.clone(),
                referencingElement.attributes.clone()
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
          // Boolean JSON Schema
          const jsonSchemaBooleanElement = referencedElement.clone();
          // annotate referenced element with info about original referencing element
          jsonSchemaBooleanElement.setMetaProperty('ref-fields', {
            $ref: referencingElement.$ref?.toValue(),
          });
          // annotate referenced element with info about origin
          jsonSchemaBooleanElement.setMetaProperty('ref-origin', retrievalURI);

          return jsonSchemaBooleanElement;
        }

        // Schema Object - merge keywords from referenced schema with referencing schema
        const mergedSchemaElement = new SchemaElement(
          [...referencedElement.content],
          referencedElement.meta.clone(),
          referencedElement.attributes.clone()
        );
        // existing keywords from referencing schema overrides ones from referenced schema
        referencingElement.forEach((memberValue, memberKey, member) => {
          mergedSchemaElement.remove(memberKey.toValue());
          mergedSchemaElement.content.push(member);
        });
        mergedSchemaElement.remove('$ref');

        // annotate referenced element with info about original referencing element
        mergedSchemaElement.setMetaProperty('ref-fields', {
          $ref: referencingElement.$ref?.toValue(),
        });
        // annotate fragment with info about origin
        mergedSchemaElement.setMetaProperty('ref-origin', retrievalURI);

        // allowMetaPatches option processing
        if (this.allowMetaPatches) {
          // apply meta patch only when not already applied
          if (typeof mergedSchemaElement.get('$$ref') === 'undefined') {
            const baseURI = url.resolve(retrievalURI, $refBaseURI);
            mergedSchemaElement.set('$$ref', baseURI);
          }
        }

        // transclude referencing element with merged referenced element
        return mergedSchemaElement;
      } catch (error) {
        const rootCause = getRootCause(error);
        const wrappedError = new SchemaRefError(
          `Could not resolve reference: ${rootCause.message}`,
          {
            baseDoc: this.reference.uri,
            $ref: referencingElement.$ref.toValue(),
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
          externalValue: exampleElement.externalValue?.toValue(),
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
