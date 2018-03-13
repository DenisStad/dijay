module.exports = async function(require) {
  return {
    name: 'modB',
    modA: await require('dir/modA'),
    modC: await require('dir2/modC'),
  }
}
