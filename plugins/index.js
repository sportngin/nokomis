
var glob = require('glob')

var plugins = module.exports = {}

glob.sync(__dirname + '/!(index.js)').forEach(function(file) {
  var module = require(file)
  var name = file.substring(file.lastIndexOf('/')+1, file.lastIndexOf('.'))
  name = name.charAt(0).toUpperCase() + name.slice(1)
  plugins[name] = module
})
