var path = require('path')

module.exports.start = function(config) {

  var workerScript = './worker.js'

  // init logger
  var logger = require('bunyan').createLogger(config.log || { name:'Nokomis App Master'})
  console.error = logger.info.bind(logger)
  console.log = logger.info.bind(logger)

  // debug mode, don't run the cluster, just execute the worker
  var argv = process.argv.concat(process.execArgv || [])
  if (~argv.indexOf('--debug') || ~argv.indexOf('--debug-brk')) {
    process.argv.push('--worker=' + config.worker, '--config=' + config.config)
    return require(workerScript)
  }

  // configure the cluster
  var clusterMaster = require("cluster-master")
  var clusterConfig = config.server.cluster || { size:1 }
  clusterConfig.exec = path.resolve(__dirname, './worker.js')
  clusterConfig.args = [
    '--worker=' + config.worker,
    '--config=' + config.config
  ]

  // init server cluster
  clusterMaster(clusterConfig)

  /**
   * Remove cluster-master's SIGHUP (hangup) process
   * event and add a custom event that reloads the
   * config, resizes the cluster and restarts the
   * cluster gracefully.
   */

  process.removeListener('SIGHUP', clusterMaster.restart)
  process.on('SIGHUP', function(){
    logger.warn('Attempting app cluster restart')
    // attempt to reload the config
    var sb = config.cluster.size
    delete require.cache[require.resolve('./config.js')]
    try {
      config = require('./config.js')
    } catch (er) {
      log.error('config error', er)
      return
    }

    if (config.cluster && config.cluster.size !== sb) {
      // resize the cluster based on the new config
      logger.warn('Cluster resizing from ' + sb + ' to ' + config.cluster.size + ' workers')
      clusterMaster.resize(config.cluster.size, function() {
        // restart gracefully
        logger.warn('Cluster resize complete')
        clusterMaster.restart(restartComplete)
      })
    } else {
      // restart gracefully
      clusterMaster.restart(restartComplete)
    }
  })

  function restartComplete() {
    logger.warn('Cluster restart completed successfully')
  }

}

module.exports.stop = function(hard) {
  if (hard === true)
    return clusterMaster.quitHard()
  clusterMaster.quit()
}