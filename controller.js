// Controller
// ==========
// Base controller class. Extend with an initialize method
// and actions (methods) to handle requests.

module.exports = Controller

var _ = require('underscore')
var extendable = require('extendable')
var Plugin = require('./plugins')

function Controller(options) {
  this.res = options.res
  this.req = options.req
  this.config = options.config
  this.route = options.route
  this.templating = options.templating

  this.runPlugins()

  this.req.on('timeout', this.timeout.bind(this))

  this.model = {}

  this._done = this._done.bind(this)
  options.done = this._done

  this._defaultMediaType = this.config.defaultMediaType || 'text/html'

  this.initialize.apply(this, arguments)

  // Call the `action` if one was matched in the route
  if (options.route.action) {
    var action = this[options.route.action]
    if (action) action.call(this, this._done)
  }
}

_.extend(Controller.prototype, {

  // Called when the action method is done populating the
  // this.model object with data.
  _done: function() {
    this._render()
  },

  // Determines the best response type based on what the
  // client can accept and what the controller can output.
  _render: function(mediaType) {
    var preferredType = mediaType || this.req.contentNegotiator.preferredMediaType(this.availableMediaTypes)

    if (/html$/.test(preferredType)) {
      var html = this.render()
      if (this.html) return this.html(html)
      throw 'No `html` method implemented'
    }

    if (/json$/.test(preferredType)) {
      if (this.json) return this.json(this.model)
      throw 'No `json` method implemented'
    }

    if (/xml$/.test(preferredType)) {
      if (this.xml) return this.xml(this.model)
      throw 'No `xml` method implemented'
    }

    // no match, try with the default media type
    if (!mediaType) return this._render(this._defaultMediaType)

    return this.res.end('No media type matched')
  },


  // Initialize is an empty method by default. Override
  // it with your own initialization logic.
  initialize: function(){},

  // ## Response Format Methods

  // Render the object attached to this.model using
  // the specified template and layout settings.
  // Override this method to provide alternate
  // behavior.
  html: function() {
    var self = this
    this.templating.render(this.template, this.model, {
      layout: this.layout
    }, function(err, result) {
      if (err) return self.res.error(err)
      self.res.html(result)
    })
    // if (this.res.render)
    //   return this.res.render(this.template, this.model, {
    //     layout: this.layout,
    //     layoutDir: this.layoutDir,
    //     layoutRecursion: this.layoutRecursion
    //   })
    // throw 'Template render method not implemented'
  },

  // Output an error response to the client.
  // Override this method to provide alternate
  // behavior.
  error: function() {
    if (this.res.error)
      return this.res.error.apply(this.res, arguments)
    throw 'error response method not implemented'
  },

  timeout: function() {

  },


  // content types that can be output from this controller
  availableMediaTypes: [
    'text/html',
    'application/json'
  ],

  template: null,

  // layout rendering and recursion
  layout: 'layout',
  layoutRecursion: true,

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
