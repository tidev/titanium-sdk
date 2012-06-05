var net = require("net");
var path = require("path");
var http = require('http');
var fs = require('fs');
var querystring = require('querystring');

var driverGlobal = global.driverGlobal;
var util = require(driverGlobal.driverDir + "/util");
var common = require(driverGlobal.driverDir + "/common");

module.exports = new function() {
	var createHarness = function(successCallback, errorCallback) {
		var createCallback = function() {
			util.runCommand(driverGlobal.tiSdkDir + "/project.py " + driverGlobal.harnessName + " " + driverGlobal.harnessId + " " + driverGlobal.harnessDir + "/mw" + " mobileweb " + driverGlobal.tiSdkDir, 2, function(error) {
				if(error != null) {
					console.log("error encountered when created harness: " + error);
					if(errorCallback) {
						errorCallback();
					}

				} else {
					console.log("harness created");

					util.runCommand("cp -r " + driverGlobal.driverDir + "/harnessTemplate/* " + driverGlobal.harnessDir + "/mw/" + driverGlobal.harnessName, 2, function(error) {
						if(error != null) {
							console.log("unable to update resources for harness: " + error);
							if(errorCallback) {
								errorCallback();
							}

						} else {
							console.log("resources updated for harness");
							if(successCallback) {
								successCallback();
							}
						}
					});
				}
			});
		}

		if(path.existsSync(driverGlobal.harnessDir + "/mw/" + driverGlobal.harnessName + "/tiapp.xml")) {
			deleteHarness(createCallback, errorCallback);

		} else {
			createCallback();
		}
	}

	var deleteHarness = function(successCallback, errorCallback) {
		util.runCommand("rm -r " + driverGlobal.harnessDir + "/mw/" + driverGlobal.harnessName, 0, function(error) {
			if(error != null) {
				console.log("error encountered when deleting harness: " + error);
				if(errorCallback) {
					errorCallback();
				}

			} else {
				console.log("harness deleted");
				if(successCallback) {
					successCallback();
				}
			}
		});
	}

	var buildHarness = function(successCallback, errorCallback) {
		var buildCallback = function() {
			var args = [driverGlobal.harnessDir + "/mw/" + driverGlobal.harnessName, "development"];
			util.runProcess(driverGlobal.tiSdkDir + "/mobileweb/builder.py", args, 0, 0, function(code) {
				if(code != 0) {
					console.log("error encountered when building harness: " + code);
					errorCallback();

				} else {
					console.log("harness built");
					successCallback();
				}
			});
		}

		if (path.existsSync(driverGlobal.harnessDir + "/mw/" + driverGlobal.harnessName + "/tiapp.xml")) {
			buildCallback();

		} else {
			console.log("harness does not exist, creating");
			createHarness(buildCallback, errorCallback);
		}
	}

	var startTests = function(errorCallback) {
		var buildCallback = function() {
			buildHarness(serverCallback, errorCallback);
		}

		var serverCallback = function() {
			startServer(runCallback, errorCallback);
		}

		var runCallback = function() {
			runHarness(errorCallback);
		}

		deleteHarness(buildCallback, buildCallback);
	}

	var startServer = function(successCallback, errorCallback) {
		http.createServer(function (request, response) {
			var prefix = "/harness/mw/harness/build/mobileweb";
			var filePath = '.' + prefix + request.url;
			if (filePath == '.' + prefix + '/') {
				filePath = '.' + prefix + '/index.html';
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
								response.writeHead(200, { 'Content-Type': contentType });
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

					response.writeHead(200, { 'Content-Type': contentType });
					response.end(responseData, 'utf-8');
        		});
			}
		}).listen(driverGlobal.httpPort);
 
		console.log("Server running at " + driverGlobal.httpHost + ":" + driverGlobal.httpPort);
		successCallback();
	}

	var runHarness = function(errorCallback) {
		util.runCommand("adb shell am start -a android.intent.action.VIEW -n com.android.browser/.BrowserActivity -d " + driverGlobal.httpHost + ":" + driverGlobal.httpPort + "/index.html", 0, function(error) {
			if(error != null) {
				console.log("error encountered when running harness: " + error);
				if(errorCallback) {
					errorCallback();
				}
			}
		});
	}

	this.processCommand = function(command, callback) {
		var commandElements = command.split(" ");

		if(commandElements[0] == "create") {
			createHarness(callback, callback);

		} else if(commandElements[0] == "delete") {
			deleteHarness(callback, callback);

		} else if(commandElements[0] == "build") {
			buildHarness(callback, callback);

		} else if(commandElements[0] == "start") {
			startTests(null, callback);

		} else {
			console.log("invalid command\n"
				+ "Commands:\n"
				+ "\tcreate - create harness project\n"
				+ "\tdelete - delete harness project\n"
				+ "\tbuild - build harness files to be served\n"
				+ "\tstart - starts test run which includes starting over with clean harness project\n"
			);

			callback();
		}
	}

	this.reset = function() {
		driverGlobal.localMode.resumeReadingCommands();
	}
}
