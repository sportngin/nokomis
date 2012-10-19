/**
 * router.js
 *
 * Defers to a controller based on the given route.
 */

var Url = require('url')
var path = require('path')
var router = new (require('routes').Router)()
var _ = require('underscore')
var routes = exports.routes = {}
var controllerPath = '../controllers/'
var VERBS = ['HEAD','GET','POST','PUT','DELETE','TRACE','OPTIONS','CONNECT','PATCH']

/**
 * Registers a series of routes and their
 * corresponding controllers on the router
 *
 * @param {object} routes
 * @api public
 */

exports.register = function(rte, ctlr) {
  var rts = {}

  // handle both `rte, ctlr` and `{rte: ctlr}` style arguments
  if (typeof rte == 'object') {
    rts = rte
  } else {
    rts[rte] = ctlr
  }

  _.extend(routes, rts)


  Object.keys(rts).forEach(function(route) {
    // define each route and provide a custom handler for it
    // router.define(route, function() {
    router.addRoute(route, function(method) {
      // fetch the controller and determine
      // whether or not to use an action
      var handler = rts[route]

      // test for HTTP method
      if (!testHTTPMethod(method, handler)) return null

      var controller  = require(controllerPath + handler.controller)
      this.controller = controller
      this.route      = route
      this.action     = handler[method] || handler.action || undefined

      // remove `fn` which is this function
      delete this.fn
      return this
    })
  })
}

/**
 * Match a route from a url
 *
 * @param {object} req      http server request
 * @returns {object}
 *    cbs {array}           collection of callbacks
 *    controller {function} best matching controller
 *    action {string}       best matching controller action
 *    perfect {boolean}     perfect route match
 *    extras {array}        regexp capture groups not part of params
 *    params {object}       collection of colon args
 *    next {function}       invokes the next matching funcion if one exists
 * @api public
 */

exports.match = function(req) {
  var pathname = Url.parse(req.url).pathname
  var normalPathname = path.normalize(pathname)
  var match = router.match(normalPathname)
  return match && match.fn && match.fn(req.method) || null
}

/**
 * Sets the file path of the app's controllers
 *
 * @param {string} path
 * @api public
 */

exports.setControllerPath = function(path) {
  path = path || '.'
  if (path.substring(path.length-1) !== '/') path += '/'
  controllerPath = path
}

/**
 * Tests to see if the given method is
 * expected by the route
 *
 * @param {string} method
 * @param {string|array} expected
 * @returns {boolean}
 * @api public
 */

function testHTTPMethod(method, handler) {
  var expected = handler.method

  // check to see if methods hasn't been set as a string, an array, or as a key on the handler
  if (!expected && !handler[method]) {
    // if so, we need to reject verbs that haven't been explicitly set...
    if (_.intersection(_.keys(handler), VERBS).length) return false
  }

  // ...otherwise, we're dealing with a more generic route
  if (!expected || _.isEmpty(expected)) return true   // if it went this far, this generic route test should suffice
  if (!Array.isArray(expected)) expected = [expected] // otherwise, convert the expected methods to an array if necessary
  return !!~expected.indexOf(method)                  // check for the sent method in the declaration of acceptable methods
}
