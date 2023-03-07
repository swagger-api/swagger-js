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
    return typeof openapi === 'string' && openapi.startsWith('3.0');
  } catch {
    return false;
  }
};

export const isOpenAPI31 = (spec) => {
  try {
    const { openapi } = spec;
    return typeof openapi === 'string' && openapi.startsWith('3.1');
  } catch {
    return false;
  }
};

export const isOpenAPI3 = (spec) => isOpenAPI30(spec) || isOpenAPI31(spec);

// backward compatibility export
export { isOpenAPI2 as isSwagger2 };
