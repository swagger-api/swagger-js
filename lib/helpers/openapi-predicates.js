"use strict";

exports.__esModule = true;
exports.isSwagger2 = exports.isOpenAPI32 = exports.isOpenAPI31 = exports.isOpenAPI30 = exports.isOpenAPI3 = exports.isOpenAPI2 = void 0;
const isOpenAPI2 = spec => {
  try {
    const {
      swagger
    } = spec;
    return swagger === '2.0';
  } catch {
    return false;
  }
};
exports.isSwagger2 = exports.isOpenAPI2 = isOpenAPI2;
const isOpenAPI30 = spec => {
  try {
    const {
      openapi
    } = spec;
    return typeof openapi === 'string' && /^3\.0\.(?:[1-9]\d*|0)$/.test(openapi);
  } catch {
    return false;
  }
};
exports.isOpenAPI30 = isOpenAPI30;
const isOpenAPI31 = spec => {
  try {
    const {
      openapi
    } = spec;
    return typeof openapi === 'string' && /^3\.1\.(?:[1-9]\d*|0)$/.test(openapi);
  } catch {
    return false;
  }
};
exports.isOpenAPI31 = isOpenAPI31;
const isOpenAPI32 = spec => {
  try {
    const {
      openapi
    } = spec;
    return typeof openapi === 'string' && /^3\.2\.(?:[1-9]\d*|0)$/.test(openapi);
  } catch {
    return false;
  }
};
exports.isOpenAPI32 = isOpenAPI32;
const isOpenAPI3 = spec => isOpenAPI30(spec) || isOpenAPI31(spec) || isOpenAPI32(spec);

// backward compatibility export
exports.isOpenAPI3 = isOpenAPI3;