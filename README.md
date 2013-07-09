nokomis
=======

## Installation

Use npm:

```
npm install nokomis
```

## Setting up an app

Apps should follow this structure:

```
Project Root
 ├ app
 │ ├ assets
 │ ├ controllers
 │ ├ plugins
 │ ├ templates
 │ ├ routes.js
 │ └ worker.js
 ├ config.js
 ├ package.json
 └ server.js
```



Sample config.js file:

```javascript
var conf = module.exports = {}
var env = conf.NODE_ENV = process.env.NODE_ENV || 'development'

conf.config = __filename
conf.appRoot = __dirname
conf.worker = __dirname + '/app/worker.js'

conf.server = {
  port: process.env.PORT || 3086,
  host: 'localhost',
  cluster: { size: require('os').cpus().length }
}

conf.templating = {
  templatePath: __dirname + '/app/templates'
}

conf.logging = {
  name: 'MySite',
  streams: [{
    level: 'trace',
    stream: process.stdout
  }]
}
```

Sample server.js file:

```javascript
var config = require('./config')
var App = require('nokomis').App
App.start(config)
```

Sample worker.js file

```javascript
var path = require('path')
var config = require('../config')
var routes = require('./routes')

var App = require('nokomis').App
var MySite = App.extend({
  initialize: function(options) { },
  setupRoutes: routes
})

module.exports = MySite
```

Sample routes.js file:

```javascript
module.exports = function(router) {

  // tell the router where to find controllers
  router.setControllerPath(__dirname + '/controllers')

  router.register({
    '/' : { controller: 'home', GET: 'index' },
    '/help' : { controller: 'home', action:'help' },

    '/books': { controller:'book', GET:'index', POST:'save' },
    '/books/:bookID' : { controller:'book', GET:'show', POST:'save', DELETE:'destroy' },

    // static routes go last
    '/*?' : { controller: 'static', action:'show' }

  })

}

```

Sample base controller - base.js:

```javascript
"use strict"
var nokomis = require('nokomis')
var Controller = nokomis.Controller
var Plugin = nokomis.Plugin
var plugins = require('nokomis-plugins')
var _ = require('underscore')

var config = require('../../config')

var BaseController = module.exports = Controller.extend({

  initialize: function(options) {},

})

Plugin.makePluggable(BaseController)

BaseController.addPlugin(plugins.ContentNegotiator)
BaseController.addPlugin(plugins.Cookies, config.cookies)
BaseController.addPlugin(plugins.Session, config.session)
BaseController.addPlugin(plugins.Errors, config.errorPage)
BaseController.addPlugin(plugins.Timeout, config.timeout)
BaseController.addPlugin(plugins.Respond)
BaseController.addPlugin(plugins.PostData)
BaseController.addPlugin(plugins.Handlebars, config.templating)

```

Sample controller - books.js:

```javascript
"use strict"
var Base = require('./base')

module.exports = Base.extend({

  templateOptions: {
    layout: 'splash'
  },

  initialize: function(options) { },

  index: function(done) {
    this.template = 'book/index'
    // todo: fetch book list from data source
    this.model.books = books
    done()
  },

  show: function(done) {
    this.template = 'book/detail'
    var bookID = this.route.params.bookID
    // todo: fetch book from data source
    this.model.book = book
    done()
  },

  save: function(done) {
    var bookID = this.route.params.bookID

    // get the book object from the posted data
    this.req.data.json(function(err, data) {
      // todo: save book data to data source
      this.model.book = savedBook
      done()
    })
  },

  destroy: function(done) {
    var bookID = this.route.params.bookID
    // todo: delete the book from the data source
    done()
  }

})

```
