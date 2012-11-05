var args = process.argv
var workerPrefix = '--worker='
var configPrefix = '--config='
var App
var app
var config

// try to load the given script as a module
// exit the process if it won't load
function loadModule(script) {
  try {
    return require(script)
  }
  catch (ex) {
    console.error(ex)
    process.exit(1)
  }
}

// load the specified worker and config modules
args.forEach(function(arg) {
  if (arg.indexOf(workerPrefix) === 0) {
    var wpath = arg.substr(workerPrefix.length)
    App = loadModule(wpath)
    console.log('Starting worker:', wpath)
  }
  else if (arg.indexOf(configPrefix) === 0) {
    config = loadModule(arg.substr(configPrefix.length))
  }
})

if (!App) {
  console.error('NO WORKER FOUND', args)
}

// initialize the App
var app = new App(config)
module.exports = app
