import 'cross-fetch/polyfill';
import { ResolverError, HttpResolver } from '@swagger-api/apidom-reference/configuration/empty';

import Http from '../../../../../../http/index.js';

const HttpResolverSwaggerClient = HttpResolver.compose({
  props: {
    name: 'http-swagger-client',
    swaggerHTTPClient: Http,
    swaggerHTTPClientConfig: {},
  },
  init({ swaggerHTTPClient = this.swaggerHTTPClient } = {}) {
    this.swaggerHTTPClient = swaggerHTTPClient;
  },
  methods: {
    getHttpClient() {
      return this.swaggerHTTPClient;
    },

    async read(file) {
      const client = this.getHttpClient();
      const controller = new AbortController();
      const { signal } = controller;
      const timeoutID = setTimeout(() => {
        controller.abort();
      }, this.timeout);
      const credentials =
        this.getHttpClient().withCredentials || this.withCredentials ? 'include' : 'same-origin';
      const redirects = this.redirects === 0 ? 'error' : 'follow';
      const follow = this.redirects > 0 ? this.redirects : undefined;

      try {
        const response = await client({
          url: file.uri,
          signal,
          userFetch: async (resource, options) => {
            const res = await fetch(resource, options);
            res.headers.delete('Content-Type');
            return res;
          },
          credentials,
          redirects,
          follow,
          ...this.swaggerHTTPClientConfig,
        });

        return response.text.arrayBuffer();
      } catch (error) {
        throw new ResolverError(`Error downloading "${file.uri}"`, error);
      } finally {
        clearTimeout(timeoutID);
      }
    },
  },
});

export default HttpResolverSwaggerClient;
