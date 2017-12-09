import find from 'lodash/find'

import lib from './lib'
import refs from './lib/refs'
import allOf from './lib/all-of'
import parameters from './lib/parameters'
import properties from './lib/properties'
import ContextTree from './lib/context-tree'

const HARD_LIMIT = 100

class SpecMap {
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
      contextTree: new ContextTree(),
      showDebug: false,
      allPatches: [], // only populated if showDebug is true
      pluginProp: 'specMap',
      libMethods: Object.assign(Object.create(this), lib),
      allowMetaPatches: false,
    }, opts)

    // Lib methods bound
    this.get = this._get.bind(this)
    this.getContext = this._getContext.bind(this)
    this.hasRun = this._hasRun.bind(this)

    this.wrappedPlugins = this.plugins
      .map(this.wrapPlugin.bind(this))
      .filter(lib.isFunction)

    // Initial patch(s)
    this.patches.push(lib.add([], this.spec))
    this.patches.push(lib.context([], this.context))
    this.updatePatches(this.patches)
  }

  debug(level, ...args) {
    if (this.debugLevel === level) {
      console.log(...args) // eslint-disable-line no-console
    }
  }

  verbose(header, ...args) {
    if (this.debugLevel === 'verbose') {
      console.log(`[${header}]   `, ...args) // eslint-disable-line no-console
    }
  }

  wrapPlugin(plugin, name) {
    let ctx = null
    let fn

    if (plugin[this.pluginProp]) {
      ctx = plugin
      fn = plugin[this.pluginProp]
    }
    else if (lib.isFunction(plugin)) {
      fn = plugin
    }
    else if (lib.isObject(plugin)) {
      fn = createKeyBasedPlugin(plugin)
    }

    return Object.assign(fn.bind(ctx), {
      pluginName: plugin.name || name,
      isGenerator: lib.isGenerator(fn)
    })

    // Expected plugin interface: {key: string, plugin: fn*}
    // This traverses depth-first and immediately applies yielded patches.
    // This strategy should work well for most plugins (including the built-ins).
    // We might consider making this (traversing & application) configurable later.
    function createKeyBasedPlugin(pluginObj) {
      return function* (patches, specmap) {
        for (const patch of patches.filter(lib.isAdditiveMutation)) {
          yield* traverse(patch.value, patch.path, patch)
        }

        function* traverse(obj, path, patch) {
          if (!lib.isObject(obj)) {
            if (pluginObj.key === path[path.length - 1]) {
              yield pluginObj.plugin(obj, pluginObj.key, path, specmap)
            }
          }
          else {
            const parentIndex = path.length - 1
            const parent = path[parentIndex]
            const indexOfFirstProperties = path.indexOf('properties')
            const isRootProperties = parent === 'properties' && parentIndex === indexOfFirstProperties

            for (const key of Object.keys(obj)) {
              const val = obj[key]
              const updatedPath = path.concat(key)

              if (lib.isObject(val)) {
                yield* traverse(val, updatedPath, patch)
              }

              if (!isRootProperties && key === pluginObj.key) {
                yield pluginObj.plugin(val, key, updatedPath, specmap, patch)
              }
            }
          }
        }
      }
    }
  }

  nextPlugin() {
    // Array.prototype.find doesn't work in IE 11 :(
    return find(this.wrappedPlugins, (plugin) => {
      const mutations = this.getMutationsForPlugin(plugin)
      return mutations.length > 0
    })
  }

  nextPromisedPatch() {
    if (this.promisedPatches.length > 0) {
      return Promise.race(this.promisedPatches.map(patch => patch.value))
    }
  }

  getPluginHistory(plugin) {
    const name = this.getPluginName(plugin)
    return this.pluginHistory[name] || []
  }

  getPluginRunCount(plugin) {
    return this.getPluginHistory(plugin).length
  }

  getPluginHistoryTip(plugin) {
    const history = this.getPluginHistory(plugin)
    const val = history && history[history.length - 1]
    return val || {}
  }

  getPluginMutationIndex(plugin) {
    const mi = this.getPluginHistoryTip(plugin).mutationIndex
    return typeof mi !== 'number' ? -1 : mi
  }

  getPluginName(plugin) {
    return plugin.pluginName
  }

  updatePluginHistory(plugin, val) {
    const name = this.getPluginName(plugin)
    const history = this.pluginHistory[name] = this.pluginHistory[name] || []
    history.push(val)
  }

  updatePatches(patches, plugin) {
    lib.normalizeArray(patches).forEach((patch) => {
      if (patch instanceof Error) {
        this.errors.push(patch)
        return
      }

      try {
        if (!lib.isObject(patch)) {
          this.debug('updatePatches', 'Got a non-object patch', patch)
          return
        }

        if (this.showDebug) {
          this.allPatches.push(patch)
        }

        if (lib.isPromise(patch.value)) {
          this.promisedPatches.push(patch)
          this.promisedPatchThen(patch)
          return
        }

        if (lib.isContextPatch(patch)) {
          this.setContext(patch.path, patch.value)
          return
        }

        if (lib.isMutation(patch)) {
          this.updateMutations(patch)
          return
        }
      }
      catch (e) {
        this.errors.push(e)
      }
    })
  }

  updateMutations(patch) {
    if (lib.applyPatch(this.state, patch, {allowMetaPatches: this.allowMetaPatches})) {
      this.mutations.push(patch)
    }
  }

  removePromisedPatch(patch) {
    const index = this.promisedPatches.indexOf(patch)
    if (index < 0) {
      this.debug('Tried to remove a promisedPatch that isn\'t there!')
      return
    }
    this.promisedPatches.splice(index, 1)
  }

  promisedPatchThen(patch) {
    const value = patch.value = patch.value
      .then((val) => {
        const promisedPatch = Object.assign({}, patch, {value: val})
        this.removePromisedPatch(patch)
        this.updatePatches(promisedPatch)
      })
      .catch((e) => {
        this.removePromisedPatch(patch)
        this.updatePatches(e)
      })
    return value
  }

  getMutations(from, to) {
    from = from || 0
    if (typeof to !== 'number') {
      to = this.mutations.length
    }
    return this.mutations.slice(from, to)
  }

  getCurrentMutations() {
    return this.getMutationsForPlugin(this.getCurrentPlugin())
  }

  getMutationsForPlugin(plugin) {
    const tip = this.getPluginMutationIndex(plugin)
    return this.getMutations(tip + 1)
  }

  getCurrentPlugin() {
    return this.currentPlugin
  }

  getPatchesOfType(patches, fn) {
    return patches.filter(fn)
  }

  getLib() {
    return this.libMethods
  }

  _get(path) {
    return lib.getIn(this.state, path)
  }

  _getContext(path) {
    return this.contextTree.get(path)
  }

  setContext(path, value) {
    return this.contextTree.set(path, value)
  }

  _hasRun(count) {
    const times = this.getPluginRunCount(this.getCurrentPlugin())
    return times > (count || 0)
  }

  _clone(obj) {
    // For debugging only
    return JSON.parse(JSON.stringify(obj))
  }

  dispatch() {
    const that = this
    const plugin = this.nextPlugin()

    if (!plugin) {
      const nextPromise = this.nextPromisedPatch()
      if (nextPromise) {
        return nextPromise
          .then(() => this.dispatch())
          .catch(() => this.dispatch())
      }

      // We're done!
      const result = {spec: this.state, errors: this.errors}
      if (this.showDebug) {
        result.patches = this.allPatches
      }
      return Promise.resolve(result)
    }

    // Makes sure plugin isn't running an endless loop
    that.pluginCount = that.pluginCount || {}
    that.pluginCount[plugin] = (that.pluginCount[plugin] || 0) + 1
    if (that.pluginCount[plugin] > HARD_LIMIT) {
      return Promise.resolve({
        spec: that.state,
        errors: that.errors.concat(new Error(`We've reached a hard limit of ${HARD_LIMIT} plugin runs`))
      })
    }

    // A different plugin runs, wait for all promises to resolve, then retry
    if (plugin !== this.currentPlugin && this.promisedPatches.length) {
      const promises = this.promisedPatches.map(p => p.value)

      // Waits for all to settle instead of Promise.all which stops on rejection
      return Promise.all(promises.map((promise) => {
        return promise.then(Function, Function)
      })).then(() => this.dispatch())
    }

    // Ok, run the plugin
    return executePlugin()

    function executePlugin() {
      that.currentPlugin = plugin
      const mutations = that.getCurrentMutations()
      const lastMutationIndex = that.mutations.length - 1

      try {
        if (plugin.isGenerator) {
          for (const yieldedPatches of plugin(mutations, that.getLib())) {
            updatePatches(yieldedPatches)
          }
        }
        else {
          const newPatches = plugin(mutations, that.getLib())
          updatePatches(newPatches)
        }
      }
      catch (e) {
        updatePatches([Object.assign(Object.create(e), {plugin})])
      }
      finally {
        that.updatePluginHistory(plugin, {mutationIndex: lastMutationIndex})
      }

      return that.dispatch()
    }

    function updatePatches(patches) {
      if (patches) {
        patches = lib.fullyNormalizeArray(patches)
        that.updatePatches(patches, plugin)
      }
    }
  }
}

export default function mapSpec(opts) {
  return new SpecMap(opts).dispatch()
}

const plugins = {refs, allOf, parameters, properties}
export {SpecMap, plugins}
