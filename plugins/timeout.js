var Plugin = require('../plugin')
var requestTimeout = require('request-timeout')

module.exports = Plugin.extend({

  run: function(instance) {
    var seconds = instance.config.requestTimeout
    requestTimeout(instance.req, instance.res, seconds)
  }

})
