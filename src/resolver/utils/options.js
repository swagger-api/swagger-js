import Http from '../../http/index.js';

export const retrievalURI = (options) => {
  const { baseDoc, url } = options;

  // @TODO Swagger-UI uses baseDoc instead of url, this is to allow both
  // need to fix and pick one.
  return baseDoc || url || '';
};

export const httpClient = (options) => {
  const { fetch, http } = options;

  // @TODO fetch should be removed, and http used instead
  // provide a default fetch implementation
  return fetch || http || Http;
};
