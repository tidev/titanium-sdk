/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: 
 *
 * Description: 
 */

var fs = require("fs");
var mysql = require("mysql");

var util = require(__dirname + "/util");

module.exports = new function() {
	var self = this;
	var activeRuns = {};
	var dbConnection;
	var driverCommand = "start --config=default --suite=codec";
	//var driverCommand = "start";

	this.server;

	this.init = function() {
		dbConnection = mysql.createConnection({
			host: "localhost",
			user: "root",
			database: "anvil_hub"
		});
		dbConnection.connect();
	};

	this.processCiMessage = function(ciConnection, message) {
		try {
			message = JSON.parse(message);

		} catch (e) {
			util.log("error occured when trying to parse message from CI server");
			ciConnection.destroy();
			return;
		}

		if((typeof message.gitHash) === "undefined") {
			console.log("received CI JSON object <" + JSON.stringify(message) + "> does not " +
				"contain a \"gitHash\" property, ignoring");

			return;
		}

		if((typeof message.branch) === "undefined") {
			console.log("received CI JSON object <" + JSON.stringify(message) + "> does not " +
				"contain a \"branch\" property, ignoring");

			return;
		}

		if((typeof message.buildTime) === "undefined") {
			console.log("received CI JSON object <" + JSON.stringify(message) + "> does not " +
				"contain a \"buildTime\" property, ignoring");

			return;
		}

		var queryArgs = {
			git_hash: message.gitHash,
			branch: message.branch,
			timestamp: message.buildTime
		};
		dbConnection.query('INSERT INTO runs SET ?', queryArgs, function(error, rows, fields) {
			if (error) {
				throw error;
			}

			ciConnection.write("received", function() {
				console.log("\"received\" message sent back to CI server");
				ciConnection.destroy();
			});

			/*
			loop through drivers we are currently connected to and tell them to start a test
			run if they are idle
			*/
			for (var driverId in activeRuns) {
				if (!(activeRuns.hasOwnProperty(driverId))) {
					continue;
				}

				if (activeRuns[driverId].idle === true) {
					self.getDriverRun(driverId);
				}
			}
		});
	};

	this.processDriverResults = function(driverId, results, callback) {
		// create zip
		var resultsFile = fs.openSync(hubGlobal.workingDir + "/results.tgz", 'w');
		fs.writeSync(resultsFile, results, 0, results.length, null);
		fs.closeSync(resultsFile);

		// extract the results set
		var command = "tar -xvf " + hubGlobal.workingDir + "/results.tgz -C " + hubGlobal.workingDir;
		util.runCommand(command, function(error, stdout, stderr) {
			if (error !== null) {
				console.log("error <" + error + "> occurred when trying to extract results to <" + 
					hubGlobal.workingDir + ">");

				return;
			}

			console.log("storing results...");
			var numPassed = 0;
			var numFailed = 0;
			var branch;

			function insertDriverRun(results, callback) {
				var queryArgs = {
					run_id: activeRuns[driverId].runId,
					driver_id: driverId,
					passed_tests: 0,
					failed_tests: 0
				};
				dbConnection.query('INSERT INTO driver_runs SET ?', queryArgs, function(error, rows, fields) {
					if (error) {
						throw error;
					}

					insertConfigSet(results.results, 0, rows.insertId, callback);
				});
			}

			function insertConfigSet(configSets, configSetIndex, driverRunId, callback) {
				if ((typeof configSets[configSetIndex]) !== "undefined") {
					var queryArgs = {
						branch: branch,
						driver_run_id: driverRunId,
						name: configSets[configSetIndex].setName
					};
					dbConnection.query('INSERT INTO config_sets SET ?', queryArgs, function(error, rows, fields) {
						if (error) {
							throw error;
						}

						insertConfig(configSets[configSetIndex].setConfigs, 0, configSets[configSetIndex].setName, rows.insertId, function() {
							insertConfigSet(configSets, configSetIndex + 1, driverRunId, callback);
						});
					});

				} else {
					callback();
				}
			}

			function insertConfig(configs, configIndex, configSetName, configSetId, callback) {
				var config = configs[configIndex];
				if ((typeof config) !== "undefined") {
					var queryArgs = {
						branch: branch,
						config_set_name: configSetName,
						config_set_id: configSetId,
						name: config.configName
					};
					dbConnection.query('INSERT INTO configs SET ?', queryArgs, function(error, rows, fields) {
						if (error) {
							throw error;
						}

						insertSuite(config.configSuites, 0, config.configName, rows.insertId, function() {
							insertConfig(configs, configIndex + 1, configSetName, configSetId, callback);
						});
					});

				} else {
					callback();
				}
			}

			function insertSuite(suites, suiteIndex, configName, configId, callback) {
				var suite = suites[suiteIndex];
				if ((typeof suite) !== "undefined") {
					var queryArgs = {
						branch: branch,
						config_name: configName,
						config_id: configId,
						name: suite.suiteName
					};
					dbConnection.query('INSERT INTO suites SET ?', queryArgs, function(error, rows, fields) {
						if (error) {
							throw error;
						}

						insertTest(suite.suiteTests, 0, suite.suiteName, rows.insertId, function() {
							insertSuite(suites, suiteIndex + 1, configName, configId, callback);
						});
					});

				} else {
					callback();
				}
			}

			function insertTest(tests, testIndex, suiteName, suiteId, callback) {
				var test = tests[testIndex];
				if ((typeof test) !== "undefined") {
					if (test.testResult.result === "success") {
						numPassed++;

					} else {
						numFailed++;
					}

					var queryArgs = {
						branch: branch,
						run_id: activeRuns[driverId].runId,
						driver_id: driverId,
						suite_name: suiteName,
						suite_id: suiteId,
						name: test.testName,
						duration: test.testResult.duration,
						result: test.testResult.result,
					};

					// description is a optional field
					if ((typeof test.testResult.description) !== "undefined") {
						queryArgs.description = test.testResult.description;

					} else {
						queryArgs.description = "";
					}

					dbConnection.query('INSERT INTO results SET ?', queryArgs, function(error, rows, fields) {
						if (error) {
							throw error;
						}

						insertTest(tests, testIndex + 1, suiteName, suiteId, callback);
					});

				} else {
					callback();
				}
			}

			dbConnection.query("SELECT * FROM runs WHERE id = " + activeRuns[driverId].runId, function(error, rows, fields) {
				// store the branch ID for later use
				branch = rows[0].branch;

				var results = fs.readFileSync(hubGlobal.workingDir + "/json_results", "utf-8");
				results = JSON.parse(results);

				insertDriverRun(results, function() {
					dbConnection.query("UPDATE driver_runs SET passed_tests=" + numPassed +
						", failed_tests=" + numFailed + " WHERE driver_id=\"" + driverId + "\"" +
						" AND run_id=" + activeRuns[driverId].runId, function(error, rows, fields) {

						if (error) {
							throw error;
						}

						/*
						remove the run and close the driver dbConnection now that the results are 
						processed.  Failing to close the dbConnection will prevent the driver from 
						starting on a new run
						*/
						delete activeRuns[driverId];
						callback();
					});
				});
			});
		});
	};

	this.getDriverRun = function(driverId) {
		var query = "SELECT * FROM runs WHERE NOT EXISTS (SELECT * FROM driver_runs " + 
			"WHERE run_id = runs.id AND driver_id = \"" + driverId + "\")";

		dbConnection.query(query, function(error, rows, fields) {
			if (error) {
				throw error;
			}

			var runId = null;
			var isIdle = true;

			/*
			here we are basically checking to see if there are any runs that the driver has not
			processed yet.  If so we tell the driver to kick off the run, otherwise the driver 
			will wait until a new run comes in
			*/
			if (rows.length > 0) {
				runId = rows[0].id;
				isIdle = false;

				self.server.sendMessageToDriver(driverId, {
					gitHash: rows[0].git_hash,
					command: driverCommand
				});
			}

			activeRuns[driverId] = {
				runId: runId,
				idle: isIdle
			};
		});
	};
};

