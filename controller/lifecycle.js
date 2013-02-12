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
    for (var key in filter) {
      var func = filterFunctions[key]
      if (func && func(this, filter[key])) return callback()
    }
  }
  item.method.call(this, callback)
}

var filterFunctions = {
  format: function(ctlr, format) {
    // filter out non matching media type formats
    var mediaType = ctlr.mediaType()
    return format && !getRegexp(format).test(mediaType)
  },
  except: function(ctlr, except) {
    // filter out excepted actions
    var action = ctlr.route.action
    if (!action) return false
    if (Array.isArray(except) && ~except.indexOf(action)) return true
    return except == action
  },
  only: function(ctlr, only) {
    // filter out actions not in `only`
    var action = ctlr.route.action
    if (!action) return false
    if (Array.isArray(only) && !~only.indexOf(action)) return true
    return !Array.isArray(only) && only != action
  },
  verb: function(ctlr, verb) {
    var method = ctlr.req.method
    // if (!method) return false
    if (Array.isArray(verb) && !~verb.indexOf(method)) return true
    return !Array.isArray(verb) && verb != method
  }
}
