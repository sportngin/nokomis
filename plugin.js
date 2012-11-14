
var extendable = require('extendable')
var _ = require('underscore')
var async = require('async')

var methodBlacklist = ['constructor', 'initialize', 'run']

var Plugin = function(Class, args) {
  var methods = {}
  for (var key in this) {
    if (key.charAt(0) != '_' && !~methodBlacklist.indexOf(key))
      methods[key] = this[key]
  }
  _.defaults(Class.prototype, methods)
  this.initialize.apply(this, args)
}

// Instance members

_.extend(Plugin.prototype, {

  // Called once for each instace of the plugin.
  // Almost always before the extended Class is initialized
  initialize: function() {},

  // Called once for each instance of the extended Class
  // in the context of that instance
  run: function(instance, callback) { callback() }

})

// Class Members

_.extend(Plugin, {

  extend: extendable,

  makePluggable: function(Class) {
    var plugins = []

    // The instance methods added to
    // a Class that is made 'pluggable'
    _.extend(Class.prototype, {
      runPlugins: function(callback) {
        if (typeof callback != 'function') throw new Error('Callback not provided or not a function')
        var instance = this
        async.forEachSeries(plugins, function(plugin, callback) {
          plugin.run(instance, callback)
        }, callback)
      }
    })

    // The Class methods added to a
    // Class that is made 'pluggable'
    _.extend(Class, {
      addPlugin: function(PluginClass) {
        plugins.push(new PluginClass(Class, _.rest(arguments)))
      }
    })
  }

})

module.exports = Plugin
