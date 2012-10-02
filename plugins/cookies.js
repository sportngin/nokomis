
var Plugin = require('../plugin')
var Cookies = require('cookies')
var Keygrip = require('keygrip')

module.exports = Plugin.extend({

  initialize: function(config) {
    this.cookieKeys = new Keygrip(config.secrets)
  },

  run: function(instance) {
    var req = instance.req
    var res = instance.res
    instance.cookies = req.cookies = new Cookies(req, res, this.cookieKeys)
  }

})