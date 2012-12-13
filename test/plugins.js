
var assert = require('assert')
var sinon = require('sinon')
var extendable = require('extendable')
var Plugin = require('../plugin')

function createTestClass() {
  var TC = function(){}
  TC.extend = extendable
  return TC
}

function createPlugin() {
  return Plugin.extend({
    initialize: sinon.spy(),
    run: sinon.spy(Plugin.prototype.run),
    method: sinon.spy(),
    ignored: 'ignored property',
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
        assert.strictEqual(inst.method, plugin.prototype.method)
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

    it('should not add plugin non-function properties', function(done) {
      inst.runPlugins(function(){
        assert(!inst.ignored)
        done()
      })
    })

  })

  describe('stacking', function() {
    var inst, TestClass, SubClassOne, SubClassTwo,
        PluginZero, PluginOne, PluginTwo

    beforeEach(function(done){
      PluginZero = createPlugin()
      PluginZero.prototype.zero = sinon.spy()
      PluginOne = createPlugin()
      PluginOne.prototype.one = sinon.spy()
      PluginTwo = createPlugin()
      PluginTwo.prototype.two = sinon.spy()

      TestClass = createTestClass()
      Plugin.makePluggable(TestClass)
      TestClass.addPlugin(PluginZero)

      SubClassOne = TestClass.extend({})
      SubClassTwo = TestClass.extend({})

      PluginOne = createPlugin()
      PluginOne.prototype.one = sinon.spy()
      SubClassOne.addPlugin(PluginOne)

      PluginTwo = createPlugin()
      PluginTwo.prototype.two = sinon.spy()
      SubClassTwo.addPlugin(PluginTwo)

      done()
    })

    it('should add plugins to sub classes', function(done) {
      inst = new SubClassOne()
      assert(inst.zero)
      done()
    })

    it('should not add plugins to parent class', function(done) {
      inst = new TestClass()
      assert(!inst.one)
      assert(!inst.two)
      done()
    })

    it('should not add plugins to sibling sub classes', function(done) {
      inst = new SubClassOne()
      assert(inst.one)
      assert(!inst.two)
      done()
    })

  })

})
