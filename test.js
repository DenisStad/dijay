const injector = require('./index')()

async function test() {
  injector.mountDir(__dirname + '/test')

  console.log(injector.dependencies)

  await injector.inject()

  console.log(JSON.stringify(injector.dependencies, null, 2))

  console.log(injector.dependencies['modB'].resolved.modC.modD === injector.dependencies['modD'].resolved)

  console.log(injector.get('dir/modA').name === 'modA')

  try {
    const glob = injector.get('glob')
  } catch (err) {
    // console.log(err)
    console.log(err.message === 'Dependency glob was not defined')
  }

  injector.mountModules()
  const glob = injector.get('glob')
  console.log(!!glob)

  // should throw
  injector.get('othermod')
}

test()
