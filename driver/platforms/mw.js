/*
 * Purpose: contains specific logic for running driver commands on Mobile Web
 *
 * Description: contains Mobile Web specific wrapper functions around common driver commands
 */

var path = require("path");
var http = require('http');
var fs = require('fs');

var common = require(driverGlobal.driverDir + "/common");
var util = require(driverGlobal.driverDir + "/util");

module.exports = new function() {
	var self = this;
	var commandFinishedCallback;
	var testPassFinishedCallback;
	var server;
	var serverRunning = false;
	var serverListening = true;

	this.name = "mw";

	this.init = function(commandCallback, testPassCallback) {
		commandFinishedCallback = commandCallback;
		testPassFinishedCallback = testPassCallback;
	}

	this.processCommand = function(command) {
		var commandElements = command.split(" ");

		if(commandElements[0] == "create") {
			createHarness(commandFinishedCallback, commandFinishedCallback);

		} else if(commandElements[0] == "delete") {
			deleteHarness(commandFinishedCallback);

		} else if(commandElements[0] == "build") {
			buildHarness(commandFinishedCallback, commandFinishedCallback);

		} else if(commandElements[0] == "start") {
			self.startTestPass(commandElements);

		} else {
			util.log("invalid command\n"
				+ "Commands:\n"
				+ "    create - create harness project\n"
				+ "    delete - delete harness project\n"
				+ "    build - build harness files to be served\n"
				+ "    start - starts test run which includes starting over with clean harness project\n"
				+ "        Arguments:\n"
				+ "            --config=<config ID> - runs the specified configuration only\n"
				+ "            --suite=<suite name> - runs the specified suite only\n"
				+ "            --test=<test name> - runs the specified test only (--suite must be specified)\n"
			);

			commandFinishedCallback();
		}
	}

	var createHarness = function(successCallback, errorCallback) {
		common.createHarness(
			"mw",
			driverGlobal.tiSdkDir + "/project.py harness com.appcelerator.harness " + driverGlobal.harnessDir + "/mw mobileweb " + driverGlobal.tiSdkDir,
			successCallback,
			errorCallback
			);
	}

	var deleteHarness = function(callback) {
		common.deleteHarness("mw", callback);
	}

	var buildHarness = function(successCallback, errorCallback) {
		var buildCallback = function() {
			var args = [driverGlobal.harnessDir + "/mw/harness", "development"];
			util.runProcess(driverGlobal.tiSdkDir + "/mobileweb/builder.py", args, 0, 0, function(code) {
				if(code != 0) {
					util.log("error encountered when building harness: " + code);
					errorCallback();

				} else {
					util.log("harness built");
					successCallback();
				}
			});
		}

		if (path.existsSync(driverGlobal.harnessDir + "/mw/harness/tiapp.xml")) {
			buildCallback();

		} else {
			util.log("harness does not exist, creating");
			createHarness(buildCallback, errorCallback);
		}
	}

	this.startTestPass = function(commandElements) {
		var deleteCallback = function() {
			deleteHarness(buildCallback);
		}

		var buildCallback = function() {
			buildHarness(serverCallback, commandFinishedCallback);
		}

		var serverCallback = function() {
			startServer(runCallback, commandFinishedCallback);
		}

		var runCallback = function() {
			runHarness();
		}

		common.startTestPass(commandElements, deleteCallback);
	}

	var startServer = function(successCallback, errorCallback) {
		server = http.createServer(function (request, response) {
			var prefix = driverGlobal.harnessDir + "/mw/harness/build/mobileweb"
			var filePath = prefix + request.url;
			if (filePath == prefix + '/') {
				filePath = prefix + '/index.html';
			}

			var extname = path.extname(filePath);
			var contentType = 'text/html';
			switch (extname) {
				case '.js':
					contentType = 'text/javascript';
					break;

				case '.css':
					contentType = 'text/css';
					break;
			}

			if(extname != ".anvil") {
				path.exists(filePath, function(exists) {
					if(exists) {
						fs.readFile(filePath, function(error, content) {
							if (error) {
								response.writeHead(500);
								response.end();

							} else {
								response.writeHead(200, {
									"Content-Type": contentType,
									"Cache-Control": "max-age=0, must-revalidate"
								});
								response.end(content, 'utf-8');
							}
						});

					} else {
						response.writeHead(404);
						response.end();
					}
				});

			} else {
		        var postData = '';

    		    request.on('data', function (data) {
    		        postData += data;
				});
    		    request.on('end', function () {
					var responseData = common.processHarnessMessage(postData);

					response.writeHead(200, {
						"Content-Type": contentType,
						"Cache-Control": "max-age=0, must-revalidate"
					});
					response.end(responseData, 'utf-8');
        		});
			}
		});

		server.on('error', function (e) {
			if ((e.code == 'EADDRINUSE') && (serverRunning == false)) {
				util.log('Address in use, retrying...');
				setTimeout(function() {
					if(serverListening == true) {
						server.close();
					}
					serverListening = true;
					server.listen(driverGlobal.httpPort);
				}, 2000);

			} else {
				errorCallback();
			}
		});

		server.on('listening', function (e) {
			serverRunning = true;
			util.log("Server running at " + driverGlobal.httpHost + ":" + driverGlobal.httpPort);
			successCallback();
		});

		serverListening = true;
		server.listen(driverGlobal.httpPort);
	}

	var runHarness = function(errorCallback) {
		util.runCommand("adb shell am start -a android.intent.action.VIEW -n com.android.browser/.BrowserActivity -d " + driverGlobal.httpHost + ":" + driverGlobal.httpPort + "/index.html", 2, function(error) {
			if(error != null) {
				util.log("error encountered when running harness: " + error);
				if(errorCallback) {
					errorCallback();
				}
			}
		});
	}

	// handles restarting the test pass (usually when an error is encountered)
	this.resumeTestPass = function() {
		var runCallback = function() {
			runHarness(commandFinishedCallback);
		}

		stopHarness();
		startServer(runCallback, commandFinishedCallback);
	}

	// called when a config is finished running
	this.finishTestPass = function() {
		stopHarness();
		common.finishTestPass(testPassFinishedCallback);
	}

	var stopHarness = function() {
		if(serverRunning) {
			serverRunning = false;
			serverListening = false;
			server.close();
		}
	}
}
