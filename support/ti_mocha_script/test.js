/**
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */
var path = require('path'),
	fs = require('fs'),
	async = require('async'),
	colors = require('colors'),
	wrench = require('wrench'),
	ejs = require('ejs'),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	sdkPath,
	iosTestResults,
	androidTestResults,
	iosJsonResults,
	androidJsonResults,
	maxFailedTestCount = 0,
	runningOnTravis = false,
	runningOnJenkins = false,
	glob = require('glob'),
	totalAPI = 0,
	totalAPITest = 0;

function getSDKInstallDir(next) {
	var prc = exec('titanium info -o json -t titanium', function (error, stdout, stderr) {
		var out,
			selectedSDK;
		if (error !== null) {
		  next('Failed to get SDK install dir: ' + error);
		}

		out = JSON.parse(stdout);
		selectedSDK = out['titaniumCLI']['selectedSDK'];

		sdkPath = out['titanium'][selectedSDK]['path'];
		next();
	});
}

function generateProject(next) {
	var projectDir = path.join(__dirname, 'testApp'),
		prc;
	// If the project already exists, wipe it
	if (fs.existsSync(projectDir)) {
		wrench.rmdirSyncRecursive(projectDir);
	}
	prc = spawn('titanium', ['create', '--force', '--type', 'app', '--platforms', 'android,ios', '--name', 'testApp', '--id', 'com.appcelerator.testApp.testing', '--url', 'http://www.appcelerator.com', '--workspace-dir', __dirname, '--no-prompt']);
	prc.stdout.on('data', function (data) {
		console.log(data.toString());
	});
	prc.stderr.on('data', function (data) {
		console.log(data.toString());
	});
	prc.on('close', function (code) {
		var setProcess;
		if (code != 0) {
			next("Failed to create project");
		} else {
			next();
		}
	});
}

// Add required properties for our unit tests!
function addTiAppProperties(next) {
	var tiapp_xml = path.join(__dirname, 'testApp', 'tiapp.xml');

	// Not so smart but this should work...
	var content = [];
	fs.readFileSync(tiapp_xml).toString().split(/\r?\n/).forEach(function(line) {
		content.push(line);
		if (line.indexOf('<guid>') >= 0) {
		//for fixed tiapp properties
		}
	});
	fs.writeFileSync(tiapp_xml, content.join('\n'));

	next();
}

function copyMochaAssets(next) {
	var mochaAssetsDir = path.join(__dirname, '..', '..', 'ti_mocha_tests'),
		dest = path.join(__dirname, 'testApp', 'Resources');
	wrench.copyDirSyncRecursive(mochaAssetsDir, dest, {
		forceDelete: true
	});
	next();
}

function runIOSBuild(next, count) {
	var prc,
		inResults = false,
		done = false;
	prc = spawn('titanium', ['build', '--project-dir', path.join(__dirname, 'testApp'), '--platform', 'ios', '--target', 'simulator', '--no-prompt', '--no-colors', '--log-level', 'info']);
	prc.stdout.on('data', function (data) {
		console.log(data.toString());
		var lines = data.toString().trim().match(/^.*([\n\r]+|$)/gm);
		for (var i = 0; i < lines.length; i++) {
			var str = lines[i],
				index = -1;

			if (inResults) {
				if ((index = str.indexOf('[INFO]')) != -1) {
					str = str.slice(index + 8).trim();
				}
				if ((index = str.indexOf('!TEST_RESULTS_STOP!')) != -1) {
					str = str.slice(0, index).trim();
					inResults = false;
					done = true; // we got the results we need, when we kill this process we'll move on
				}

				iosTestResults += str;
				if (!inResults) {
					iosTestResults = iosTestResults.trim(); // for some reason, there's a leading space that is messing with everything!
					prc.kill();
					break;
				}
			}
			else if ((index = str.indexOf('!TEST_RESULTS_START!')) != -1) {
				inResults = true;
				iosTestResults = str.substr(index + 20).trim();
			}

			// Handle when app crashes and we haven't finished tests yet! 
			if ((index = str.indexOf('-- End application log ----')) != -1) {
				prc.kill(); // quit this build...
				if (count > 3) {
					next("failed to get test results before log ended!"); // failed too many times
				} else {
					runBuild(next, count + 1); // retry
				}
			}
		}
	});
	prc.stderr.on('data', function (data) {
		console.log(data.toString());
	});
	prc.on('close', function (code) {
		if (done) {
			next(); // only move forward if we got results and killed the process!
		}
		else {
			next("Failed to build ios project");
		} 
	});
}

function runAndroidBuild(next, count) {
	var prc,
		androidUnlock,
		inResults = false,
		done = false;

	//unlock android emulator before ti build (needed for travis)
	if (runningOnTravis == true) {
		androidUnlock = spawn('adb', ['shell','input','keyevent','82', '&']);
		androidUnlock.stdout.on('data', function(data) {
			console.log(data.toString());
		});
		androidUnlock.stderr.on('data', function(data) {
			console.log('Android emulator error');
			console.log(data.toString());
		});
		androidUnlock.on('close', function(code) {
			console.log('Android emulator code');
			console.log(code);
		});
	}
	prc = spawn('titanium', ['build', '--project-dir', path.join(__dirname, 'testApp'), '--platform', 'android', '--target', 'emulator', '--no-prompt', '--no-colors','--log-level', 'info']);
	prc.stdout.on('data', function (data) {
		console.log(data.toString());
		var lines = data.toString().trim().match(/^.*([\n\r]+|$)/gm);
		for (var i = 0; i < lines.length; i++) {
			var str = lines[i],
				index = -1;

			if (inResults) {
				if ((index = str.indexOf('[INFO]')) != -1) {
					str = str.slice(index + 8).trim();
				}
				if ((index = str.indexOf('!TEST_RESULTS_STOP!')) != -1) {
					str = str.slice(0, index).trim();
					inResults = false;
					done = true; // we got the results we need, when we kill this process we'll move on
				}

				androidTestResults += str;
				if (!inResults) {
					androidTestResults = androidTestResults.trim(); // for some reason, there's a leading space that is messing with everything!
					prc.kill();
					break;
				}
			}
			else if ((index = str.indexOf('!TEST_RESULTS_START!')) != -1) {
				inResults = true;
				androidTestResults = str.substr(index + 20).trim();
			}

			// Handle when app crashes and we haven't finished tests yet! 
			if ((index = str.indexOf('-- End application log ----')) != -1) {
				prc.kill(); // quit this build...
				if (count > 3) {
					next("failed to get test results before log ended!"); // failed too many times
				} else {
					runBuild(next, count + 1); // retry
				}
			}
		}
	});
	prc.stderr.on('data', function (data) {
		console.log(data.toString());
	});
	prc.on('close', function (code) {
		if (done) {
			next(); // only move forward if we got results and killed the process!
		}
		else {
			next("Failed to build android project");
		} 		
	});
}

function parseIOSTestResults(testResults, next) {
	if (!testResults) {
		next();
	} else {
		// preserve newlines, etc - use valid JSON
		testResults = testResults.replace(/\\n/g, "\\n")  
				   .replace(/\\'/g, "\\'")
				   .replace(/\\"/g, '\\"')
				   .replace(/\\&/g, "\\&")
				   .replace(/\\r/g, "\\r")
				   .replace(/\\t/g, "\\t")
				   .replace(/\\b/g, "\\b")
				   .replace(/\\f/g, "\\f");
		// remove non-printable and other non-valid JSON chars
		testResults = testResults.replace(/[\u0000-\u0019]+/g,""); 
		iosJsonResults = JSON.parse(testResults);
		next();
	}
}

function parseAndroidTestResults(testResults, next) {
	if (!testResults) {
		next();
	} else {
		// preserve newlines, etc - use valid JSON
		testResults = testResults.replace(/\\n/g, "\\n")  
				   .replace(/\\'/g, "\\'")
				   .replace(/\\"/g, '\\"')
				   .replace(/\\&/g, "\\&")
				   .replace(/\\r/g, "\\r")
				   .replace(/\\t/g, "\\t")
				   .replace(/\\b/g, "\\b")
				   .replace(/\\f/g, "\\f");
		// remove non-printable and other non-valid JSON chars
		testResults = testResults.replace(/[\u0000-\u0019]+/g,""); 
		androidJsonResults = JSON.parse(testResults);
		next();
	}
}

function getTotalAPI(next) {
	var api = JSON.parse(fs.readFileSync('./dist/api.jsca','utf8'));
	totalAPI = api.types.length;
	next();
}

function getTotalAPITest(next) {
	glob("./ti_mocha_tests/*.test.js", function(err, files) {
		if(err) {
			console.log('Error reading ti_mocha_tests');
			next('Error reading ti_mocha_tests');
		}
		totalAPITest = files.length;
		next();
	});
}

/**
 * Finds the SDK, generates a Titanium mobile project, sets up the project, copies unit tests into it from ti_mocha_tests,
 * and then runs the project in a ios simulator and android emulator which will run the mocha unit tests. The test results are piped to
 * the CLi. If any unit test fails, process exits with a fail. After which the API coverage is calculated. If the coverage
 * falls below the previous build, process exits with a fail.
 */
function test(callback) {

	process.argv.forEach(function(val, index, array) {
		if (val == 'run-on-travis') {
			runningOnTravis = true;
			console.log('Running Automated Tests on Travis');
		};
		if (val == 'run-on-jenkins') {
			runningOnJenkins = true;
			console.log('Skip Automated Tests on Jenkins');
		};
	});
	//Skip these tests if built on Jenkins. Should integrate into Jenkins in the future.
	if (runningOnJenkins == false) {
		async.series([
			function (next) {
				getSDKInstallDir(next);
			},
			function (next) {
				console.log("Generating project");
				generateProject(next);

			},
			function (next) {
				console.log("Adding properties for tiapp.xml");
				addTiAppProperties(next);
			},
			function (next) {
				console.log("Copying test scripts into project");
				copyMochaAssets(next);
			},
			function (next) {
				console.log("Launching android test project in emulator");
				runAndroidBuild(next, 1);
			},
			function (next) {
				parseAndroidTestResults(androidTestResults, next);
			},		
			function (next) {
				console.log("Launching ios test project in simulator");
				runIOSBuild(next, 1);
			},
			function (next) {
				parseIOSTestResults(iosTestResults, next);
			}
		], function(err) {
			callback(err, {
				iosResults: iosJsonResults,
				androidResults: androidJsonResults
			});
		});
	}
}

// public API
exports.test = test;

// When run as single script.
if (module.id === ".") {
	test(function (err, finalResults) {
		var iosPassedTestsCount = 0,
			iosSkippedTestsCount = 0,
			iosFailedTestsCount = 0,
			iosAllTestsCount = 0,
			androidPassedTestsCount = 0,
			androidSkippedTestsCount = 0,
			androidFailedTestsCount = 0,
			androidAllTestsCount = 0,
			iosFailedTests = [],
			androidFailedTests = [];
		if (err) {
			console.error(err.toString().red);
			process.exit(1);
		} else {
			if (typeof finalResults.iosResults !== 'undefined' && finalResults.iosResults){
				iosAllTestsCount = finalResults.iosResults.results.length;
				for (var i = 0; i < iosAllTestsCount; i++) {
					var test = finalResults.iosResults.results[i];
					if (test.state == 'failed') {
						iosFailedTests.push(test);
						iosFailedTestsCount++;
					}
					else if (test.state == 'skipped') {
						iosSkippedTestsCount++;
					}
					else {
						iosPassedTestsCount++;
					}
				}
			}
			if (typeof finalResults.androidResults !== 'undefined' && finalResults.androidResults){
				androidAllTestsCount = finalResults.androidResults.results.length;
				for (var i = 0; i < androidAllTestsCount; i++) {
					var test = finalResults.androidResults.results[i];
					if (test.state == 'failed') {
						androidFailedTests.push(test);
						androidFailedTestsCount++;
					}
					else if (test.state == 'skipped') {
						androidSkippedTestsCount++;
					}
					else {
						androidPassedTestsCount++;
					}
				}
			}
			console.log('------------Automated Unit Test Results---------------');
			console.log('\n----------------IOS Failed Tests----------------------');
			console.log(iosFailedTests);
			console.log('\n--------------Android Failed Tests--------------------');
			console.log(androidFailedTests);
			console.log('\n------------Automated Unit Test Summary---------------');
			console.log('\nIOS: passed %d / skipped %d / failed %d', iosPassedTestsCount,iosSkippedTestsCount, iosFailedTestsCount);
			console.log('Android: passed %d / skipped %d, / failed %d', androidPassedTestsCount,androidSkippedTestsCount, androidFailedTestsCount);
			console.log('Total: passed %d / skipped %d / failed %d',iosPassedTestsCount + androidPassedTestsCount,iosSkippedTestsCount + androidSkippedTestsCount, iosFailedTestsCount + androidFailedTestsCount);
			//need something here to put the failed tests and the health somewhere visible outside of travis
			if(androidFailedTestsCount + iosFailedTestsCount > maxFailedTestCount) {
				console.log('\n%d unit tests failed. Failing travis build.', androidFailedTestsCount + iosFailedTestsCount);
				process.exit(1);
			}
			console.log('\n--------------Calculating coverage--------------------');
			async.series([
				function (next) {
					getTotalAPI(next);
				},
				function (next) {
					getTotalAPITest(next);

				}], function (err) {

					if (err) {
						console.error(err.toString().red);
						process.exit(1);						
					}
					var apiCoverage = totalAPITest/totalAPI*100;
					console.log('API Coverage: %d / %d', totalAPITest, totalAPI);
					//send coverage info to server
					process.exit(0);
				}
			);


		}
	});
}

