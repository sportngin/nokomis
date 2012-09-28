
var Plugin = require('../plugins')
var Negotiator = require('negotiator')

var ContentNegotiator = module.exports = Plugin.extend({

  run: function() {
    this._neg = new Negotiator(this.req)
  },

  preferredMediaType: function() {
    return this._neg.preferredMediaType.apply(this._neg, arguments)
  },

  preferredMediaTypes: function() {
    return this._neg.preferredMediaTypes.apply(this._neg, arguments)
  },

  preferredLanguage: function() {
    return this._neg.preferredLanguage.apply(this._neg, arguments)
  },

  preferredLanguages: function() {
    return this._neg.preferredMediaTypes.apply(this._neg, arguments)
  }

})