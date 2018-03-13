const glob = require('glob')
const path = require('path')
const fs = require('fs')



module.exports = function() {

  // CORE: defining and injecting

  const dependencies = {}
  let isMountingModules = false

  function define(name, mod) {
    dependencies[name] = {
      original: mod,
      resolved: null,
    }
  }

  async function inject() {
    let currentRequireStack = []

    async function requireInjected(name) {
      if (dependencies[name + '/index']) {
        name += '/index'
      }
      if (!dependencies[name]) {
        if (isMountingModules) {
          try {
            const module = require(name)
            return module
          } catch (err) {
          }
        }
        throw new Error('Dependency ' + name + ' was not defined')
      }
      if (currentRequireStack.indexOf(name) !== -1) {
        throw new Error('Circular dependency detected' + JSON.stringify(currentRequireStack, null, 2))
      }
      currentRequireStack.push(name)
      if (!dependencies[name].resolved) {
        await resolveDependency(name)
      }
      currentRequireStack.pop()
      return dependencies[name].resolved
    }

    async function resolveDependency(name) {
      if (dependencies[name].resolved) {
        return
      }
      const { original } = dependencies[name]
      if (typeof original === 'function') {
        dependencies[name].resolved = await original(requireInjected)
      } else {
        dependencies[name].resolved = original
      }
    }

    for (let name of Object.keys(dependencies)) {
      currentRequireStack = []
      await resolveDependency(name)
    }
  }

  function get(name) {
    if (dependencies[name + '/index']) {
      name += '/index'
    }
    if (!dependencies[name]) {
      if (isMountingModules) {
        try {
          const module = require(name)
          return module
        } catch (err) {
        }
      }
      throw new Error('Dependency ' + name + ' was not defined')
    }
    return dependencies[name].resolved
  }


  // HELPERS

  function mountDir(dirPath) {
    const paths = glob.sync(dirPath + '/**/*.js')
    for (let p of paths) {
      const name = path.relative(dirPath, p).slice(0, -3)
      define(name, require(p))
    }
  }

  function mountModules() {
    isMountingModules = true
  }

  return {
    dependencies,
    mountDir,
    mountModules,
    define,
    inject,
    get
  }
}
