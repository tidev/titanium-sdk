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

var fs = require("fs");
var child_process = require("child_process");
var path = require("path");

module.exports = new function() {
	var self = this;
	var logFile = undefined;

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

		var date = new Date();
		logFile = fs.openSync(driverGlobal.logsDir + "/" + driverGlobal.platform.name + "/log_" + 
			(date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear() + "_" + 
			(date.getHours() + 1) + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + date.getMilliseconds(),
			'a+');

		var files = fs.readdirSync(driverGlobal.logsDir + "/" + driverGlobal.platform.name);
		if (files.length >= driverGlobal.config.maxLogs) {
			var oldestTime = 0;
			var oldestFileIndex;
			var logTimestamps = [];
			var logsMap = {};

			var numFiles = files.length;
			for (var i = 0; i < numFiles; i++) {
				var stat = fs.statSync(driverGlobal.logsDir + "/" + driverGlobal.platform.name + "/" + files[i]);
				var modifiedTime = stat.mtime.getTime();

				logTimestamps.push(modifiedTime);
				logsMap[modifiedTime] = files[i];
			}

			logTimestamps.sort(function(a,b) {
				return a-b
			});

			function deleteLog(oldestLogIndex) {
				if (oldestLogIndex < driverGlobal.config.maxLogs) {
					callback();

				} else {
					var oldestLogFilename = logsMap[logTimestamps[(oldestLogIndex - 1)]];
					self.runCommand("rm -r " + driverGlobal.logsDir + "/" + driverGlobal.platform.name + "/" + oldestLogFilename, self.logNone, function(error) {
						if (error !== null) {
							self.log("error <" + error + "> encountered when deleting log file <" + oldestLogFilename + ">");

						} else {
							self.log("deleted log file: " + oldestLogFilename);
						}

						deleteLog(--oldestLogIndex);
					});
				}
			}

			deleteLog(numFiles - 1);

		} else {
			callback();
		}
	};

	this.closeLog = function() {
		if (logFile) {
			fs.closeSync(logFile);

			/*
			there doesn't seem to be an exposed API for checking if the file is open so just set 
			to undefined so we have something to test against
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
};
