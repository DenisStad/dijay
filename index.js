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

    function requireInjected(name) {
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
        const resolver = resolveDependency(name)
        if (resolver && resolver.then) {
          return resolver.then(() => {
            currentRequireStack.pop()
            return dependencies[name].resolved
          })
        }
      }
      currentRequireStack.pop()
      return dependencies[name].resolved
    }

    function resolveDependency(name) {
      if (dependencies[name].resolved) {
        return
      }
      const { original } = dependencies[name]
      if (typeof original === 'function') {
        const value = original(requireInjected, di)
        if (value.then) {
          return value.then(res => {
            dependencies[name].resolved = res
          })
        } else {
          dependencies[name].resolved = value
        }
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
    const glob = require('glob')
    const path = require('path')

    const paths = glob.sync(dirPath + '/**/*.js')
    for (let p of paths) {
      const name = path.relative(dirPath, p).slice(0, -3)
      define(name, require(p))
    }
  }

  function mountModules() {
    isMountingModules = true
  }

  const di = {
    dependencies,
    mountDir,
    mountModules,
    define,
    inject,
    get
  }

  return di
}
