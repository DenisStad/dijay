# Dependency Injection

Powerful, simple, and lightweight inversion of control or dependency injection.
It's only about 110 lines, works in node and the browser, even with webpack.


## Usage

Lets define a module in `dir/modA/index.js`
```
module.exports = {
  name: 'modA'
}
```

And another one in in `dir/modB`
```
module.exports = async function(require) {
  return {
    name: 'modB',
    modA: await require('dir/modA'),
    myMod: await require('MyModuleName'),
  }
}
```

Note that your module can be anything, but if it's a function, it will be passed a `require` function which you can use to require other modules you have defined.

We now need to set up the container: (in `./index.js`)
```
const Dijay = require('dijay')

let di = Dijay()

// Lets define a module
di.define('MyModuleName', {
  name: 'MyModuleName'
})
// Now we can require 'MyModuleName'

// This will mount all js files from the directory you pass in
di.mountDir(__dirname)
// now we have defined `dir/modA` (or `dir/modA/index`) and `dir/modB`

// This will allow you to require from `node_modules` as well
di.mountModules()

// You can also overwrite any previously defined module (Extremely useful for testing)
di.define('dir/modA', () => ({
  name: 'NotActuallyModA'
}))

// Start the container
await di.inject()

const ModB = di.get('dir/modB')
// ModB is now
{
  name: 'modB',
  modA: { name: 'NotActuallyModA' },
  myMod: { name: 'MyModuleName' }
}
```


### Usage with webpack

Webpack's `require` behaves differently. Since webpack configurations vary a lot, the following should serve you as an example:


```
const di = DependencyInjection()

let context = require.context('.', true, /\.js$/)
context.keys().forEach(function (key) {
  const mod = context(key)
  const name = key.slice(2, -3) // strip leading `./` and trailing `.js`
  di.define(name, mod.default)
})

await di.inject()
```
