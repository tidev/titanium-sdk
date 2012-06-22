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
var child_process = require('child_process');

module.exports = new function() {
	var self = this;
	var logFile = undefined;

	this.runCommand = function(command, logLevel, callback) {
		child_process.exec(command, function(error, stdout, stderr) {
			if ((logLevel > 1) && (stdout != "")) {
				self.log(stdout, 2);
			}

			if ((logLevel > 0) && (stderr != "")) {
				self.log(stderr, 0);
			}

			if (callback != null) {
				callback(error);
			}
		});
	};

	this.runProcess = function(filename, args, stdoutCallback, stderrCallback, exitCallback) {
		var newProcess = child_process.spawn(filename, args);

		if (stdoutCallback != null) {
			newProcess.stdout.on('data', function(data) {
				var stdoutString = data.toString();

				if ((stdoutCallback == 0) && (stdoutString != "")) {
					self.log(stdoutString, 2);

				} else {
					stdoutCallback(stdoutString);
				}
			});
		}

		if (stderrCallback != null) {
			newProcess.stderr.on('data', function(data) {
				var stderrString = data.toString();

				if ((stderrCallback == 0) && (stderrString != "")) {
					self.log(stderrString, 0);

				} else {
					stderrCallback(stderrString);
				}
			});
		}

		if (exitCallback != null) {
			newProcess.on('exit', function(code) {
				if ((exitCallback == 0) && (code != "")) {
					self.log(code, 0);

				} else {
					exitCallback(code);
				}
			});
		}

		return newProcess;
	};

	this.getArgument = function(args, name) {
		var value;

		for (var i in args) {
			if (args[i].indexOf(name) == 0) {
				var splitPos = args[i].indexOf("=");
				if (splitPos == -1) {
					continue;
				}

				value = args[i].substr(splitPos + 1, args[i].length - splitPos);
				break;
			}
		}

		return value;
	};

	this.rightStringTrim = function(targetString) {
		return targetString.replace(/\s+$/,"");
	};

	/*
	 * sets active log file based on driver command line arguments and deletes any old logs
	 * above the specified max number of logs if needed
	 */
	this.rotateLogs = function(callback) {
		// close the old log file if it has been opened
		self.closeLog();

		var date = new Date();
		logFile = fs.openSync(driverGlobal.logsDir + "/" + driverGlobal.platform.name + "/log_" + 
			(date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear() + "_" + 
			(date.getHours() + 1) + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + date.getMilliseconds(),
			'a+');

		var files = fs.readdirSync(driverGlobal.logsDir + "/" + driverGlobal.platform.name);
		if (files.length >= driverGlobal.maxLogs) {
			var oldestTime = 0;
			var oldestFileIndex;

			for (var i = 0; i < files.length; i++) {
				var stat = fs.statSync(driverGlobal.logsDir + "/" + driverGlobal.platform.name + "/" + files[i]);

				var modifiedTime = stat.mtime.getTime();
				if ((modifiedTime < oldestTime) || (oldestTime == 0)) {
					oldestTime = modifiedTime;
					oldestFileIndex = i;
					break;
				}
			}

			self.runCommand("rm -r " + driverGlobal.logsDir + "/" + driverGlobal.platform.name + "/" + files[oldestFileIndex], 0, function(error) {
				if (error != null) {
					self.log("error encountered when deleting oldest log file: " + error);

				} else {
					self.log("oldest log file deleted");
				}

				callback();
			});

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
			message = self.rightStringTrim(message);
		}

		if (level == undefined) {
			level = driverGlobal.defaultLogLevel;
		}

		if (driverGlobal.logLevel >= level) {
			console.log(message);
		}

		if (driverGlobal.logFilename == undefined) {
			return;
		}

		if (logFile == undefined) {
			// not inside a test run currently so only print to console
			return;
		}

		fs.writeSync(logFile, message + "\n");
	};
};
