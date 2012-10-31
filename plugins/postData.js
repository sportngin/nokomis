// Handles data sent via POST or PUT

var Plugin = require('../plugin')
var qs = require('querystring')
var formidable = require('formidable')
var StringDecoder = require('string_decoder').StringDecoder

module.exports = Plugin.extend({

  run: function(instance) {
    var req = instance.req

    var form = new formidable.IncomingForm()
    var files, fields, error

    form.parse(req, function(err, flds, fls) {
      error = err
      fields = flds
      files = fls
    })

    req.data = function(callback) {
      if (error || files || fields) {
        return callback(error, fields, files)
      }
      form.on('end', function() {
        return callback(error, fields, files)
      })
    }
  }

})
