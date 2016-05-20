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
	sdkVersion,
	sdkPackage,
	selectedSDK,
	iosTestResults,
	androidTestResults,
	iosJsonResults,
	androidJsonResults,
	maxFailedTestCount = 0,
	runningOnTravis = false,
	runningOnJenkins = false,
	runningOnSGJenkins = false,
	skipScons = false,
	glob = require('glob'),
	totalAPI = 0,
	totalAPITest = 0;

function getSDKInstallDir(next) {
	var prc = exec('titanium info -o json -t titanium', function (error, stdout, stderr) {
		var out;
		if (error !== null) {
		  next('Failed to get SDK install dir: ' + error);
		}
		out = JSON.parse(stdout);
		selectedSDK = out['titaniumCLI']['selectedSDK'];
		sdkPath = out['titanium'][selectedSDK]['path'];
		next();
	});
}

function clearPreviousApp(next) {
	var projectDir = path.join(__dirname, 'testApp');
	// If the project already exists, wipe it
	if (fs.existsSync(projectDir)) {
		wrench.rmdirSyncRecursive(projectDir);
	}
	next();
}

function sconsSDK(next) {
	var out = JSON.parse(fs.readFileSync('./package.json','utf8')),
		versionTag,
		prc;
	if (skipScons == true) {
		console.log('Skipping scons');
		next();
	}
	else {
		sdkVersion = out['version'] + '.apiTest';
		versionTag = 'version_tag=' + sdkVersion;
		prc = spawn('scons', [versionTag]);
		prc.stdout.on('data', function (data) {
			console.log(data.toString());
		});
		prc.on('close', function (code) {
			if (code != 0) {
				next("Failed to scons SDK");
			} else {
				next();
			}
		});
	}
}

function installSDK(next) {
	var sdkPackageFile = 'mobilesdk-' + sdkVersion + '-osx.zip',
		prc;
	if (skipScons == true) {
		console.log('skipping sdk install');
		next();
	}
	else {
		sdkPackage = path.join(__dirname,'..','..','dist', sdkPackageFile);
		prc = spawn('titanium', ['sdk', 'install', sdkPackage, '-d']);
		prc.stdout.on('data', function (data) {
			console.log(data.toString());
		});
		prc.on('close', function (code) {
			if (code != 0) {
				next("Failed to install SDK");
			} else {
				next();
			}
		});
	}
}

function generateProject(next) {
	var projectDir = path.join(__dirname, 'testApp'),
		prc;
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
		if (line.indexOf('<ios>') >= 0) {
			content.push('<use-app-thinning>true</use-app-thinning>');
		}
		// TODO Have this look at the existing modules under the test app folder to inject them
		// inject the test modules for require
		else if (line.indexOf('<modules>') >= 0) {
			content.push('<module version="1.0.0">commonjs.index_js</module>');
			content.push('<module version="1.0.0">commonjs.index_json</module>');
			content.push('<module version="1.0.0">commonjs.legacy</module>');
			content.push('<module version="1.0.0">commonjs.legacy.index_js</module>');
			content.push('<module version="1.0.0">commonjs.legacy.index_json</module>');
			content.push('<module version="1.0.0">commonjs.legacy.package</module>');
			content.push('<module version="1.0.0">commonjs.package</module>');
		}
	});
	fs.writeFileSync(tiapp_xml, content.join('\n'));

	next();
}

function copyMochaAssets(next) {
	var src = path.join(__dirname, '..', '..', 'ti_mocha_tests', 'Resources'),
		dest = path.join(__dirname, 'testApp', 'Resources');
	wrench.copyDirSyncRecursive(src, dest, {
		forceDelete: true
	});

	// copy modules so we can test those too
	src = path.join(__dirname, '..', '..', 'ti_mocha_tests', 'modules'),
		dest = path.join(__dirname, 'testApp', 'modules');
	wrench.copyDirSyncRecursive(src, dest, {
		forceDelete: true
	});

	// copy plugins so we can test those too
	src = path.join(__dirname, '..', '..', 'ti_mocha_tests', 'plugins'),
		dest = path.join(__dirname, 'testApp', 'plugins');
	wrench.copyDirSyncRecursive(src, dest, {
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

function parseIOSTestResults(next) {
	if (!iosTestResults) {
		next();
	} else {
		// preserve newlines, etc - use valid JSON
		iosTestResults = iosTestResults.replace(/\\n/g, "\\n")
				   .replace(/\\'/g, "\\'")
				   .replace(/\\"/g, '\\"')
				   .replace(/\\&/g, "\\&")
				   .replace(/\\r/g, "\\r")
				   .replace(/\\t/g, "\\t")
				   .replace(/\\b/g, "\\b")
				   .replace(/\\f/g, "\\f");
		// remove non-printable and other non-valid JSON chars
		iosTestResults = iosTestResults.replace(/[\u0000-\u0019]+/g,"");
		iosJsonResults = JSON.parse(iosTestResults);
		next();
	}
}

function parseAndroidTestResults(next) {
	if (!androidTestResults) {
		next();
	} else {
		// preserve newlines, etc - use valid JSON
		androidTestResults = androidTestResults.replace(/\\n/g, "\\n")
				   .replace(/\\'/g, "\\'")
				   .replace(/\\"/g, '\\"')
				   .replace(/\\&/g, "\\&")
				   .replace(/\\r/g, "\\r")
				   .replace(/\\t/g, "\\t")
				   .replace(/\\b/g, "\\b")
				   .replace(/\\f/g, "\\f");
		// remove non-printable and other non-valid JSON chars
		androidTestResults = androidTestResults.replace(/[\u0000-\u0019]+/g,"");
		androidJsonResults = JSON.parse(androidTestResults);
		next();
	}
}

function getTotalAPI(next) {
	fs.readFile('./dist/api.jsca','utf8', function(err, data) {
		if (err) {
			next('Error getting Total API');
		}
		else {
			totalAPI = data.types.length;
			next();
		}
	})
	next();
}

function getTotalAPITest(next) {
	glob("./ti_mocha_tests/*.test.js", function(err, files) {
		if(err) {
			console.log('Error reading ti_mocha_tests');
			next('Error reading ti_mocha_tests');
		}
		else {
			totalAPITest = files.length;
			next();
		}
	});
}

function cleanUp(next) {
	var prc,
		out,
		sdkPackageFile;
	if (skipScons) {
		out = JSON.parse(fs.readFileSync('./package.json','utf8'));
		sdkVersion = out['version'] + '.apiTest';
		sdkPackageFile = 'mobilesdk-' + sdkVersion + '-osx.zip';
		sdkPackage = path.join(__dirname,'..','..','dist', sdkPackageFile);
	}
	// If the project already exists, wipe it
	if (fs.existsSync(sdkPackage)) {
		fs.unlinkSync(sdkPackage);
	}
	prc = spawn('titanium', ['sdk', 'uninstall', sdkVersion,'--force']);
	prc.on('close', function (code) {
		if (code != 0) {
			next("Failed to uninstall SDK");
		} else {
			next();
		}
	});
}

function killiOSSimulator(next) {
	var prc = spawn('killall', ['Simulator']);
	prc.on('close', function (code) {
		next();
	});
}

function killAndroidSimulator(next) {
//should kill genymotion
	next();
}
/**
 * Finds the existing SDK, Scons the new SDK, install the new SDK ,generates a Titanium mobile project,
 * sets up the project, copies unit tests into it from ti_mocha_tests, and then runs the project in a ios simulator
 * and android emulator which will run the mocha unit tests. The test results are piped to
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
		if (val == 'run-on-sg-jenkins') {
			runningOnSGJenkins = true;
			console.log('Run Build and Automated Tests on SG Jenkins');
		};
		if (val == 'skip-scons') {
			skipScons = true;
			console.log('Skip scons. This assumes you ran npm test at least once already');
		};
	});
	//Only test local and on SGJenkins machine.
	if (runningOnJenkins == false && runningOnTravis == false) {
		async.series([
			//scons here depending on flag and install
			function (next) {
				getSDKInstallDir(next);
			},
			function (next) {
				clearPreviousApp(next);
			},
			function (next) {
				console.log("Scons SDK");
				sconsSDK(next);
			},
			function (next) {
				console.log("Install SDK");
				installSDK(next);
			},
//			function (next) {
//				console.log("Kill iOS simulator");
//				killiOSSimulator(next);
//			},
//			function (next) {
//				console.log("Kill Android simulator");
//				killAndroidSimulator(next);
//			},
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
				runAndroidBuild(next, 2);
			},
			function (next) {
				parseAndroidTestResults(next);
			},
			function (next) {
				console.log("Launching ios test project in simulator");
				runIOSBuild(next, 2);
			},
			function (next) {
				parseIOSTestResults(next);
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
			androidFailedTests = [],
			buildStatus = 0;
		if (err) {
			console.error(err.toString().red);
			if (runningOnSGJenkins) {
				async.series([
					function(next) {
						cleanUp(next);
					}],
					function (err) {
						if (err) {
							console.error(err.toString().red);
						}
					}
				);
			}
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
				console.log('\n%d unit tests failed.', androidFailedTestsCount + iosFailedTestsCount);
				if (runningOnSGJenkins) {
					async.series([
						function(next) {
							cleanUp(next);
						}],
						function (err) {
							if (err) {
								console.error(err.toString().red);
							}
						}
					);
				}
				process.exit(1);
			}
			console.log('\n--------------Calculating coverage--------------------');
			async.series([
				function (next) {
					getTotalAPI(next);
				},
				function (next) {
					getTotalAPITest(next);
				}],
				function (err) {
					if (err) {
						console.error(err.toString().red);
						if (runningOnSGJenkins) {
							async.series([
								function(next) {
									cleanUp(next);
								}],
								function (err) {
									if (err) {
										console.error(err.toString().red);
									}
								}
							);
						}
						process.exit(1);
					}
					//var apiCoverage = totalAPITest/totalAPI*100;
					//console.log('API Coverage: %d / %d', totalAPITest, totalAPI);
					console.log('API Coverage: %d', totalAPITest);
					//send coverage info to server
					if (runningOnSGJenkins) {
						async.series([
							function(next) {
								cleanUp(next);
							}],
							function (err) {
								if (err) {
									console.error(err.toString().red);
									process.exit(1);
								}
							}
						);
					}
					process.exit(0);
				}
			);
		}
	});
}
