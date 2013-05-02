// Restful Routes, according to Rails: http://guides.rubyonrails.org/routing.html
// HTTP   Verb Path         action  used for
// ****** ***************** ******* ********
// GET    /photos           index   display a list of all photos
// GET    /photos/new       new     return an HTML form for creating a new photo
// POST   /photos           create  create a new photo
// GET    /photos/:id       show    display a specific photo
// GET    /photos/:id/edit  edit    return an HTML form for editing a photo
// PUT    /photos/:id       update  update a specific photo
// DELETE /photos/:id       destroy delete a specific photo

/*

  {
    '/photos' : {
      controller: 'controller',
      GET:        'index',
      POST:       'create'
    },
    '/photos/:id' : {
      controller: 'controller',
      GET:        'show',
      PUT:        'update',
      DELETE:     'destroy'
    },
    '/photos/:id/edit' : {
      controller: 'controller',
      GET:        'edit'
    }
  }

*/

var assert = require('assert')
var sinon = require('sinon')
var tf = require('./fixtures')
var router
var controller = require('./fixtures/controller')

describe('Router', function() {

  beforeEach(function(done) {
    // the router needs to be un-cached for these tests to work properly.
    delete require.cache[require.resolve('../router')]
    delete require.cache[require.resolve('routes')]

    router = require('../router')
    router.setControllerPath(__dirname+'/fixtures')
    done()
  })

  describe('Register', function() {

    it('should have register method', function(done) {
      assert(router.register)
      done()
    })

    it('should correctly register a route', function(done) {
      var route = '/route/:id'
      var handler = {controller:'controller'}
      router.register(route, handler)
      assert.equal(router.routes[route], handler)
      done()
    })

    it('should correctly register a route with object syntax', function(done) {
      var handler = {controller:'controller'}
      router.register({ '/my/:route': handler })
      assert.equal(router.routes['/my/:route'], handler)
      done()
    })

    it('should correctly register a route with object syntax and action string', function(done) {
      var handler = {controller:'controller', action:'index'}
      router.register({ '/my/:route': handler })
      assert.equal(router.routes['/my/:route'], handler)
      done()
    })

    it('should correctly register a route with object syntax and method array', function(done) {
      var handler = {controller:'controller', method:['GET','POST']}
      router.register({ '/my/:route': handler })
      assert.equal(router.routes['/my/:route'], handler)
      done()
    })

    it('should correctly register a route with object syntax and method key', function(done) {
      var handler = {controller:'controller', GET:'index'}
      router.register({ '/my/:route': handler })
      assert.equal(router.routes['/my/:route'], handler)
      done()
    })

    it('should correctly register a route with object syntax and many method keys', function(done) {
      var handler = {controller:'controller', GET:'index', POST:'create'}
      router.register({ '/my/:route': handler })
      assert.equal(router.routes['/my/:route'], handler)
      done()
    })

    it('should overwrite a route declared multiple times', function(done) {
      var handler1 = {controller:'controller', GET:'index'}
      var handler2 = {controller:'controller', POST:'index'}
      router.register('/my/:id', handler1)
      router.register('/my/:id', handler2)
      assert.equal(router.routes['/my/:id'], handler2)
      done()
    })

  })

  describe('Match', function(){

    var req

    beforeEach(function() {
      req = {
        url: '/your/value',
        method: 'GET',
        log: { info: sinon.spy(), error: sinon.spy() }
      }
    })

    it('should have a match method', function(done) {
      assert(router.match)
      done()
    })

    it('should return falsey value when the url does not match a route', function(done) {
      req.url = 'dont match anything'
      var match = router.match(req)
      assert(!match)
      done()
    })

    it('should match when the url correctly matches a route', function(done) {
      var handler = {controller:'controller'}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert(!match.action)
      done()
    })

    it('should match with an action', function(done) {
      var handler = {controller:'controller', action:'action'}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert.equal(match.action, 'action')
      done()
    })

    it('should set an empty string action to undefined', function(done) {
      var handler = {controller:'controller', action:''}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert.equal(match.action, undefined)
      done()
    })

  })

  describe('Match HTTP Methods', function(){

    var req

    beforeEach(function() {
      req = {
        url: '/your/value',
        method: 'GET',
        log: { info: sinon.spy(), error: sinon.spy() }
      }
    })

    it('should match single HTTP method', function(done) {
      var handler = {controller:'controller', method:'GET'}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      done()
    })

    it('should match HTTP method array', function(done) {
      var handler = {controller:'controller', method:['GET','POST']}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)

      req.method = 'POST'
      match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      done()
    })

    it('should not match different HTTP methods', function(done) {
      var handler = {controller:'controller', method:['GET','POST']}
      router.register('/your/:id', handler)

      req.method = 'PUT'
      var match = router.match(req)
      assert(!match)
      done()
    })

    it('should match method key', function(done) {
      var handler = {controller:'controller', GET:'index'}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert.equal(match.action, 'index')
      done()
    })

    it('should match multiple method keys', function(done) {
      var handler = {controller:'controller', GET:'index', POST:'create'}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert.equal(match.action, 'index')

      req.method = 'POST'
      match = router.match(req)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert.equal(match.action, 'create')
      done()
    })

    it('should match the controller method defined last', function(done){
      var handler1 = {controller:'controller', GET:'index'}
      var handler2 = {controller:'controller', POST:'create'}
      router.register('/your/:id', handler1)
      router.register('/your/:id', handler2)

      // this shouldn't match
      var match = router.match(req)
      assert(!match)

      // this should match
      req.method = 'POST'
      match = router.match(req)
      assert(match)
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert.equal(match.action, 'create')
      done()
    })

  })

  describe('Match Object', function(){

    var req

    beforeEach(function() {
      req = {
        url: '/your/value',
        method: 'GET',
        log: { info: sinon.spy(), error: sinon.spy() }
      }
    })

    it('should have a empty query property without a querystring', function(done) {
      var handler = {controller:'controller'}
      router.register('/your/:id', handler)

      var match = router.match(req)
      assert(sinon.match.object.test(match.query))
      done()
    })

    it('should have a query property with the querystring data', function(done) {
      var handler = {controller:'controller'}
      router.register('/your/:id', handler)

      req.url = '/your/value?somekey=somevalue'
      var match = router.match(req)
      assert.equal(match.query.somekey, 'somevalue')
      done()
    })

  })

})
