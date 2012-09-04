/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: general utility file for common tasks that are not specific to running tests
 *
 * Description: provides general utility functions for streamlining invoking commands, string
 * manipulation, log management, etc
 */

var fs = require("fs"),
child_process = require("child_process"),
path = require("path");

module.exports = new function() {
	var self = this,
	logFile = undefined;

	this.checkConfigItem = function(configItemName, configItemValue, expectedType) {
		function printFailureAndExit(errorMessage) {
			console.log(errorMessage);
			process.exit(1);
		}

		var configItemType = (typeof configItemValue);
		if (configItemType === "undefined") {
			printFailureAndExit(configItemName + " property in the config module cannot be undefined");

		} else if (configItemType !== expectedType) {
			printFailureAndExit(configItemName + " property in the config module should be <" + expectedType +
				"> but was <" + configItemType + ">");
		}
	};

	/*
	these are stand alone from the driver wide log levels since the arguments to runCommand do 
	not change based on the --log-level argument
	*/
	this.logNone = 0;
	this.logStderr = 1;
	this.logStdout = 2;

	this.runCommand = function(command, logLevel, callback) {
		child_process.exec(command, function(error, stdout, stderr) {
			if ((logLevel > self.logStderr) && (stdout !== "")) {
				self.log(stdout, 2);
			}

			if ((logLevel > self.logNone) && (stderr !== "")) {
				self.log(stderr, 0);
			}

			if (callback !== null) {
				callback(error, stdout, stderr);
			}
		});
	};

	this.runProcess = function(filename, args, stdoutCallback, stderrCallback, exitCallback) {
		var newProcess = child_process.spawn(filename, args);

		if (stdoutCallback !== null) {
			newProcess.stdout.on('data', function(data) {
				var stdoutString = data.toString();

				if ((stdoutCallback === 0) && (stdoutString !== "")) {
					self.log(stdoutString, 2);

				} else {
					stdoutCallback(stdoutString);
				}
			});
		}

		if (stderrCallback !== null) {
			newProcess.stderr.on('data', function(data) {
				var stderrString = data.toString();

				if ((stderrCallback === 0) && (stderrString !== "")) {
					self.log(stderrString, 0);

				} else {
					stderrCallback(stderrString);
				}
			});
		}

		if (exitCallback !== null) {
			newProcess.on('exit', function(code) {
				if ((exitCallback === 0) && (code !== "")) {
					self.log(code, 0);

				} else {
					exitCallback(code);
				}
			});
		}

		return newProcess;
	};

	this.getArgument = function(args, requestedArgName) {
		var value;

		for (var i in args) {
			var splitPos = args[i].indexOf("=");
			if (splitPos === -1) {
				continue;
			}

			var argName = args[i].substr(0, splitPos);
			if (argName === requestedArgName) {
				value = args[i].substr(splitPos + 1, args[i].length - splitPos);
				break;
			}
		}

		return value;
	};

	this.trimStringRight = function(targetString) {
		return targetString.replace(/\s+$/,"");
	};

	/*
	 * sets active log file based on driver command line arguments and deletes any old logs
	 * above the specified max number of logs if needed
	 */
	this.openLog = function(callback) {
		// close the old log file if it has been opened
		self.closeLog();

		var date = new Date(),
		logFilename = (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear() + 
			"_" + (date.getHours() + 1) + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + 
			date.getMilliseconds();

		driverGlobal.currentLogDir = path.join(driverGlobal.logsDir, driverGlobal.platform.name, logFilename);

		/*
		a log directory needs to be created for the test run since you may end up with both a log 
		file and a JSON results file
		*/
		try {
			fs.mkdirSync(driverGlobal.currentLogDir);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating log directory <" + driverGlobal.currentLogDir + ">");
		}

		logFile = fs.openSync(path.join(driverGlobal.currentLogDir, "log.txt"), 'a+');

		var dirs = fs.readdirSync(path.join(driverGlobal.logsDir, driverGlobal.platform.name));
		if (dirs.length >= driverGlobal.config.maxLogs) {
			var oldestTime = 0,
			oldestDirIndex,
			dirTimestamps = [],
			dirsMap = {};

			var numDirs = dirs.length;
			for (var i = 0; i < numDirs; i++) {
				var stat = fs.statSync(path.join(driverGlobal.logsDir, driverGlobal.platform.name, dirs[i])),
				modifiedTime = stat.mtime.getTime();

				dirTimestamps.push(modifiedTime);
				dirsMap[modifiedTime] = dirs[i];
			}

			dirTimestamps.sort(function(a,b) {
				return b-a;
			});

			function deleteLog(oldestDirIndex) {
				if (oldestDirIndex < driverGlobal.config.maxLogs) {
					callback();

				} else {
					var oldestDir = dirsMap[dirTimestamps[oldestDirIndex]];
					self.runCommand("rm -r " + path.join(driverGlobal.logsDir, driverGlobal.platform.name, oldestDir), self.logNone, function(error) {
						if (error !== null) {
							self.log("error <" + error + "> encountered when deleting log directory <" + oldestDir + ">");

						} else {
							self.log("deleted log directory: " + oldestDir);
						}

						deleteLog(--oldestDirIndex);
					});
				}
			}

			deleteLog(numDirs - 1);

		} else {
			callback();
		}
	};

	this.closeLog = function() {
		if (logFile) {
			fs.closeSync(logFile);

			/*
			Wrapping a call to fstatSync in a try/catch can be used as a means of checking if the 
			provided file descriptor is valid (open) since it will throw an exception if the file
			is not open.  However, I see this as kind of a hack and prefer the clarity of just using
			undefined on the file handle as a flag since the behavior is explicit and the behavior
			is faster than the exception mechanism.
			*/
			logFile = undefined;
		}
	};

	this.log = function(message, level, noTrim) {
		// because sometimes we need to print the message without modification
		if (noTrim !== true) {
			message = self.trimStringRight(message);
		}

		if (level === undefined) {
			level = driverGlobal.config.defaultLogLevel;
		}

		if (driverGlobal.logLevel >= level) {
			console.log(message);
		}

		if (logFile === undefined) {
			// not inside a test run currently so only print to console
			return;
		}

		fs.writeSync(logFile, message + "\n");
	};

	this.getTabs = function(numTabs) {
		var tabs = "";

		for (var i = 0; i < numTabs; i++) {
			if ((typeof driverGlobal.config) !== "undefined") {
				tabs += driverGlobal.config.tabString;

			} else {
				tabs += "    ";
			}
		}

		return tabs;
	};

	this.setCurrentTiSdk = function() {
		var latestTime = 0,
		latestDir;

		var files = fs.readdirSync(driverGlobal.config.tiSdkDirs);
		for (var i = 0; i < files.length; i++) {
			var stat = fs.statSync(path.join(driverGlobal.config.tiSdkDirs, files[i])),
			modifiedTime = stat.mtime.getTime();

			if (modifiedTime > latestTime) {
				latestTime = modifiedTime;
				latestDir = files[i];
			}
		}

		if (typeof latestDir === "undefined") {
			console.log("unable to find a valid SDK");
			process.exit(1);

		} else {
			console.log("using Titanium SDK version <" + latestDir + ">");
			driverGlobal.config.currentTiSdkDir = path.join(driverGlobal.config.tiSdkDirs, latestDir);
		}
	};
};
