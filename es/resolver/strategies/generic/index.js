import resolveGenericStrategy from './resolve.js';
import normalize from './normalize.js';
import { plugins } from '../../specmap/index.js';
export function clearCache() {
  plugins.refs.clearCache();
}
const genericStrategy = {
  name: 'generic',
  match() {
    return true;
  },
  normalize(spec) {
    const {
      spec: normalized
    } = normalize({
      spec
    });
    return normalized;
  },
  async resolve(options) {
    return resolveGenericStrategy(options);
  }
};
export default genericStrategy;