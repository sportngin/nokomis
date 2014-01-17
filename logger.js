var crypto = require('crypto')
var bunyan = require('bunyan')

var logger

exports.setup = function(req, res, config) {
  if (!logger) logger = bunyan.createLogger(config || { name:'Nokomis App' })

  var log = res.log = req.log = logger.child({
    serializers: bunyan.stdSerializers,
    req_id: crypto.randomBytes(4).toString('hex'),
    session: req.sessionToken
  })

  // high resolution timer on log
  var timerCache = {}
  log.time = function(str) {
    if (!timerCache[str])
      timerCache[str] = process.hrtime()
  }
  log.timeEnd = function(str) {
    if (!timerCache[str]) return
    var diff = process.hrtime(timerCache[str])
    var ms = diff[0] * 1e3 + diff[1] / 1e6
    log.info(str+': ' + ms.toFixed(3) + 'ms')
    timerCache[str] = null
  }

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


