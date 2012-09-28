
var Plugin = require('../plugins')
var Domain = require('domain')
var ErrorPage = require('error-page')



module.exports = Plugin.extend({

  initialize: function(config) {
    this._keyconfig.keys
  },

  run: function(instance) {
    var req = instance.req
    var res = instance.res

    var defaultErrorPageConfig = {
      404: handle404.bind(instance),
      500: handle500.bind(instance),
      '*': handleError.bind(instance),
      debug: false
    }

    // setup error-page module
    var errorPageConfig = _.extend(defaultErrorPageConfig, config.errorPage)
    instance.error = new ErrorPage(req, res, errorPageConfig)

    // Use a node Domain to handle all
    // unexpected errors in one location

    var domain = Domain.create()
    domain.add(req)
    domain.add(res)

    domain.on('error', function(err) {
      try {
        if (instance.error) {
          instance.error(err)
        } else {
          res.statusCode = 500
          res.setHeader('content-type', 'text/plain')
          res.end('Server Error\n' + err.message)
        }

        // don't destroy the domain before sending the error
        res.on('close', function() {
          domain.dispose()
        })

        // but don't wait forever
        setTimeout(function() {
          domain.dispose()
        }, 1000)

        // close down the server so a fresh worker can be started
        req.client.server.close()

      } catch (err) {
        domain.dispose()
      }
    })
  }

})

/**
 * Handle 404 error
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Object} data
 * @api private
 */

function handle404(req, res, data) {
  return handleError.call(this, req, res, data, 'errors/404')
}

/**
 * Handle 500 error
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Object} data
 * @api private
 */

function handle500(req, res, data) {
  return handleError.call(this, req, res, data, 'errors/500')
}

/**
 * Handle all response errors
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Object} data
 * @param {String} template
 * @api private
 */

function handleError(req, res, data, template) {
  console.log(data)

  template = template || 'errors/default'
  var availableMediaTypes = ['text/html', 'application/json']
  var preferred = this.preferredMediaType(availableMediaTypes)
  if (preferred == 'text/html')
    return this.render(template, data)

  var err = { error: _.extend({}, data) }
  delete err.error.options
  delete err.error.stack
  delete err.error.error
  this.json(err)
}
