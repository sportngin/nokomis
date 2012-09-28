
var Plugin = require('../plugins')

var Respond = module.exports = Plugin.extend({

  /**
   * Provides a redirect helper on the res object
   *
   * @param {String} target
   * @param {Number} code
   * @api public
   */

  redirect: function (target, code) {
    this.res.statusCode = code || 302
    this.res.setHeader('location', target)
    var avail = ['text/html', 'application/json']
    var mt = req.contentNegotiator.preferredMediaType(avail)
    if (mt === 'application/json') {
      this.json({ redirect: target, statusCode: code })
    } else {
      this.html( '<html><body><h1>Moved'
              + (code === 302 ? ' Permanently' : '') + '</h1>'
              + '<a href="' + target + '">' + target + '</a>')
    }
  },

  /**
   * Provides a send helper
   *
   * @param {String} data
   * @param {Number} status
   * @param {Object} headers
   * @api public
   */

  send: function (data, status, headers) {
    this.res.statusCode = this.res.statusCode || status
    if (headers) Object.keys(headers).forEach(function (h) {
      this.res.setHeader(h, headers[h])
    })
    if (!Buffer.isBuffer(data)) data = new Buffer(data)
    this.res.setHeader('content-length', data.length)
    this.res.end(data)
  },

  /**
   * JSON helper for returning a json object
   * in the response
   *
   * @param {Object} obj
   * @param {Number} status
   * @api public
   */

  json: function (obj, status) {
    this.send(JSON.stringify(obj), status, {'content-type':'application/json'})
  },

  /**
   * HTML helper for returning an html string
   * in the response
   *
   * @param {String} data
   * @param {Number} status
   * @api public
   */

  html: function (data, status) {
    this.send(data, status, {'content-type':'text/html'})
  }

})
