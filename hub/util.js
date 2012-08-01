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
		// close the old log file if it has been opened
		if (logFile) {
			fs.closeSync(logFile);

			/*
			there doesn't seem to be an exposed API for checking if the file is open so just set 
			to undefined so we have something to test against
			*/
			logFile = undefined;
		}

		var date = new Date();
		hubGlobal.currentLogDir = hubGlobal.logsDir + "/" + hubGlobal.platform.name + "/" + 
			(date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear() + "_" + 
			(date.getHours() + 1) + "-" + date.getMinutes() + "-" + date.getSeconds() + "-" + date.getMilliseconds();

		/*
		a log directory needs to be created for the test run since you may end up with both a log 
		file and a JSON results file
		*/
		try {
			fs.mkdirSync(hubGlobal.currentLogDir);

		} catch(e) {
			console.log("exception <" + e + "> occurred when creating log directory <" + hubGlobal.currentLogDir + ">");
		}

		logFile = fs.openSync(hubGlobal.currentLogDir + "/log.txt", 'a+');

		var dirs = fs.readdirSync(hubGlobal.logsDir + "/" + hubGlobal.platform.name);
		if (dirs.length >= hubGlobal.config.maxLogs) {
			var oldestTime = 0;
			var oldestDirIndex;
			var dirTimestamps = [];
			var dirsMap = {};

			var numDirs = dirs.length;
			for (var i = 0; i < numDirs; i++) {
				var stat = fs.statSync(hubGlobal.logsDir + "/" + hubGlobal.platform.name + "/" + dirs[i]);
				var modifiedTime = stat.mtime.getTime();

				dirTimestamps.push(modifiedTime);
				dirsMap[modifiedTime] = dirs[i];
			}

			dirTimestamps.sort(function(a,b) {
				return b-a
			});

			function deleteLog(oldestDirIndex) {
				if (oldestDirIndex < hubGlobal.config.maxLogs) {
					callback();

				} else {
					var oldestDir = dirsMap[dirTimestamps[oldestDirIndex]];
					self.runCommand("rm -r " + hubGlobal.logsDir + "/" + hubGlobal.platform.name + "/" + oldestDir, self.logNone, function(error) {
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

	this.log = function(message) {
		console.log(message);

		if (logFile === undefined) {
			// not inside a test run currently so only print to console
			return;
		}

		fs.writeSync(logFile, message + "\n");
	};

	this.getTabs = function(numTabs) {
		var tabs = "";

		for (var i = 0; i < numTabs; i++) {
			tabs += "    ";
		}

		return tabs;
	};
};
