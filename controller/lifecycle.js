var async = require('async')

var rx = {}
function getRegexp(str) {
  if (!rx[str]) rx[str] = new RegExp(str+'$', 'i')
  return rx[str]
}

var createRegFunction = module.exports.createRegFunction = function(name) {
  return function(method, filter) {
    var self = this
    var items = []
    switch (typeof method) {
      case 'string':
        method = this[method]
      case 'function':
        items.push({ method: method, filter: filter })
        break
      case 'object':
        Object.keys(method).forEach(function(key) {
          items.push({method: self[key], filter:method[key]})
        })
    }

    this['_'+name] = [].concat(items, this['_'+name] || [])
  }
}

var createExecFunction = module.exports.createExecFunction = function(name) {
  return function(callback) {
    var items = this['_'+name]
    if (!Array.isArray(items)) return callback()

    var concurrent = []
    var serial = []
    items.forEach(function(item) {
      if (!!(item.filter && item.filter.async))
        return concurrent.push(item)
      serial.push(item)
    })

    var run = runItem.bind(this)
    async.parallel([
      function(cb) { async.forEach(concurrent, run, cb) },
      function(cb) { async.forEachSeries(serial, run, cb) }
    ], callback)

  }
}

function runItem(item, callback) {
  var filter = item.filter
  if (filter) {
    var format = this.mediaType()
    var action = this.route.action
    // filter out non matching media type formats
    if (filter.format && !getRegexp(filter.format).test(format)) return callback()
    // filter out excepted actions
    if (filter.except && action) {
      if (Array.isArray(filter.except) && ~filter.except.indexOf(action)) return callback()
      if (filter.except == action) return callback()
    }
    // filter out actions not in `only`
    if (filter.only && action) {
      if (Array.isArray(filter.only) && !~filter.only.indexOf(action)) return callback()
      if (!Array.isArray(filter.only) && filter.only != action) return callback()
    }
  }
  item.method.call(this, callback)
}
