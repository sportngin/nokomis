var Plugin = require('../plugins')
var requestTimeout = require('request-timeout')

module.exports = Plugin.extend({

  initialize: function(config) {
    this._keyconfig.keys
  },

  run: function(instance) {
    var seconds = instance.config.requestTimeout
    requestTimeout(instance.req, instance.res, seconds)
  }

})
