export const isOpenAPI2 = (spec) => {
  try {
    const { swagger } = spec;
    return swagger === '2.0';
  } catch {
    return false;
  }
};
export const isOpenAPI30 = (spec) => {
  try {
    const { openapi } = spec;
    return typeof openapi === 'string' && /^3\.0\.([0123])(?:-rc[012])?$/.test(openapi);
  } catch {
    return false;
  }
};

export const isOpenAPI31 = (spec) => {
  try {
    const { openapi } = spec;
    return typeof openapi === 'string' && /^3\.1\.(?:[1-9]\d*|0)$/.test(openapi);
  } catch {
    return false;
  }
};

export const isOpenAPI3 = (spec) => isOpenAPI30(spec) || isOpenAPI31(spec);

// backward compatibility export
export { isOpenAPI2 as isSwagger2 };
