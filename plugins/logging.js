
var Plugin = require('../plugins')
var crypto = require('crypto')
var bunyan = require('bunyan')

module.exports = Plugin.extend({

  initialize: function(config) {
    this._logger = bunyan.createLogger(config.log || { name:'Nokomis App' })
  },

  run: function(instance) {
    var req = instance.req
    var res = instance.res
    instance.log = res.log = req.log = this._logger.child({
      serializers: bunyan.stdSerializers,
      req_id: crypto.randomBytes(4).toString('hex'),
      session: req.sessionToken
    })

    // log information about the request and
    // the client making it
    var remoteAddr = req.socket.remoteAddress + ':' + req.socket.remotePort
    var address = req.socket.address()
    address = address.address + ':' + address.port
    req.log.info({
      req: req,
      remote: remoteAddr,
      address: address
    })

    // log the response when the request has finished
    req.on('finish', function() {
      req.log.info({ res: res })
    })
  }

})
