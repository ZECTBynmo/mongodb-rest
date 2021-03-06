/* 
    server.js
    mongodb-rest

    Maintained by Ashley Davis 2014-07-02
    Created by Tom de Grunt on 2010-10-03.
    Copyright (c) 2010 Tom de Grunt.
		This file is part of mongodb-rest.
*/ 

var fs = require("fs");
var path = require("path");
var express = require('express');
var extend = require("extend");
		
var defaultConfig = { 
    "db": {
        'port': 27017,
        'host': "localhost"
    },
    'server': {
        'port': 3000,
        'address': "0.0.0.0"
    },
    "accessControl": {
        "allowOrigin": "*",
        "allowMethods": "GET,POST,PUT,DELETE,HEAD,OPTIONS",
        "allowCredentials": false
    },  
    "mongoOptions": {
        "serverOptions": {
        },
        "dbOptions": {
            "w": 1
        }
    },
    'flavor': "regular",
    'debug': true,
    'humanReadableOutput': true,
    collectionOutputType: "json"
};

var server;

module.exports = {

  //
  // Start the REST API server.
  //
  startServer: function (config, started) {
    var curDir = process.cwd();
    console.log("Current directory: " + curDir);

    if (!config) {
      var configFilePath = path.join(curDir, "config.json");
      if (fs.existsSync(configFilePath)) {
        console.log("Loading configuration from: " + configFilePath);
        config = JSON.parse(fs.readFileSync(configFilePath));        
      }
      else {
        console.log("Using default configuration.");
        console.log("Please put config.json in current directory to customize configuration.");
        config = defaultConfig;
      }
    }
    
    var app = express();
    require('express-csv');

    app.use(require('body-parser')());

    if (config.humanReadableOutput) {
      app.set('json spaces', 4);
    }

    if (config.accessControl) {
      var accesscontrol = require('./lib/accesscontrol')(config);
      app.use(accesscontrol.handle);
    } 

    app.get('/favicon.ico', function (req, res) {
      res.status(404);
    });

    require('./lib/rest')(app, config);

    console.log('Input Configuration:');
    console.log(config);  

    // Make a copy of the config so that defaults can be applied.
    config = extend(true, {}, config);
    if (!config.server) {
      config.server = {};
    }
    if (!config.server.address) {
      config.server.address = "0.0.0.0";
    }
    if (!config.server.port) {
      config.server.port = 3000;
    }
    if (!config.db) {
      config.db = {};
    }
    if (!config.db.port) {
      config.db.port = 27017;
    }
    if (!config.db.host) {
      config.db.host = "localhost";
    }

    console.log('Configuration with defaults applied:');
    console.log(config);  

    var host = config.server.address;
    var port = config.server.port;

    console.log('Starting mongodb-rest server: ' + host + ":" + port); 
    console.log('Connecting to db ' + config.db.host + ":" + config.db.port);

    server = app.listen(port, host, function () {
      console.log('Listening on: ' + host + ":" + port); 

      if (started) {
        started();
      }
    });
  },

  //
  // Stop the REST API server.
  //
  stopServer: function () {
    if (server) {
      console.log("Stopping mongodb-rest server.");
      server.close();
      server = null;
    }
  },

};

if (process.argv.length >= 2) { 
  if (process.argv[1].indexOf('server.js') != -1) {

    //
    // Auto start server when run as 'node server.js'
    //
    module.exports.startServer();
  }
}