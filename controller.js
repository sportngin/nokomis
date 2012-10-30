// Controller
// ==========
// Base controller class. Extend with an initialize method
// and actions (methods) to handle requests.

module.exports = Controller

var EventEmitter = require('events').EventEmitter
var _ = require('underscore')
var extendable = require('extendable')
var Plugin = require('./plugin')

function Controller(options) {
  this.res = options.res
  this.req = options.req
  this.config = options.config
  this.route = options.route

  // setup as an event emitter
  EventEmitter.call(this)

  // run plugin setup for this controller instance
  this.runPlugins()

  // setup request timeout handler
  this.req.on('timeout', this.timeout.bind(this))

  this.model = {}

  this._done = this._done.bind(this)
  options.done = this._done

  this._defaultMediaType = this.config && this.config.defaultMediaType || 'text/html'

  this.initialize.apply(this, arguments)

  // Call the `action` if one was matched in the route
  if (options.route.action) {
    var action = this[options.route.action]
    if (action) action.call(this, this._done)
  }
}

_.extend(Controller.prototype, EventEmitter.prototype, {

  // Called when the action method is done populating the
  // this.model object with data.
  _done: function() {
    this._render()
  },

  // Determines the best response type based on what the
  // client can accept and what the controller can output.
  _render: function(mediaType) {
    var self = this
    var preferredType = mediaType || this.preferredMediaType(this.availableMediaTypes)

    if (/html$/.test(preferredType)) {
      return this.render(function(err, html){
        if (err) self.error(err)
        if (self.html) return self.html(html)
        throw 'No `html` method implemented'
      })
    }

    if (/json$/.test(preferredType)) {
      if (this.json) return this.json(this.serialize())
      throw 'No `json` method implemented'
    }

    if (/xml$/.test(preferredType)) {
      if (this.xml) return this.xml(this.serialize())
      throw 'No `xml` method implemented'
    }

    // no match, try with the default media type
    if (!mediaType) return this._render(this._defaultMediaType)

    return this.res.end('No media type matched')
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
  }

})

Controller.extend = extendable
Plugin.makePluggable(Controller)
