
var Plugin = require('../plugins')

module.exports = Plugin.extend({

  run: function(instance) {
    var sessConf = instance.config.session || { key:'s' }
    instance.session = new Session(instance.req, sessConf)
  }

})


// Everything from here on down should be moved into it's own module
var options = {
  signed: true
}

function Session(req, config) {
  this.cookiekey = config.key
  this.cookies = req.cookies
  this.data = this.cookies.get(this.cookiekey) || {}
}

Session.prototype.get = function(key, cb) {
  if (typeof key == 'function') return key(this.data)
  return cb(this.data[key])
}

Session.prototype.set = function(key, value, cb) {
  var obj = key
  if (typeof key == 'string') {
    obj = {}
    obj[key] = value
  }

  Object.keys(obj).forEach(function(key) {
    this.data[key] = obj[key]
  })

  this.cookies.set(this.cookiekey, this.data)
}

Session.prototype.del = function() {
  delete this.data[del]
  this.cookies.set(this.cookiekey, this.data)
}
