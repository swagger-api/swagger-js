/* eslint-disable camelcase */
import { dispatchRefractorPlugins, isObjectElement, toValue } from '@swagger-api/apidom-core';
import {
  refractorPluginNormalizeOperationIds,
  refractorPluginNormalizeParameters,
  refractorPluginNormalizeSecurityRequirements,
  refractorPluginNormalizeParameterExamples,
  refractorPluginNormalizeHeaderExamples,
  createToolbox,
  keyMap,
  getNodeType,
  OpenApi3_2Element,
} from '@swagger-api/apidom-ns-openapi-3-2';

import opId from '../../../helpers/op-id.js';
import resolveOpenAPI32Strategy from './resolve.js';

const normalize = (element) => {
  if (!isObjectElement(element)) return element;

  const plugins = [
    refractorPluginNormalizeOperationIds({
      operationIdNormalizer: (operationId, path, method) =>
        opId({ operationId }, path, method, { v2OperationIdCompatibilityMode: false }),
    }),
    refractorPluginNormalizeParameters(),
    refractorPluginNormalizeSecurityRequirements(),
    refractorPluginNormalizeParameterExamples(),
    refractorPluginNormalizeHeaderExamples(),
  ];

  const normalized = dispatchRefractorPlugins(element, plugins, {
    toolboxCreator: createToolbox,
    visitorOptions: { keyMap, nodeTypeGetter: getNodeType },
  });

  return normalized;
};

/**
 * This adapter allow to perform normalization on Plain Old JavaScript Objects.
 * The function adapts the `normalize` function interface and is able to accept
 * Plain Old JavaScript Objects and returns Plain Old JavaScript Objects.
 */
export const pojoAdapter = (normalizeFn) => (spec) => {
  const openApiElement = OpenApi3_2Element.refract(spec);
  openApiElement.classes.push('result');

  const normalized = normalizeFn(openApiElement);
  const value = toValue(normalized);

  /**
   * We're setting the cache here to avoid repeated refracting
   * in `openapi-3-2-apidom` strategy resolve method.
   */
  resolveOpenAPI32Strategy.cache.set(value, normalized);

  return toValue(normalized);
};

export default normalize;
/* eslint-enable camelcase */
