
var assert = require('assert')
var sinon = require('sinon')
var Plugin = require('../plugin')

function createTestClass() {
  return function(){}
}

function createPlugin() {
  return Plugin.extend({
    initialize: sinon.spy(),
    run: sinon.spy(Plugin.prototype.run),
    method: sinon.spy(),
    _ignored: sinon.spy()
  })
}


describe('Plugin', function() {

  describe('makePluggable', function() {

    var TestClass

    beforeEach(function(done) {
      TestClass = createTestClass()
      done()
    })

    it('should exist', function(done) {
      assert(Plugin.makePluggable)
      done()
    })

    it('should add addPlugin class method', function(done) {
      Plugin.makePluggable(TestClass)
      assert(TestClass.addPlugin)
      done()
    })

    it('should add runPlugins instance method', function(done) {
      Plugin.makePluggable(TestClass)
      var inst = new TestClass()
      assert(inst.runPlugins)
      done()
    })

  })

  describe('addPlugin', function() {
    var inst, TestClass

    beforeEach(function(done){
      TestClass = createTestClass()
      Plugin.makePluggable(TestClass)
      done()
    })

    it('should instantiate plugin', function(done) {
      var plugin = createPlugin()
      TestClass.addPlugin(plugin)
      assert(plugin.prototype.initialize.calledOnce)
      done()
    })

  })

  describe('runPlugins', function() {
    var inst, plugin, TestClass

    beforeEach(function(done){
      TestClass = createTestClass()
      Plugin.makePluggable(TestClass)
      plugin = createPlugin()
      TestClass.addPlugin(plugin)

      inst = new TestClass()
      done()
    })

    it('should throw without callback argument', function(done) {
      assert.throws(inst.runPlugins)
      done()
    })

    it('should run the plugin', function(done) {
      inst.runPlugins(function(){
        assert(plugin.prototype.run.called)
        done()
      })
    })

    it('should add plugin methods to the pluggable class instance', function(done) {
      inst.runPlugins(function(){
        assert(inst.method)
        done()
      })
    })

    it('should not add run and initialize plugin methods', function(done) {
      inst.runPlugins(function(){
        assert(!inst.run)
        assert(!inst.initialize)
        done()
      })
    })

    it('should not add plugin methods prefixed with _', function(done) {
      inst.runPlugins(function(){
        assert(!inst._ignored)
        done()
      })
    })

  })

})
