// Controller
// ==========
// Base controller class. Extend with an initialize method
// and actions (methods) to handle requests.

module.exports = Controller

var EventEmitter = require('events').EventEmitter
var _ = require('underscore')
var async = require('async')
var extendable = require('extendable')
var lifecycle = require('./lifecycle')
var Plugin = require('../plugin')

function Controller(options) {
  this.res = options.res
  this.req = options.req
  this.config = options.config
  this.route = options.route

  this.templateOptions = _.extend({}, this.templateOptions)

  var args = Array.prototype.slice.call(arguments)

  // setup as an event emitter
  EventEmitter.call(this)


  if (this.runPlugins) {
    // run plugin setup for this controller instance
    console.log('Running plugins')
    this.runPlugins(afterPlugins.bind(this))
  }
  else {
    afterplugins.bind(this)()
  }

  function afterPlugins(err) {
    // if the response has already finished, abandon the rest
    if (this.res.finished) {
      console.log('A plugin terminated the response.')
      return
    }

    // setup request timeout handler
    this.req.on('timeout', this.timeout.bind(this))

    this.model = {}

    this._done = this._done.bind(this)
    options.done = this._done

    this._defaultMediaType = this.config && this.config.defaultMediaType || 'text/html'

    console.log('Running controller\'s initialize function')
    this.initialize.apply(this, args)

    this.runBefore(function(err) {
      if (err) return this.error(err)
      var parallelFuncs = [this.runDuring.bind(this)]
      // Call the `action` if one was matched in the route
      if (options.route.action) {
        console.log('Calling the controller\'s ' + options.route.action + ' action')
        var action = this[options.route.action]
        if (action) parallelFuncs.push(action.bind(this))
      }
      // run 'during' methods and the action if there is one
      async.parallel(parallelFuncs, this._done)
    }.bind(this))
  }
}

_.extend(Controller.prototype, EventEmitter.prototype, {

  // Called when the action method is done populating the
  // this.model object with data.
  _done: function() {
    if (this.res.finished) return
    this.runAfter(function(err) {
      if (err) return this.error(err)
      this._render()
    }.bind(this))
  },

  // Determines the best response type based on what the
  // client can accept and what the controller can output.
  _render: function() {
    var self = this

    var preferredType = this.mediaType()

    if (/html$/.test(preferredType)) {
      console.log('Rendering HTML')
      return this.render(function(err, html){
        if (err) self.error(err)
        if (self.html) return self.html(html)
        throw 'No `html` method implemented'
      })
    }

    if (/json$/.test(preferredType)) {
      console.log('Rendering JSON')
      if (this.json) return this.json(this.model)
      throw 'No `json` method implemented'
    }

    if (/xml$/.test(preferredType)) {
      console.log('Rendering XML')
      if (this.xml) return this.xml(this.model)
      throw 'No `xml` method implemented'
    }

    this.error(415, 'Media type not supported')
  },

  before: lifecycle.createRegFunction('before'),
  runBefore: lifecycle.createExecFunction('before'),
  during: lifecycle.createRegFunction('during'),
  runDuring: lifecycle.createExecFunction('during'),
  after: lifecycle.createRegFunction('after'),
  runAfter: lifecycle.createExecFunction('after'),

  // Determines the media type to respond with. Override
  // with your own content negotiation code.
  mediaType: function() {
    return this._defaultMediaType
  },

  // Initialize is an empty method by default. Override
  // it with your own initialization logic.
  initialize: function(){},

  // Handles a timed out request. Override with your
  // own logic and error handling.
  timeout: function() {
    this.error(504, 'Server timeout')
  },

  // content types that can be output from this controller
  availableMediaTypes: [
    'text/html',
    'application/json'
  ],

  // template settings
  template: null,
  templateOptions: {
    layout: 'layout'
  },

  // A stub for rendering content from a template. Override
  // with your own rendering code.
  render: function(callback) {
    return callback(null, '')
  },

  error: function() {
    var args = Array.prototype.slice.call(arguments)
    var status = 500
    var message = 'An error occured'
    args.forEach(function(v) {
      if (typeof v === 'string')
        message = v
      else if (typeof v === 'number')
        status = v
    })
    this.res.setHeader('content-type', 'text/plain')
    this.res.statusCode = status
    this.res.end(message)
  },

  // Call this in your initialize function to enforce
  // a maximum request size. Useful for file uploads.
  enforceMaxLength: function(maxLen) {
    // respond with errors if max length is exceeded
    if (typeof maxLen === 'number') {
      var cl = req.headers['content-length']
      res.setHeader('max-length', ''+maxLen)
      if (!cl) {
        res.error(411)  // length required
        return false
      }
      if (cl > req.maxLen) {
        res.error(413) // too long
        return false
      }
    }
    return true
  },

  // Transfers this request over to another controller
  transfer: function(controller, action, data) {
    // make sure the page can no longer render from this controller
    this._render = function(){}

    var self = this
    // use nextTick to let the stack clear before firing the event
    // since it's possible the handler won't be registered yet.
    process.nextTick(function(){
      // the app will be listening for a transfer event and
      // will create a new controller based on the current one
      self.emit('transfer', self, controller, action, data)
    })
  }

})

Controller.extend = extendable
// Plugin.makePluggable(Controller)
