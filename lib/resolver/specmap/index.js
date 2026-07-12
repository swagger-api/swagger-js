"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.SpecMap = void 0;
exports.default = mapSpec;
exports.plugins = void 0;
var _index = _interopRequireDefault(require("./lib/index.js"));
var _refs = _interopRequireDefault(require("./lib/refs.js"));
var _allOf = _interopRequireDefault(require("./lib/all-of.js"));
var _parameters = _interopRequireDefault(require("./lib/parameters.js"));
var _properties = _interopRequireDefault(require("./lib/properties.js"));
var _contextTree = _interopRequireDefault(require("./lib/context-tree.js"));
var _constants = require("../../constants.js");
const PLUGIN_DISPATCH_LIMIT = 100;
const noop = () => {};
class SpecMap {
  static getPluginName(plugin) {
    return plugin.pluginName;
  }
  static getPatchesOfType(patches, fn) {
    return patches.filter(fn);
  }
  constructor(opts) {
    Object.assign(this, {
      spec: '',
      debugLevel: 'info',
      plugins: [],
      pluginHistory: {},
      errors: [],
      mutations: [],
      promisedPatches: [],
      state: {},
      patches: [],
      context: {},
      contextTree: new _contextTree.default(),
      showDebug: false,
      allPatches: [],
      // only populated if showDebug is true
      pluginProp: 'specMap',
      libMethods: Object.assign(Object.create(this), _index.default, {
        getInstance: () => this
      }),
      allowMetaPatches: false
    }, opts);

    // Lib methods bound
    this.get = this._get.bind(this); // eslint-disable-line no-underscore-dangle
    this.getContext = this._getContext.bind(this); // eslint-disable-line no-underscore-dangle
    this.hasRun = this._hasRun.bind(this); // eslint-disable-line no-underscore-dangle

    this.wrappedPlugins = this.plugins.map(this.wrapPlugin.bind(this)).filter(_index.default.isFunction);

    // Initial patch(s)
    this.patches.push(_index.default.add([], this.spec));
    this.patches.push(_index.default.context([], this.context));
    this.updatePatches(this.patches);
  }
  debug(level, ...args) {
    if (this.debugLevel === level) {
      console.log(...args); // eslint-disable-line no-console
    }
  }
  verbose(header, ...args) {
    if (this.debugLevel === 'verbose') {
      console.log(`[${header}]   `, ...args); // eslint-disable-line no-console
    }
  }
  wrapPlugin(plugin, name) {
    const {
      pathDiscriminator
    } = this;
    let ctx = null;
    let fn;
    if (plugin[this.pluginProp]) {
      ctx = plugin;
      fn = plugin[this.pluginProp];
    } else if (_index.default.isFunction(plugin)) {
      fn = plugin;
    } else if (_index.default.isObject(plugin)) {
      fn = createKeyBasedPlugin(plugin);
    }
    return Object.assign(fn.bind(ctx), {
      pluginName: plugin.name || name,
      isGenerator: _index.default.isGenerator(fn)
    });

    // Expected plugin interface: {key: string, plugin: fn*}
    // This traverses depth-first and immediately applies yielded patches.
    // This strategy should work well for most plugins (including the built-ins).
    // We might consider making this (traversing & application) configurable later.
    function createKeyBasedPlugin(pluginObj) {
      const isSubPath = (path, tested) => {
        if (!Array.isArray(path)) {
          return true;
        }
        return path.every((val, i) => val === tested[i]);
      };
      return function* generator(patches, specmap) {
        const refCache = {};

        // eslint-disable-next-line no-restricted-syntax
        for (const [i, patch] of patches.filter(_index.default.isAdditiveMutation).entries()) {
          if (i < _constants.TRAVERSE_LIMIT) {
            yield* traverse(patch.value, patch.path, patch);
          } else {
            return;
          }
        }
        function* traverse(obj, path, patch) {
          if (!_index.default.isObject(obj)) {
            if (pluginObj.key === path[path.length - 1]) {
              yield pluginObj.plugin(obj, pluginObj.key, path, specmap);
            }
          } else {
            const parentIndex = path.length - 1;
            const parent = path[parentIndex];
            const indexOfFirstProperties = path.indexOf('properties');
            const isRootProperties = parent === 'properties' && parentIndex === indexOfFirstProperties;
            const traversed = specmap.allowMetaPatches && refCache[obj.$$ref];

            // eslint-disable-next-line no-restricted-syntax
            for (const key of Object.keys(obj)) {
              const val = obj[key];
              const updatedPath = path.concat(key);
              const isObj = _index.default.isObject(val);
              const objRef = obj.$$ref;
              if (!traversed) {
                if (isObj) {
                  // Only store the ref if it exists
                  if (specmap.allowMetaPatches && objRef && isSubPath(pathDiscriminator, updatedPath)) {
                    refCache[objRef] = true;
                  }
                  yield* traverse(val, updatedPath, patch);
                }
              }
              if (!isRootProperties && key === pluginObj.key) {
                const isWithinPathDiscriminator = isSubPath(pathDiscriminator, path);
                if (!pathDiscriminator || isWithinPathDiscriminator) {
                  yield pluginObj.plugin(val, key, updatedPath, specmap, patch);
                }
              }
            }
          }
        }
      };
    }
  }
  nextPlugin() {
    return this.wrappedPlugins.find(plugin => {
      const mutations = this.getMutationsForPlugin(plugin);
      return mutations.length > 0;
    });
  }
  nextPromisedPatch() {
    if (this.promisedPatches.length > 0) {
      return Promise.race(this.promisedPatches.map(patch => patch.value));
    }
    return undefined;
  }
  getPluginHistory(plugin) {
    const name = this.constructor.getPluginName(plugin);
    return this.pluginHistory[name] || [];
  }
  getPluginRunCount(plugin) {
    return this.getPluginHistory(plugin).length;
  }
  getPluginHistoryTip(plugin) {
    const history = this.getPluginHistory(plugin);
    const val = history && history[history.length - 1];
    return val || {};
  }
  getPluginMutationIndex(plugin) {
    const mi = this.getPluginHistoryTip(plugin).mutationIndex;
    return typeof mi !== 'number' ? -1 : mi;
  }
  updatePluginHistory(plugin, val) {
    const name = this.constructor.getPluginName(plugin);
    this.pluginHistory[name] = this.pluginHistory[name] || [];
    this.pluginHistory[name].push(val);
  }
  updatePatches(patches) {
    _index.default.normalizeArray(patches).forEach(patch => {
      if (patch instanceof Error) {
        this.errors.push(patch);
        return;
      }
      try {
        if (!_index.default.isObject(patch)) {
          this.debug('updatePatches', 'Got a non-object patch', patch);
          return;
        }
        if (this.showDebug) {
          this.allPatches.push(patch);
        }
        if (_index.default.isPromise(patch.value)) {
          this.promisedPatches.push(patch);
          this.promisedPatchThen(patch);
          return;
        }
        if (_index.default.isContextPatch(patch)) {
          this.setContext(patch.path, patch.value);
          return;
        }
        if (_index.default.isMutation(patch)) {
          this.updateMutations(patch);
        }
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
        this.errors.push(e);
      }
    });
  }
  updateMutations(patch) {
    if (typeof patch.value === 'object' && !Array.isArray(patch.value) && this.allowMetaPatches) {
      patch.value = {
        ...patch.value
      };
    }
    const result = _index.default.applyPatch(this.state, patch, {
      allowMetaPatches: this.allowMetaPatches
    });
    if (result) {
      this.mutations.push(patch);
      this.state = result;
    }
  }
  removePromisedPatch(patch) {
    const index = this.promisedPatches.indexOf(patch);
    if (index < 0) {
      this.debug("Tried to remove a promisedPatch that isn't there!");
      return;
    }
    this.promisedPatches.splice(index, 1);
  }
  promisedPatchThen(patch) {
    patch.value = patch.value.then(val => {
      const promisedPatch = {
        ...patch,
        value: val
      };
      this.removePromisedPatch(patch);
      this.updatePatches(promisedPatch);
    }).catch(e => {
      this.removePromisedPatch(patch);
      this.updatePatches(e);
    });
    return patch.value;
  }
  getMutations(from, to) {
    from = from || 0;
    if (typeof to !== 'number') {
      to = this.mutations.length;
    }
    return this.mutations.slice(from, to);
  }
  getCurrentMutations() {
    return this.getMutationsForPlugin(this.getCurrentPlugin());
  }
  getMutationsForPlugin(plugin) {
    const tip = this.getPluginMutationIndex(plugin);
    return this.getMutations(tip + 1);
  }
  getCurrentPlugin() {
    return this.currentPlugin;
  }
  getLib() {
    return this.libMethods;
  }

  // eslint-disable-next-line no-underscore-dangle
  _get(path) {
    return _index.default.getIn(this.state, path);
  }

  // eslint-disable-next-line no-underscore-dangle
  _getContext(path) {
    return this.contextTree.get(path);
  }
  setContext(path, value) {
    return this.contextTree.set(path, value);
  }

  // eslint-disable-next-line no-underscore-dangle
  _hasRun(count) {
    const times = this.getPluginRunCount(this.getCurrentPlugin());
    return times > (count || 0);
  }
  dispatch() {
    const that = this;
    const plugin = this.nextPlugin();
    if (!plugin) {
      const nextPromise = this.nextPromisedPatch();
      if (nextPromise) {
        return nextPromise.then(() => this.dispatch()).catch(() => this.dispatch());
      }

      // We're done!
      const result = {
        spec: this.state,
        errors: this.errors
      };
      if (this.showDebug) {
        result.patches = this.allPatches;
      }
      return Promise.resolve(result);
    }

    // Makes sure plugin isn't running an endless loop
    that.pluginCount = that.pluginCount || new WeakMap();
    that.pluginCount.set(plugin, (that.pluginCount.get(plugin) || 0) + 1);
    if (that.pluginCount[plugin] > PLUGIN_DISPATCH_LIMIT) {
      return Promise.resolve({
        spec: that.state,
        errors: that.errors.concat(new Error(`We've reached a hard limit of ${PLUGIN_DISPATCH_LIMIT} plugin runs`))
      });
    }

    // A different plugin runs, wait for all promises to resolve, then retry
    if (plugin !== this.currentPlugin && this.promisedPatches.length) {
      const promises = this.promisedPatches.map(p => p.value);

      // Waits for all to settle instead of Promise.all which stops on rejection
      return Promise.all(promises.map(promise => promise.then(noop, noop))).then(() => this.dispatch());
    }

    // Ok, run the plugin
    return executePlugin();
    function executePlugin() {
      that.currentPlugin = plugin;
      const mutations = that.getCurrentMutations();
      const lastMutationIndex = that.mutations.length - 1;
      try {
        if (plugin.isGenerator) {
          // eslint-disable-next-line no-restricted-syntax
          for (const yieldedPatches of plugin(mutations, that.getLib())) {
            updatePatches(yieldedPatches);
          }
        } else {
          const newPatches = plugin(mutations, that.getLib());
          updatePatches(newPatches);
        }
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
        updatePatches([Object.assign(Object.create(e), {
          plugin
        })]);
      } finally {
        that.updatePluginHistory(plugin, {
          mutationIndex: lastMutationIndex
        });
      }
      return that.dispatch();
    }
    function updatePatches(patches) {
      if (patches) {
        patches = _index.default.fullyNormalizeArray(patches);
        that.updatePatches(patches, plugin);
      }
    }
  }
}
exports.SpecMap = SpecMap;
function mapSpec(opts) {
  return new SpecMap(opts).dispatch();
}
const plugins = exports.plugins = {
  refs: _refs.default,
  allOf: _allOf.default,
  parameters: _parameters.default,
  properties: _properties.default
};