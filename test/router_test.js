
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
  })

  describe('Match', function(){

    it('should have a match method', function(done) {
      assert(router.match)
      done()
    })

    it('should return falsey value when the url does not match a route', function(done) {
      var match = router.match({url:'dont match anything', method:'GET'})
      assert(!match)
      done()
    })

    it('should match when the url correctly matches a route', function(done) {
      var handler = {controller:'controller'}
      router.register('/my/:id', handler)

      var match = router.match({url:'/my/value', method:'GET'})
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert(!match.action)
      done()
    })

    it('should match with an action', function(done) {
      var handler = {controller:'controller', action:'action'}
      router.register('/your/:id', handler)

      var match = router.match({url:'/your/value', method:'GET'})
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      assert.equal(match.action, 'action')
      done()
    })

    it('should match single HTTP method', function(done) {
      var handler = {controller:'controller', method:'GET'}
      router.register('/your/:id', handler)

      var match = router.match({url:'/your/value', method:'GET'})
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      done()
    })

    it('should match HTTP method array', function(done) {
      var handler = {controller:'controller', method:['GET','POST']}
      router.register('/your/:id', handler)

      var match = router.match({url:'/your/value', method:'GET'})
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)

      match = router.match({url:'/your/value', method:'POST'})
      assert.equal(typeof match, 'object')
      assert.equal(match.controller, controller)
      done()
    })

    it('should not match different HTTP methods', function(done) {
      var handler = {controller:'controller', method:['GET','POST']}
      router.register('/your/:id', handler)

      var match = router.match({url:'/your/value', method:'PUT'})
      assert(!match)
      done()
    })

  })

})