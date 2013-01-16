/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Purpose: general data and message processing that comes from either the Drivers or CI server
 */

var fs = require("fs"),
path = require("path"),
mysql = require("mysql"),
wrench = require("wrench"),
hubUtils = require(__dirname + "/hubUtils");

module.exports = new function() {
	var self = this,
	activeRuns = {},
	dbConnection,
	driverCommand = "start";

	this.server;

	this.init = function(callback) {
		dbConnection = mysql.createConnection({
			host: hubGlobal.config.dbHost,
			user: hubGlobal.config.dbUser,
			database: "anvil_hub"
		});
		dbConnection.on('close', function(error) {
			if (error) {
				if (error.code === "PROTOCOL_CONNECTION_LOST") {
					hubUtils.log("MYSQL connection lost, re-connecting...");
					dbConnection = mysql.createConnection(dbConnection.config);

				} else {
					// non timeout error, treat as fatal
					hubUtils.log("MYSQL connection lost, error <" + error.code + ">");
					process.exit(1);
				}
			}
			
			/*
			NOTE about non error state close:

			no action required here since the assumption is that this will only be triggered by
			a manual close of the connection and that a re-connect or other behavior will by taken
			by the caller
			*/
		});
		dbConnection.connect(function(error) {
			if (!error) {
				// clear any needed DB state upon startup
				dbConnection.query("DELETE FROM driver_state", function(error, rows, fields) {
					if (error) {
						throw error;
					}

					hubUtils.log("temp DB state cleared");
					callback();
				});
			}
		});
	};

	this.processCiMessage = function(ciConnection, message) {
		var queryArgs;

		function printMessageContentsError(propertyName) {
			console.log("received CI JSON object <" + JSON.stringify(message) + "> does not " + 
				"contain a \"" + propertyName + "\" property, ignoring");

			ciConnection.destroy();
		}

		try {
			message = JSON.parse(message);

		} catch (e) {
			hubUtils.log("error occured when trying to parse message from CI server");
			ciConnection.destroy();
			return;
		}

		if(typeof message.gitHash === "undefined") {
			printMessageContentsError("gitHash");
			return;
		}

		if((typeof message.branch) === "undefined") {
			printMessageContentsError("branch");
			return;
		}

		if((typeof message.buildTime) === "undefined") {
			printMessageContentsError("buildTime");
			return;
		}

		if((typeof message.sdkBaseFilename) === "undefined") {
			printMessageContentsError("sdkBaseFilename");
			return;
		}

		queryArgs = {
			git_hash: message.gitHash,
			branch: message.branch,
			timestamp: message.buildTime,
			base_sdk_filename: message.sdkBaseFilename
		};
		dbConnection.query('INSERT INTO runs SET ?', queryArgs, function(error, rows, fields) {
			var driverId;

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
			for (driverId in activeRuns) {
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
		var driverRunWorkingDir = path.join(hubGlobal.workingDir, activeRuns[driverId].gitHash + driverId), // create unique working dir
		resultsFile,
		command = "tar -xzvf " + path.join(driverRunWorkingDir, activeRuns[driverId].gitHash + driverId + ".tgz") + " -C " + driverRunWorkingDir;

		fs.mkdirSync(driverRunWorkingDir);
		resultsFile = fs.openSync(path.join(driverRunWorkingDir, activeRuns[driverId].gitHash + driverId + ".tgz"), 'w');

		// create zip
		fs.writeSync(resultsFile, results, 0, results.length, null);
		fs.closeSync(resultsFile);

		// extract the results set
		hubUtils.runCommand(command, function(error, stdout, stderr) {
			var numPassed,
			numFailed,
			branch;

			if (error !== null) {
				console.log("error <" + error + "> occurred when trying to extract results to <" + 
					driverRunWorkingDir + ">");

				return;
			}

			numPassed = 0;
			numFailed = 0;

			console.log("storing results...");

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
				var queryArgs;

				if (typeof configSets[configSetIndex] !== "undefined") {
					queryArgs = {
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
				var config = configs[configIndex],
				queryArgs;

				if ((typeof config) !== "undefined") {
					queryArgs = {
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
				var suite = suites[suiteIndex],
				queryArgs;

				if ((typeof suite) !== "undefined") {
					queryArgs = {
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
				var test = tests[testIndex],
				queryArgs;

				if ((typeof test) !== "undefined") {
					if (test.testResult.result === "success") {
						numPassed++;

					} else {
						numFailed++;
					}

					queryArgs = {
						branch: branch,
						run_id: activeRuns[driverId].runId,
						driver_id: driverId,
						suite_name: suiteName,
						suite_id: suiteId,
						name: test.testName,
						duration: test.testResult.duration,
						result: test.testResult.result
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
				var results = fs.readFileSync(path.join(driverRunWorkingDir, "json_results"), "utf-8");
				results = JSON.parse(results);

				// store the branch ID for later use
				branch = rows[0].branch;

				insertDriverRun(results, function() {
					dbConnection.query("UPDATE driver_runs SET passed_tests=" + numPassed +
						", failed_tests=" + numFailed + " WHERE driver_id=\"" + driverId + "\"" +
						" AND run_id=" + activeRuns[driverId].runId, function(error, rows, fields) {

						if (error) {
							throw error;
						}

						// copy the raw results file to a location where it can be served up
						var rawResultsFilename = activeRuns[driverId].gitHash + driverId + ".tgz";
						fs.renameSync(path.resolve(driverRunWorkingDir, rawResultsFilename), path.join("web", "results", rawResultsFilename));
						hubUtils.log("results file moved to serving location");

						wrench.rmdirSyncRecursive(driverRunWorkingDir, false);
						hubUtils.log("temp working directory cleaned up");

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
			var runId,
			gitHash,
			isIdle,
			rowIndex;

			if (error) {
				throw error;
			}

			runId = null;
			gitHash = null;
			isIdle = true;

			function checkRun() {
				var sdkVersion = rows[rowIndex].base_sdk_filename.substring(0, rows[rowIndex].base_sdk_filename.indexOf(".v"));

				runIsValidForDriver(sdkVersion, function(isValid) {
					if (isValid === true) {
						startDriverRun(finish);

					} else {
						rowIndex++;

						if (isValid === false && rowIndex < rows.length) {
							checkRun();

						} else {
							finish();
						}
					}
				});
			}

			function runIsValidForDriver(sdkVersion, callback) {
				var versionReqs = hubGlobal.config.sdkVersionReqs[new String(sdkVersion)];

				/*
				if the version is not listed in the hub config file, do not test against.  This is so 
				that we can turn on testing at the driver level as we choose since we may need to bring new 
				drivers online or change configuration first
				*/
				if (typeof versionReqs === "undefined") {
					callback(false);
					return;
				}

				dbConnection.query("SELECT * FROM driver_state WHERE id = \"" + driverId + "\"", function(error, rows, fields) {
					var driverEnvironment,
					isValid = true;

					if (rows.length > 0 && typeof rows[0].environment !== "undefined") {
						driverEnvironment = JSON.parse(rows[0].environment);

						if (driverEnvironment.platform === "android") {
							// placeholder

						} else if (driverEnvironment.platform === "ios") {
							versionReqs = versionReqs.ios;
							if (typeof versionReqs === "undefined") {
								callback(isValid);
								return;
							}

							if (typeof versionReqs.minXcodeVersion !== "undefined") {
								if (typeof driverEnvironment.xcodeVersion === "undefined" || 
									(typeof driverEnvironment.xcodeVersion !== "undefined" && 
									(versionReqs.minXcodeVersion > driverEnvironment.xcodeVersion))) {

									isValid = false;
								}
							}

							if (typeof versionReqs.maxXcodeVersion !== "undefined") {
								if (typeof driverEnvironment.xcodeVersion === "undefined" || 
									(typeof driverEnvironment.xcodeVersion !== "undefined" && 
									(versionReqs.maxXcodeVersion < driverEnvironment.xcodeVersion))) {

									isValid = false;
								}
							}

						} else if (driverEnvironment.platform === "mobileweb") {
							// placeholder
						}
					}

					callback(isValid);
				});
			}

			function startDriverRun(callback) {
				runId = rows[rowIndex].id;
				gitHash = rows[rowIndex].git_hash;
				isIdle = false;

				self.updateDriverState({
					id: driverId,
					state: "running",
					gitHash: gitHash
					});

				self.server.sendMessageToDriver(driverId, {
					command: driverCommand,
					gitHash: gitHash,
					branch: rows[rowIndex].branch,
					sdkBaseFilename: rows[rowIndex].base_sdk_filename
					});

				callback();
			}

			function finish() {
				activeRuns[driverId] = {
					runId: runId,
					gitHash: gitHash,
					idle: isIdle
				};
			}

			if (rows.length > 0) {
				rowIndex = 0;
				checkRun();

			} else {
				finish();
			}
		});
	};

	this.updateDriverState = function(args) {
		function updatedCallback() {
			hubUtils.log("driver <" + args.id + "> state updated: " + args.state);
		}

		if (args.state !== "disconnected") {
			dbConnection.query("SELECT * FROM driver_state WHERE id = \"" + args.id + "\"", function(error, rows, fields) {
				var timestamp = new Date().getTime() / 1000,
				queryArgs = {
					id: args.id,
					state: args.state,
					timestamp: timestamp,
					environment: args.environment
				};

				if (args.description) {
					queryArgs["description"] = args.description;

				} else if (rows.length > 0) {
					queryArgs["description"] = rows[0].description;
				}

				if (args.gitHash) {
					queryArgs["git_hash"] = args.gitHash;

				} else {
					queryArgs["git_hash"] = "";
				}

				if (args.environment) {
					queryArgs["environment"] = JSON.stringify(args.environment);

				} else if (rows.length> 0) {
					queryArgs["environment"] = rows[0].environment;

				} else {
					queryArgs["environment"] = JSON.stringify({});
				}

				dbConnection.query('REPLACE INTO driver_state SET ?', queryArgs, function(error, rows, fields) {
					if (error) {
						throw error;
					}

					updatedCallback()
				});
			});

		} else {
			dbConnection.query("DELETE FROM driver_state WHERE id = \"" + args.id + "\"", function(error, rows, fields) {
				if (error) {
					throw error;
				}

				updatedCallback();
			});
		}
	};
};

