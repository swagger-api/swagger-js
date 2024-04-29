import createError from '../../../../../../specmap/lib/create-error.js';

// eslint-disable-next-line import/prefer-default-export
export const SchemaRefError = createError('SchemaRefError', function cb(message, extra, oriError) {
  this.originalError = oriError;
  Object.assign(this, extra || {});
});
