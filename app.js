var http = require('http')
var path = require('path')
var Domain = require('domain')

var _ = require('underscore')
var extendable = require('extendable')

var master = require('./master')
var router = require('./router')

function App(config) {
  this.config = _.extend({}, this.config, config)
  this.router = router

  this.setupRoutes(this.router)
  this.setupHttpServer()

  this.initialize.apply(this, arguments)
}

_.extend(App.prototype, {

  initialize: function() {},
  setupRoutes: function() {},

  // initializes the http server for this app instance
  setupHttpServer: function() {
    if (this.server) return this.server
    var self = this
    var config = this.config.server

    // Setup HTTP server
    var server = http.createServer(this.handleRequest.bind(this))

    // start the server
    server.listen(config.port, function(){
      console.log('Listening on %d', config.port)
    })

    // clean up
    server.on('close', function(){
      self.emit('close')
      console.log('Worker closing')
    })
  },

  // handle the individual http requests coming in
  handleRequest: function(req, res) {

    // match a controller from the router
    var route = req.route = this.router.match(req)

    var run = function() {
      // without a matching route, send a 404
      if (!route) {
        var msg = 'No route matched for ' + req.url
        console.log(msg)

        res.statusCode = 404
        res.setHeader('content-type', 'text/plain')
        return res.end(msg)
      }

      // run matched controller
      var controller = new route.controller({
        req: req,
        res: res,
        route: route,
        config: this.config
      })
    }.bind(this)

    var env = this.config.NODE_ENV
    if (env && env !== 'development') {
      this.wrapWithDomain(res, run)
    } else {
      run()
    }
  },

  wrapWithDomain: function(res, run) {
    // wrap the middleware and controller action calls in
    // a domain to capture any unhandled exceptions
    var domain = Domain.create()
    domain.on('error', function(err) {
      try {
        //res.error(500, err)
        res.statusCode = 500
        console.log(err)
        res.end('An error occurred.')
      }
      finally {
        domain.dispose()
      }
    })
    domain.run(run)
  }

})

App.extend = extendable


// Class methods that pertain to the cluster master

App.start = function(config) {
  master.start(config)
}

App.stop = function() {
  master.stop()
}

module.exports = App
