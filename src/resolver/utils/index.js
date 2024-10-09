import { ACCEPT_HEADER_VALUE_FOR_DOCUMENTS } from '../../constants.js';

// eslint-disable-next-line import/prefer-default-export
export function makeFetchJSON(http, opts = {}) {
  const { requestInterceptor, responseInterceptor } = opts;

  // Set credentials with 'http.withCredentials' value
  const credentials = http.withCredentials ? 'include' : 'same-origin';

  // Get Authorization token from environment variables if set
  const authToken = process.env.AUTH_TOKEN ? `Bearer ${process.env.AUTH_TOKEN}` : undefined;

  return (docPath) =>
    http({
      url: docPath,
      loadSpec: true,
      requestInterceptor,
      responseInterceptor,
      headers: {
        Accept: ACCEPT_HEADER_VALUE_FOR_DOCUMENTS,
        // Conditionally add the Authorization header if the token exists
        ...(authToken && { Authorization: authToken }),
      },
      credentials,
    }).then((res) => res.body);
}
