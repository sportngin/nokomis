// Handles data sent via POST or PUT

// TODO: Gut this and use https://github.com/felixge/node-formidable
// However, node-formidable does not have json upload support so
// it will need to be patched.

var Plugin = require('../plugin')
var qs = require('querystring')
var StringDecoder = require('string_decoder').StringDecoder

module.exports = Plugin.extend({

  initialize: function(config) {

  },

  run: function(instance) {
    //instance.cookies = new Cookies(instance.req, instance.res, config.cookiesKeys)
    var req = instance.req

    var body = ''
    var data = new StringDecoder
    req.on('data', function(c) {
      body += data.write(c)
    })
    req.on('end', function() {
      req.body = body
      req.emit('body', body)
    })

    req.data = {
      json: function(callback) {
        if (!req.headers['content-type'].match(/\/(x-)?json$/)) {
          callback({statusCode:415})
        }
        if (req.body)
          return processJSON(req.body, callback)
        req.on('body', function(body) {
          processJSON(body, callback)
        })
      },
      form: function(callback) {
        if (req.headers['content-type'] !== 'application/x-www-form-urlencoded') {
          return res.error(415)
        }
        if (req.body) return processForm(req.body, callback)
        req.on('body', function(body) {
          processForm(body, callback)
        })
      },
      body: function(callback) {
        if (req.body) return callback(req.body)
        req.on('body', function(body) {
          callback(null, body)
        })
      }
    }
  }

})

/**
 * Attempt to process the body data into JSON
 *
 * @param {String} body
 * @param {Function} callback
 */

function processJSON(body, callback) {
  var json
  try {
    json = JSON.parse(body)
  } catch (err) {
    err.statusCode = 400
    return callback(err)
  }
  return callback(null, json)
}

/**
 * Attempt to process the body
 * data into an object hash
 *
 * @param {String} body
 * @param {Function} callback
 */

function processForm(body, callback) {
  callback(null, qs.parse(body))
}