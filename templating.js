
var fs = require('fs')
var path = require('path')
var glob = require('glob')
var async = require('async')
var _ = require('underscore')
var extendable = require('extendable')

// Provide a basic compliant templating engine
var engine = {
  // The most basic of compile functions
  compile: function(str) {
    // Just provide a function that returns the template string
    return function() { return str }
  }
}



function Templating() {
  this.cache = _.extend({}, this.cache)
}

_.extend(Templating.prototype, {

  engine: engine,
  templatePath: '../../app/templates',
  cache: {},

  render: function(tmpl, data, options, callback) {
    var self = this
    console.log('Rendering template', tmpl)
    this.loadTemplate(tmpl, options, function(err, template) {
      if (err) return callback(err)

      self.renderTemplate(template, data, function(err, result) {
        if (err) return callback(err)
        if (options.layout === false)
          return callback(err, result)

        var layout = typeof options.layout === 'string' ? options.layout : 'layout'
        options = _.extend({}, options, {layout:false})
        data = _.extend({}, data, {__body:result})
        self.render(layout, data, options, function(err, result) {
          callback(err, result)
        })
      })
    })
  },

  renderTemplate: function(template, data, callback) {
      var result, error
      try {
        result = template(data)
      } catch(e) {
        console.error(e)
        error = e
      }
      callback(error, result)
  },

  loadTemplate: function(tmplName, options, callback) {
    var self = this

    if (this.cache[tmplName]) return callback(null, this.cache[tmplName])

    if (typeof options == 'function') {
      callback = options
      options = {}
    }

    var filePath = path.resolve(this.templatePath, tmplName)
    // normalize tmplName with the specified extension
    if (this.extension && !~filePath.indexOf('.'+this.extension))
      filePath += '.' + this.extension

    fs.readFile(filePath, 'utf8', function(err, data) {
      if (err) {
        console.error('Error loading template [Templating::loadTemplate]', filePath)
        console.error(err)
        callback(err)
      }

      var template = self.cache[tmplName] = self.engine.compile(data, options)
      callback(null, template)
    })
  },

  preload: function(match, callback) {
    var self = this
    var ext = this.extension ? '.' + this.extension : ''
    match = match || ('**/*' + ext)
    var files = glob.sync(match, {cwd:this.templatePath})
    async.forEach(files, function(file, cb) {
      file = file.substring(0, file.lastIndexOf(ext))
      self.loadTemplate(file, cb)
    }, function(err) {
      if (err) console.error('Error preloading templates')
      if (typeof callback == 'function') callback(err)
    })
  }

})

Templating.extend = extendable

module.exports = Templating
