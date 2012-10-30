var Plugin = require('../plugin')
var _ = require('underscore')
var path = require('path')
var extendable = require('extendable')

var Templating = require('../templating')

module.exports = Plugin.extend({

  initialize: function(config) {
    var tmpl = this.tmpl = new Templating()
    tmpl.templatePath = config.templatePath || tmpl.templatePath
  },

  run: function(instance) {
    instance.tmpl = this.tmpl
  },

  // this can be overridden in your subclassed template plugin or an individual controller
  serialize: function() {
    return this.model
  },

  render: function(callback) {
    var tmpl = this.template
    var data = this.serialize()
    var options = this.templateOptions || {}
    this.tmpl.render(tmpl, data, options, callback)
  }

})
