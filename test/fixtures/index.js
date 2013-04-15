var sinon = require('sinon')
var EventEmitter = require('events').EventEmitter

var mockTeam = {
  id: 12345,
  name: 'Mock Team'
}


function getBareRequest() {
  var req = Object.create(EventEmitter.prototype)
  req.method = 'GET'
  req.url = 'http://team.sportngin.com/12345'
  req.socket = {
    remoteAddress: '192.168.1.1',
    remotePort: 12345,
    address: function() { return {address:'192.168.1.1', port:12345 } }
  }
  req.connection = {
    remoteAddress: '192.168.1.1',
    remotePort: 12345
  }
  req.headers = {}
  req.contentNegotiator = {
    preferredMediaType: sinon.stub().returns('text/html')
  }
  req.log = {
    info: sinon.spy(),
    warn: sinon.spy(),
    trace: sinon.spy(),
    error: sinon.spy()
  }

  //sinon.stub(req.socket, 'address')

  function newListener(event, listener) {
    var contentType = req.headers['content-type']
    var fulfilled = false
    var data
    if (contentType == 'application/json')
      data = '{"name":"Mike","hometown":"Minneapolis"}'
    else if (event == 'application/x-www-form-urlencoded')
      data = 'name=Mike&hometown=Minneapolis'
    else
      data = 'Some body of data'

    if (data) {
      setTimeout(function() {
        req.emit('data', new Buffer(data))
        req.emit('end')
      },10)
      req.removeListener('newListener', newListener)
    }
  }
  req.on('newListener', newListener)

  return req
}

function getBareResponse() {
  var res = Object.create(EventEmitter.prototype)
  res.setHeader = sinon.spy()
  res.end = sinon.spy()
  res.headers = {}
  res.contentNegotiator = {
    preferredMediaType: sinon.stub().returns('text/html')
  }
  return res
}


function getStubbedNgin() {
  function fetch(id, options, callback) {
    if (typeof options == 'function') callback = options
    options || (options = {})
    callback(null, mockTeam)
  }
  return {
    Team : {
      fetch: sinon.spy(fetch)
    },
    Member : {
      fetch: sinon.spy(fetch),
      list: sinon.spy(fetch)
    }
  }
}

function getStubbedRequest() {
  return {
    route: {
      perfect: true,
      params: { teamId:mockTeam.id }
    },
    ngin: getStubbedNgin(),
    team: sinon.spy(function(cb){
      cb(null, mockTeam)
    }),
    neg: {
      preferredMediaType: sinon.stub().returns('text/html')
    }
  }
}

function getStubbedResponse() {
  return {
    render: sinon.spy()
  }
}

function getRouteContext() {
  return {
    next: sinon.spy()
  }
}

function getConfig() {
  return {
    defaultMediaType: 'text/html'
  }
}

function getStubbedRoute() {
  return {
    params: {
      teamId: 12345,
      memberId: 12345
    }
  }
}

function getControllerOptions() {
  return {
    req: getStubbedRequest(),
    res: getStubbedResponse(),
    route: getStubbedRoute(),
    config: getConfig()
  }
}


module.exports = {
  mockTeam: mockTeam,
  getBareRequest: getBareRequest,
  getBareResponse: getBareResponse,
  getStubbedNgin: getStubbedNgin,
  getStubbedRequest: getStubbedRequest,
  getStubbedResponse: getStubbedResponse,
  getRouteContext: getRouteContext,
  getControllerOptions: getControllerOptions
}
