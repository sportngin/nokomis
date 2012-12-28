var assert = require('assert')
var sinon = require('sinon')
var lifecycle = require('../controller/lifecycle')

function createTestClass() {
  var TC = function(){
    this.route = {}
  }
  TC.prototype.mediaType = sinon.spy(function() {
    return this.format || 'text/html'
  })
  TC.prototype.before = lifecycle.createRegFunction('before')
  TC.prototype.runBefore = lifecycle.createExecFunction('before')
  TC.prototype.method = sinon.spy()
  TC.prototype.asyncMethod = sinon.spy(function(cb) {
    process.nextTick(cb)
  })
  return TC
}

describe('Lifecycle', function() {

  var TestClass

  describe('createRegFunction', function() {

    it('should exist', function(done) {
      assert(lifecycle.createRegFunction)
      done()
    })

    it('should return a function', function(done) {
      var result = lifecycle.createRegFunction()
      assert.equal(typeof result, 'function')
      done()
    })

  })

  describe('createExecFunction', function() {

    it('should exist', function(done) {
      assert(lifecycle.createExecFunction)
      done()
    })

    it('should return a function', function(done) {
      var result = lifecycle.createExecFunction()
      assert.equal(typeof result, 'function')
      done()
    })

  })

  describe('Registering', function() {

    beforeEach(function(done) {
      TestClass = createTestClass()
      done()
    })

    it('should accept method as a string', function(done) {
      var tc = new TestClass()
      tc.before('method', {})
      assert.strictEqual(tc._before.length, 1)
      assert.strictEqual(tc._before[0].method, tc.method)
      done()
    })

    it('should accept method as a function', function(done) {
      var tc = new TestClass()
      tc.before(tc.method, {})
      assert.strictEqual(tc._before.length, 1)
      assert.strictEqual(tc._before[0].method, tc.method)
      done()
    })

    it('should accept a hash', function(done) {
      var tc = new TestClass()
      tc.before({ 'method': {} })
      assert.strictEqual(tc._before.length, 1)
      assert.strictEqual(tc._before[0].method, tc.method)
      done()
    })

  })

  describe('Running', function() {

    beforeEach(function(done) {
      TestClass = createTestClass()
      done()
    })

    it('should run a callback without any added methods', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.runBefore(function(err) {
        assert(true)
        done()
      })
    })

    it('should be asynchronous', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.before('asyncMethod', {})
      tc.runBefore(function(err) {
        assert(tc.asyncMethod.calledOnce)
        done()
      })
    })

  })

  describe('Format filter', function() {

    beforeEach(function(done) {
      TestClass = createTestClass()
      done()
    })

    it('should not filter if not present', function(done) {
      var tc = new TestClass()
      tc.before('method', {})
      tc.runBefore()
      assert(tc.method.calledOnce)
      done()
    })

    it('should not filter if formats match', function(done) {
      var tc = new TestClass()
      tc.format = 'text/html'
      tc.before('method', { format:'html' })
      tc.runBefore()
      assert(tc.method.calledOnce)
      done()
    })

    it('should filter if formats do not match', function(done) {
      var tc = new TestClass()
      tc.format = 'text/html'
      tc.before('method', { format:'json' })
      tc.runBefore()
      assert(!tc.method.called)
      done()
    })

  })

  describe('Except filter', function() {

    beforeEach(function(done) {
      TestClass = createTestClass()
      done()
    })

    it('should not filter if not present', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.before('method', {})
      tc.runBefore()
      assert(tc.method.calledOnce)
      done()
    })

    it('should filter if actions match', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.before('method', { except:['action'] })
      assert(!tc.method.called)
      tc.runBefore()
      assert(!tc.method.called)
      done()
    })

    it('should not filter if actions do not match', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.before('method', { except:['otherAction'] })
      tc.runBefore()
      assert(tc.method.calledOnce)
      done()
    })

  })

  describe('Only filter', function() {

    beforeEach(function(done) {
      TestClass = createTestClass()
      done()
    })

    it('should not filter if not present', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.before('method', {})
      tc.runBefore()
      assert(tc.method.calledOnce)
      done()
    })

    it('should not filter if actions match', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.before('method', { only:['action'] })
      tc.runBefore()
      assert(tc.method.calledOnce)
      done()
    })

    it('should filter if actions do not match', function(done) {
      var tc = new TestClass()
      tc.route.action = 'action'
      tc.before('method', { only:['otherAction'] })
      tc.runBefore()
      assert(!tc.method.called)
      done()
    })

  })

})
