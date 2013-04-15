var crypto = require('crypto')
var bunyan = require('bunyan')

var logger

exports.setup = function(req, res, config) {
  if (!logger) logger = bunyan.createLogger(config || { name:'Nokomis App' })

  res.log = req.log = logger.child({
    serializers: bunyan.stdSerializers,
    req_id: crypto.randomBytes(4).toString('hex'),
    session: req.sessionToken
  })

  // log basic info about the request
  req.log.info('Request recieved:', req.method, req.url)

  // log detailed information about the request and
  // the client making it
  var remoteAddr = req.socket.remoteAddress + ':' + req.socket.remotePort
  var address = req.socket.address()
  address = address.address + ':' + address.port
  req.log.trace({
    req: req,
    remote: remoteAddr,
    address: address
  })

  // log the response when the request has finished
  res.on('finish', function() {
    req.log.info('Response complete: Status', res.statusCode)
    req.log.trace({ res: res })
  })
}


