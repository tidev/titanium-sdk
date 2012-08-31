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
	logFilePath = "",
	logFile = undefined,
	logRotating = false,
	pendingLogEntries = [];

	this.runCommand = function(command, callback) {
		child_process.exec(command, function(error, stdout, stderr) {
			self.log(stdout);
			self.log(stderr);

			if (callback !== null) {
				callback(error, stdout, stderr);
			}
		});
	};

	this.runProcess = function(filename, args, stdoutCallback, stderrCallback, exitCallback) {
		var newProcess = child_process.spawn(filename, args);

		newProcess.stdout.on('data', function(data) {
			var stdoutString = data.toString();

			self.log(stdoutString);

			if (stdoutCallback !== null) {
				stdoutCallback(stdoutString);
			}
		});

		newProcess.stderr.on('data', function(data) {
			var stderrString = data.toString();

			self.log(stderrString);

			if (stderrCallback !== null) {
				stderrCallback(stderrString);
			}
		});

		newProcess.on('exit', function(code) {
			self.log(code);

			if (exitCallback !== null) {
				exitCallback(code);
			}
		});

		return newProcess;
	};

	this.trimStringRight = function(targetString) {
		return targetString.replace(/\s+$/,"");
	};

	/*
	 * sets active log file based on driver command line arguments and deletes any old logs
	 * above the specified max number of logs if needed
	 */
	this.openLog = function(callback) {
		var date = new Date(),
		logFilename = (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear() + 
			"_" + (date.getHours() + 1) + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + 
			date.getMilliseconds(),
		logs,
		oldestTime = 0,
		logTimestamps = [],
		logsMap = {},
		numLogs,
		stat;

		// close the old log file if it has been opened
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

		logFilePath = path.join(hubGlobal.logsDir, logFilename);
		logFile = fs.openSync(logFilePath, 'a+');

		logRotating = false;

		logs = fs.readdirSync(hubGlobal.logsDir);
		if (logs.length >= hubGlobal.config.maxLogs) {
			numLogs = logs.length;
			for (var i = 0; i < numLogs; i++) {
				stat = fs.statSync(path.join(hubGlobal.logsDir, logs[i])),
				modifiedTime = stat.mtime.getTime();

				logTimestamps.push(modifiedTime);
				logsMap[modifiedTime] = logs[i];
			}

			logTimestamps.sort(function(a,b) {
				return b-a;
			});

			function deleteLog(oldestLogIndex) {
				var oldestLog;

				if (oldestLogIndex < hubGlobal.config.maxLogs) {
					callback();

				} else {
					oldestLog = logsMap[logTimestamps[oldestLogIndex]];
					self.runCommand("rm -r " + path.join(hubGlobal.logsDir, oldestLog), function(error) {
						if (error !== null) {
							self.log("error <" + error + "> encountered when deleting log <" + oldestLog + ">");

						} else {
							self.log("deleted log: " + oldestLog);
						}

						deleteLog(--oldestLogIndex);
					});
				}
			}

			deleteLog(numLogs - 1);

		} else {
			callback();
		}
	};

	this.log = function(message) {
		var stat;

		if (logRotating === true) {
			numPendingLogEntries.push(message);

		} else {
			stat = fs.statSync(logFilePath);
			if (stat.size > hubGlobal.config.maxLogSize) {
				logRotating = true;

				self.openLog(function() {
					while (pendingLogEntries.length > 0) {
						self.log(numPendingLogEntries[0]);
						numPendingLogEntries.shift();
					}
				});

			} else {
				fs.writeSync(logFile, message + "\n");
			}
		}

		console.log(message);
	};

	this.getTabs = function(numTabs) {
		var tabs = "";

		for (var i = 0; i < numTabs; i++) {
			tabs += "    ";
		}

		return tabs;
	};
};
