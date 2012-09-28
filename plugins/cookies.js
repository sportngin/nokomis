
var Plugin = require('../plugins')
var Cookies = require('cookies')

module.exports = Plugin.extend({

  initialize: function(config) {
    this._keyconfig.keys
  },

  run: function(instance) {
    instance.cookies = new Cookies(instance.req, instance.res, config.cookiesKeys)
  }

})