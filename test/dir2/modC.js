module.exports = async function(require) {
  return {
    name: 'modC',
    modD: await require('modD')
  }
}
