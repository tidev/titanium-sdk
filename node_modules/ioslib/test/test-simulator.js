/**
 * Tests ioslib's simulator module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	exec = require('child_process').exec,
	fs = require('fs'),
	ioslib = require('..'),
	path = require('path');

function checkSims(sims) {
	should(sims).be.an.Array;
	sims.forEach(function (sim) {
		should(sim).be.an.Object;
		should(sim).have.keys('deviceType', 'udid', 'type', 'name', 'xcode', 'app', 'cmd', 'logPath', 'logFile');

		should(sim.deviceType).be.a.String;
		should(sim.deviceType).not.equal('');

		should(sim.udid).be.a.String;
		should(sim.udid).not.equal('');

		should(sim.type).be.a.String;
		should(sim.type).not.equal('');

		should(sim.name).be.a.String;
		should(sim.name).not.equal('');

		should(sim.xcode).be.a.String;
		should(sim.xcode).not.equal('');

		should(sim.app).be.a.String;
		should(sim.app).not.equal('');
		should(fs.existsSync(sim.app)).be.true;

		should(sim.cmd).be.an.Array;

		if (sim.logPath !== null) {
			should(sim.logPath).be.a.String;
		}
	});
}

function build(defs, done){
	if (typeof defs === 'function') {
		done = defs;
		defs = [];
	}

	ioslib.xcode.detect(function (err, env) {
		if (err) {
			return done(err);
		}

		if (env.selectedXcode === null) {
			return done(new Error(__('No selected Xcode')));
		}

		exec([
			env.selectedXcode.executables.xcodebuild,
			'clean', 'build',
			'-configuration', 'Debug',
			'-sdk', 'iphonesimulator' + appc.version.format(env.selectedXcode.sdks[0], 2, 2),
			'VALID_ARCHS="i386"',
			'ARCHS="i386"',
			'GCC_PREPROCESSOR_DEFINITIONS="' + defs.join(' ') + '"'
		].join(' '), {
			cwd: path.join(__dirname, 'TestApp')
		}, function (code, out, err) {
			should(out).match(/BUILD SUCCEEDED/);
			var appPath = path.join(__dirname, 'TestApp', 'build', 'Debug-iphonesimulator', 'TestApp.app');
			should(fs.existsSync(appPath)).be.true;
			done(null, appPath);
		});
	});
}

function timochaLogWatcher(emitter, callback) {
	typeof callback === 'function' || (callback = function () {});

	var inTiMochaResult = false,
		tiMochaResults = [],
		logLevelRegExp = /^\[\w+\]\s*/;

	function watch(line) {
		line = line.replace(logLevelRegExp, '');

		if (line === 'TI_MOCHA_RESULT_START') {
			inTiMochaResult = true;
		} else if (inTiMochaResult && line === 'TI_MOCHA_RESULT_STOP') {
			emitter.removeListener('log', watch);
			emitter.removeListener('logFile', watch);
			try {
				callback(null, tiMochaResults.length ? JSON.parse(tiMochaResults.join('\n').trim()) : {});
			} catch (ex) {
				callback(new Error('Results are not valid JSON'));
			}
		} else if (inTiMochaResult && line) {
			tiMochaResults.push(line);
		}
	}

	emitter.on('log', watch);
	emitter.on('logFile', watch);
}

describe('simulator', function () {
	it('namespace should be an object', function () {
		should(ioslib.simulator).be.an.Object;
	});

	it('detect iOS Simulators', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('executables', 'simulators', 'crashDir', 'issues');

			should(results.executables).be.an.Object;
			should(results.executables).have.keys('ios-sim');
			should(results.executables['ios-sim']).be.a.String;
			should(results.executables['ios-sim']).not.equal('');
			should(fs.existsSync(results.executables['ios-sim'])).be.true;

			should(results.simulators).be.an.Object;
			Object.keys(results.simulators).forEach(function (ver) {
				checkSims(results.simulators[ver]);
			});

			should(results.crashDir).be.a.String;
			should(results.crashDir).not.equal('');
			if (fs.existsSync(results.crashDir)) {
				should(fs.statSync(results.crashDir).isDirectory()).be.true;
			}

			should(results.issues).be.an.Array;
			results.issues.forEach(function (issue) {
				should(issue).be.an.Object;
				should(issue).have.keys('id', 'type', 'message');
				should(issue.id).be.a.String;
				should(issue.type).be.a.String;
				should(issue.type).match(/^info|warning|error$/);
				should(issue.message).be.a.String;
			});

			done();
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should launch the default simulator and stop it', function (done) {
		this.timeout(30000);
		this.slow(30000);

		ioslib.simulator.launch(null, null, function (err, simHandle) {
			exec('ps -ef', function (code, out, err) {
				if (code) {
					return done(err);
				}

				should(out.split('\n').filter(function (line) { return line.indexOf('ios-sim') !== -1 || line.indexOf(simHandle.app) !== -1; })).not.length(0);

				ioslib.simulator.stop(simHandle, function () {
					done();
				});
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and log basic logs', function (done) {
		this.timeout(30000);
		this.slow(30000);

		build(['TEST_BASIC_LOGGING'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var counter = 0;

			ioslib.simulator.launch(null, {
				appPath: appPath,
				autoExit: true,
				hide: true
			}).on('log', function (line) {
				counter++;
			}).on('exit', function (err) {
				should(err).not.be.ok;
				should(counter).not.equal(0);
				done();
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and log ti mocha results', function (done) {
		this.timeout(30000);
		this.slow(30000);

		build(['TEST_TIMOCHA'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var simHandle,
				n = 0,
				emitter = ioslib.simulator.launch(null, {
					appPath: appPath,
					hide: true
				});

			function stop() {
				if (++n === 2) {
					ioslib.simulator.stop(simHandle, function () {
						done();
					});
				}
			}

			emitter.on('launched', function (handle) {
				simHandle = handle;
				stop();
			});

			timochaLogWatcher(emitter, function (err, results) {
				should(err).not.be.ok;
				should(results).be.an.Object;
				should(results).have.property('foo', 'bar');
				stop();
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and log ti mocha results with multiple lines', function (done) {
		this.timeout(30000);
		this.slow(30000);

		build(['TEST_TIMOCHA_MULTIPLE_LINES'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var simHandle,
				n = 0,
				emitter = ioslib.simulator.launch(null, {
					appPath: appPath,
					hide: true
				});

			function stop() {
				if (++n === 2) {
					ioslib.simulator.stop(simHandle, function () {
						done();
					});
				}
			}

			emitter.on('launched', function (handle) {
				simHandle = handle;
				stop();
			});

			timochaLogWatcher(emitter, function (err, results) {
				should(err).not.be.ok;
				should(results).be.an.Object;
				should(results).have.property('foo', 'bar');
				stop();
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and timeout', function (done) {
		this.timeout(30000);
		this.slow(30000);

		build(['TEST_TIMEOUT'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var simHandle;

			ioslib.simulator.launch(null, {
				appPath: appPath,
				hide: true,
				timeout: 10
			}).on('launched', function (handle) {
				simHandle = handle;
			}).on('timeout', function () {
				ioslib.simulator.stop(simHandle, function () {
					done();
				});
			}).on('exit', function (err) {
				ioslib.simulator.stop(simHandle, function () {
					done(new Error('Your computer is too fast!'));
				});
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and detect crash with Objective-C exception', function (done) {
		this.timeout(30000);
		this.slow(30000);

		build(['TEST_OBJC_CRASH'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var simHandle;

			ioslib.simulator.launch(null, {
				appPath: appPath,
				hide: true,
				timeout: 10000
			}).on('launched', function (handle) {
				simHandle = handle;
			}).on('timeout', function () {
				ioslib.simulator.stop(simHandle, function () {
					done(new Error("Test didn't crash like it is supposed to"));
				});
			}).on('exit', function (crash) {
				// stop the simulator before we start throwing exceptions
				ioslib.simulator.stop(simHandle, function () {
					try {
						should(crash).be.an.instanceOf(ioslib.simulator.SimulatorCrash);
						should(crash.toString()).eql('SimulatorCrash: App crashed in the iOS Simulator');

						should(crash).have.property('crashPlistFile');
						should(crash.crashPlistFile).be.a.String;
						should(fs.existsSync(crash.crashPlistFile)).be.ok;

						should(crash).have.property('crashFile');
						should(crash.crashFile).be.a.String;
						should(fs.existsSync(crash.crashFile)).be.ok;

						should(crash).have.property('report');
						should(crash.report).be.an.Object;
						should(crash.report).have.property('threads');
						should(crash.report.threads).be.an.Array;
						should(crash.report).have.property('crashing_thread_index');
						should(crash.report.crashing_thread_index).be.a.Number;

						var threadInfo = crash.report.threads[crash.report.crashing_thread_index];
						should(threadInfo).be.an.Object;
						should(threadInfo.thread_name).be.a.String;
						should(threadInfo.backtrace).be.an.Array;
					} finally {
						if (crash && crash.crashPlistFile && fs.existsSync(crash.crashPlistFile)) {
							fs.unlinkSync(crash.crashPlistFile);
						}
						if (crash && crash.crashFile && fs.existsSync(crash.crashFile)) {
							fs.unlinkSync(crash.crashFile);
						}
					}

					done();
				});
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and detect crash with C exception', function (done) {
		this.timeout(30000);
		this.slow(30000);

		build(['TEST_C_CRASH'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var simHandle;

			ioslib.simulator.launch(null, {
				appPath: appPath,
				hide: true,
				timeout: 10000
			}).on('launched', function (handle) {
				simHandle = handle;
			}).on('timeout', function () {
				ioslib.simulator.stop(simHandle, function () {
					done(new Error("Test didn't crash like it is supposed to"));
				});
			}).on('exit', function (crash) {
				// stop the simulator before we start throwing exceptions
				ioslib.simulator.stop(simHandle, function () {
					try {
						should(crash).be.an.instanceOf(ioslib.simulator.SimulatorCrash);
						should(crash.toString()).eql('SimulatorCrash: App crashed in the iOS Simulator');

						should(crash).have.property('crashPlistFile');
						should(crash.crashPlistFile).be.a.String;
						should(fs.existsSync(crash.crashPlistFile)).be.ok;

						should(crash).have.property('crashFile');
						should(crash.crashFile).be.a.String;
						should(fs.existsSync(crash.crashFile)).be.ok;

						should(crash).have.property('report');
						should(crash.report).be.an.Object;
						should(crash.report).have.property('threads');
						should(crash.report.threads).be.an.Array;
						should(crash.report).have.property('crashing_thread_index');
						should(crash.report.crashing_thread_index).be.a.Number;

						var threadInfo = crash.report.threads[crash.report.crashing_thread_index];
						should(threadInfo).be.an.Object;
						should(threadInfo.thread_name).be.a.String;
						should(threadInfo.backtrace).be.an.Array;
					} finally {
						if (crash && crash.crashPlistFile && fs.existsSync(crash.crashPlistFile)) {
							fs.unlinkSync(crash.crashPlistFile);
						}
						if (crash && crash.crashFile && fs.existsSync(crash.crashFile)) {
							fs.unlinkSync(crash.crashFile);
						}
					}

					done();
				});
			});
		});
	});
});