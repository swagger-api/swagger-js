/* eslint-disable camelcase */
import {
  isObjectElement,
  isPrimitiveElement,
  isStringElement,
  visit,
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

const visitAsync = visit[Symbol.for('nodejs.util.promisify.custom')];

const OpenApi3_1SwaggerClientDereferenceVisitor = OpenApi3_1DereferenceVisitor.compose({
  props: {
    useCircularStructures: true,
    allowMetaPatches: false,
    ancestors: [],
  },
  init({ useCircularStructures, allowMetaPatches, ancestors = this.ancestors }) {
    this.useCircularStructures = useCircularStructures;
    this.allowMetaPatches = allowMetaPatches;
    this.ancestors = [...ancestors];
  },
  methods: {
    async ReferenceElement(referenceElement) {
      // ignore resolving external Reference Objects
      if (!this.options.resolve.external && isReferenceElementExternal(referenceElement)) {
        return false;
      }

      // @ts-ignore
      const reference = await this.toReference(referenceElement.$ref.toValue());

      this.indirections.push(referenceElement);

      const jsonPointer = uriToPointer(referenceElement.$ref?.toValue());

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

      // dive deep into the fragment
      const visitor = OpenApi3_1SwaggerClientDereferenceVisitor({
        reference,
        namespace: this.namespace,
        indirections: [...this.indirections],
        options: this.options,
        allowMetaPatches: this.allowMetaPatches,
      });
      fragment = await visitAsync(fragment, visitor, { keyMap, nodeTypeGetter: getNodeType });

      fragment = fragment.clone();

      // annotate fragment with info about original Reference element
      fragment.setMetaProperty('ref-fields', {
        $ref: referenceElement.$ref?.toValue(),
        // @ts-ignore
        description: referenceElement.description?.toValue(),
        // @ts-ignore
        summary: referenceElement.summary?.toValue(),
      });
      // annotate fragment with info about origin
      fragment.setMetaProperty('ref-origin', reference.uri);

      // override description and summary (outer has higher priority then inner)
      const hasDescription = typeof referenceElement.description !== 'undefined';
      const hasSummary = typeof referenceElement.description !== 'undefined';
      if (hasDescription && 'description' in fragment) {
        // @ts-ignore
        fragment.description = referenceElement.description;
      }
      if (hasSummary && 'summary' in fragment) {
        // @ts-ignore
        fragment.summary = referenceElement.summary;
      }

      // apply meta patches
      if (this.allowMetaPatches && isObjectElement(fragment)) {
        const objectFragment = fragment;
        // apply meta patch only when not already applied
        if (typeof objectFragment.get('$$ref') === 'undefined') {
          const absoluteJSONPointerURL = url.resolve(
            reference.uri,
            referenceElement.$ref?.toValue()
          );
          objectFragment.set('$$ref', absoluteJSONPointerURL);
        }
      }

      this.indirections.pop();

      // transclude the element for a fragment
      return fragment;
    },

    async PathItemElement(pathItemElement) {
      // ignore PathItemElement without $ref field
      if (!isStringElement(pathItemElement.$ref)) {
        return undefined;
      }

      // ignore resolving external Path Item Elements
      if (!this.options.resolve.external && isPathItemElementExternal(pathItemElement)) {
        return undefined;
      }

      // @ts-ignore
      const reference = await this.toReference(pathItemElement.$ref.toValue());

      this.indirections.push(pathItemElement);

      const jsonPointer = uriToPointer(pathItemElement.$ref?.toValue());

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

      // dive deep into the referenced element
      const visitor = OpenApi3_1SwaggerClientDereferenceVisitor({
        reference,
        namespace: this.namespace,
        indirections: [...this.indirections],
        options: this.options,
        allowMetaPatches: this.allowMetaPatches,
      });
      referencedElement = await visitAsync(referencedElement, visitor, {
        keyMap,
        nodeTypeGetter: getNodeType,
      });

      this.indirections.pop();

      // merge fields from referenced Path Item with referencing one
      const mergedResult = new PathItemElement(
        // @ts-ignore
        [...referencedElement.content],
        referencedElement.meta.clone(),
        referencedElement.attributes.clone()
      );
      // existing keywords from referencing PathItemElement overrides ones from referenced element
      pathItemElement.forEach((value, key, item) => {
        mergedResult.remove(key.toValue());
        mergedResult.content.push(item);
      });
      mergedResult.remove('$ref');

      // annotate referenced element with info about original referencing element
      mergedResult.setMetaProperty('ref-fields', {
        $ref: pathItemElement.$ref?.toValue(),
      });
      // annotate referenced element with info about origin
      mergedResult.setMetaProperty('ref-origin', reference.uri);

      // apply meta patches
      if (this.allowMetaPatches) {
        // apply meta patch only when not already applied
        if (typeof mergedResult.get('$$ref') === 'undefined') {
          const absoluteJSONPointerURL = url.resolve(
            reference.uri,
            pathItemElement.$ref?.toValue()
          );
          mergedResult.set('$$ref', absoluteJSONPointerURL);
        }
      }

      // transclude referencing element with merged referenced element
      return mergedResult;
    },

    async SchemaElement(referencingElement, key, parent, path, ancestors) {
      // compute full ancestors lineage
      const ancestorsLineage = [...this.ancestors, ...ancestors];

      // skip current referencing schema as $ref keyword was not defined
      if (!isStringElement(referencingElement.$ref)) {
        // skip traversing this schema but traverse all it's child schemas
        return undefined;
      }

      // detect possible cycle and avoid it
      if (ancestorsLineage.includes(referencingElement)) {
        // skip processing this schema but all it's child schemas
        return false;
      }

      // compute baseURI using rules around $id and $ref keywords
      const retrieveURI = this.reference.uri;
      const $refBaseURI = resolveSchema$refField(retrieveURI, referencingElement);
      const $refBaseURIStrippedHash = url.stripHash($refBaseURI);
      const file = File({ uri: $refBaseURIStrippedHash });
      const isUnknownURI = !this.options.resolve.resolvers.some((r) => r.canRead(file));
      const isURL = !isUnknownURI;
      const isExternal = isURL && this.reference.uri !== $refBaseURIStrippedHash;

      // ignore resolving external Schema Objects
      if (!this.options.resolve.external && isExternal) {
        // skip traversing this schema but traverse all it's child schemas
        return undefined;
      }

      this.indirections.push(referencingElement);

      // determining reference, proper evaluation and selection mechanism
      let reference;
      let referencedElement;

      try {
        if (isUnknownURI || isURL) {
          // we're dealing with canonical URI or URL with possible fragment
          reference = this.reference;
          const selector = $refBaseURI;
          referencedElement = uriEvaluate(
            selector,
            // @ts-ignore
            maybeRefractToSchemaElement(reference.value.result)
          );
        } else {
          // we're assuming here that we're dealing with JSON Pointer here
          reference = await this.toReference(url.unsanitize($refBaseURI));
          const selector = uriToPointer($refBaseURI);
          referencedElement = maybeRefractToSchemaElement(
            // @ts-ignore
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
            const selector = uriToAnchor($refBaseURI);
            referencedElement = $anchorEvaluate(
              selector,
              // @ts-ignore
              maybeRefractToSchemaElement(reference.value.result)
            );
          } else {
            // we're assuming here that we're dealing with JSON Pointer here
            reference = await this.toReference(url.unsanitize($refBaseURI));
            const selector = uriToPointer($refBaseURI);
            referencedElement = maybeRefractToSchemaElement(
              // @ts-ignore
              jsonPointerEvaluate(selector, reference.value.result)
            );
          }
        } else {
          throw error;
        }
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

      // append referencing schema to ancestors lineage
      ancestorsLineage.push(referencingElement);

      // dive deep into the fragment
      const visitor = OpenApi3_1SwaggerClientDereferenceVisitor({
        reference,
        namespace: this.namespace,
        indirections: [...this.indirections],
        options: this.options,
        useCircularStructures: this.useCircularStructures,
        allowMetaPatches: this.allowMetaPatches,
        ancestors: ancestorsLineage,
      });
      referencedElement = await visitAsync(referencedElement, visitor, {
        keyMap,
        nodeTypeGetter: getNodeType,
      });

      this.indirections.pop();

      if (isBooleanJsonSchemaElement(referencedElement)) {
        // Boolean JSON Schema
        const jsonSchemaBooleanElement = referencedElement.clone();
        // annotate referenced element with info about original referencing element
        jsonSchemaBooleanElement.setMetaProperty('ref-fields', {
          $ref: referencingElement.$ref?.toValue(),
        });
        // annotate referenced element with info about origin
        jsonSchemaBooleanElement.setMetaProperty('ref-origin', reference.uri);

        return jsonSchemaBooleanElement;
      }

      // useCircularStructures option processing
      const hasCycle = referencedElement.content.some((memberElement) =>
        ancestorsLineage.includes(memberElement)
      );
      if (hasCycle && !this.useCircularStructures) {
        if (url.isHttpUrl(reference.uri) || url.isFileSystemPath(reference.uri)) {
          // make the referencing URL or file system path absolute
          const absoluteURI = url.resolve(reference.uri, referencingElement.$ref?.toValue());
          referencingElement.set('$ref', absoluteURI);
        }

        // skip processing this schema but traverse all it's child schemas
        return undefined;
      }

      // Schema Object - merge keywords from referenced schema with referencing schema
      const mergedSchemaElement = new SchemaElement(
        // @ts-ignore
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
      mergedSchemaElement.setMetaProperty('ref-origin', reference.uri);

      // allowMetaPatches option processing
      if (this.allowMetaPatches) {
        // apply meta patch only when not already applied
        if (typeof mergedSchemaElement.get('$$ref') === 'undefined') {
          const absoluteURI = url.resolve(reference.uri, referencingElement.$ref?.toValue());
          mergedSchemaElement.set('$$ref', absoluteURI);
        }
      }

      // transclude referencing element with merged referenced element
      return mergedSchemaElement;
    },
  },
});

export default OpenApi3_1SwaggerClientDereferenceVisitor;
/* eslint-enable camelcase */
