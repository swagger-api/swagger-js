import { dispatchRefractorPlugins, isObjectElement } from '@swagger-api/apidom-core';
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
} from '@swagger-api/apidom-ns-openapi-3-1';

import opId from '../op-id.js';

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

export default normalize;
