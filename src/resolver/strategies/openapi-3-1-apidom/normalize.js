/* eslint-disable camelcase */
import { dispatchRefractorPlugins, isObjectElement, toValue } from '@swagger-api/apidom-core';
import {
  refractorPluginNormalizeOperationIds,
  refractorPluginNormalizeParameters,
  refractorPluginNormalizeSecurityRequirements,
  refractorPluginNormalizeServers,
  refractorPluginNormalizeParameterExamples,
  refractorPluginNormalizeHeaderExamples,
  createToolbox,
  keyMap,
  getNodeType,
  OpenApi3_1Element,
} from '@swagger-api/apidom-ns-openapi-3-1';

import opId from '../../../helpers/op-id.js';

const normalize = (element) => {
  if (!isObjectElement(element)) return element;
  if (element.hasKey('$$normalized')) return element;

  const plugins = [
    refractorPluginNormalizeOperationIds({
      operationIdNormalizer: (operationId, path, method) =>
        opId({ operationId }, path, method, { v2OperationIdCompatibilityMode: false }),
    }),
    refractorPluginNormalizeParameters(),
    refractorPluginNormalizeSecurityRequirements(),
    refractorPluginNormalizeServers(),
    refractorPluginNormalizeParameterExamples(),
    refractorPluginNormalizeHeaderExamples(),
  ];

  const normalized = dispatchRefractorPlugins(element, plugins, {
    toolboxCreator: createToolbox,
    visitorOptions: { keyMap, nodeTypeGetter: getNodeType },
  });

  normalized.set('$$normalized', true);
  return normalized;
};

/**
 * This adapter allow to perform normalization on Plain Old JavaScript Objects.
 * The function adapts the `normalize` function interface and is able to accept
 * Plain Old JavaScript Objects and returns Plain Old JavaScript Objects.
 */
export const pojoAdapter = (normalizeFn) => (spec) => {
  if (spec?.$$normalized) return spec;
  if (pojoAdapter.cache.has(spec)) return pojoAdapter.cache.get(spec);

  const openApiElement = OpenApi3_1Element.refract(spec);
  const normalized = normalizeFn(openApiElement);
  const value = toValue(normalized);

  pojoAdapter.cache.set(spec, value);

  return value;
};
pojoAdapter.cache = new WeakMap();

export default normalize;
/* eslint-enable camelcase */
