/**
 * Tests ioslib's simulator module.
 *
 * @copyright
 * Copyright (c) 2014-2015 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	assert = require('assert'),
	async = require('async'),
	exec = require('child_process').exec,
	fs = require('fs'),
	ioslib = require('..'),
	path = require('path');

function checkSims(sims) {
	should(sims).be.an.Array;
	sims.forEach(function (sim) {
		should(sim).be.an.Object;
		should(sim).have.keys('udid', 'name', 'version', 'deviceType', 'deviceName', 'deviceDir', 'model', 'family', 'supportsXcode', 'supportsWatch', 'watchCompanion', 'runtime', 'runtimeName', 'systemLog', 'dataDir');

		['udid', 'name', 'version', 'state', 'deviceType', 'deviceName', 'deviceDir', 'model', 'family', 'runtime', 'runtimeName', 'xcode', 'systemLog', 'dataDir'].forEach(function (key) {
			if (sim[key] !== null) {
				should(sim[key]).be.a.String;
				should(sim[key]).not.equal('');
			}
		});

		if (sim.supportsWatch !== null) {
			should(sim.supportsWatch).be.an.Object;
			Object.keys(sim.supportsWatch).forEach(function (xcodeId) {
				should(sim.supportsWatch[xcodeId]).be.a.Boolean;
			});
		}
	});
}

function build(app, iosVersion, defs, done){
	if (typeof defs === 'function') {
		done = defs;
		defs = [];
	}

	ioslib.xcode.detect(function (err, env) {
		if (err) {
			return done(err);
		}

		var xc = null,
			ios;

		Object.keys(env.xcode).sort().reverse().some(function (ver) {
			return env.xcode[ver].sdks.some(function (sdk) {
				if (!iosVersion || appc.version.satisfies(sdk, iosVersion)) {
					xc = env.xcode[ver];
					iosVersion = sdk;
					return true;
				}
			});
		});

		if (xc === null) {
			return done(new Error('No selected Xcode'));
		}

		var args = [
			xc.executables.xcodebuild,
			'clean', 'build',
			'-configuration', 'Debug',
			'-scheme', app,
			'-destination', "platform='iOS Simulator',OS=" + appc.version.format(iosVersion, 2, 2) + ",name='iPhone 6'",
			'GCC_PREPROCESSOR_DEFINITIONS="' + defs.join(' ') + '"',
			'CONFIGURATION_BUILD_DIR="build/\\$(CONFIGURATION)\\$(EFFECTIVE_PLATFORM_NAME)"'
		];

		exec(args.join(' '), {
			cwd: path.join(__dirname, app)
		}, function (code, out, err) {
			if (code) {
				return done(new Error(out + '\n' + err));
			}
			should(out).match(/BUILD SUCCEEDED/);
			var appPath = path.join(__dirname, app, 'build', 'Debug-iphonesimulator', app + '.app');
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
			emitter.removeListener('log-file', watch);
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
	emitter.on('log-file', watch);
}

describe('simulator', function () {
	var simHandlesToWipe = [];
	var logger = process.env.DEBUG ? console.log : function () {};

	afterEach(function (done) {
		this.timeout(60000);
		this.slow(60000);
		async.eachSeries(simHandlesToWipe, function (simHandle, next) {
			if (simHandle && simHandle.simctl) {
				appc.subprocess.run(simHandle.simctl, ['erase', simHandle.udid], function () {
					next();
				});
			} else {
				next();
			}
		}, function () {
			simHandlesToWipe = [];
			setTimeout(function () {
				done();
			}, 1000);
		});
	});

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
			should(results).have.keys('simulators', 'issues');

			should(results.simulators).be.an.Object;
			should(results.simulators).have.keys('ios', 'watchos', 'devicePairs', 'crashDir');

			should(results.simulators.ios).be.an.Object;
			Object.keys(results.simulators.ios).forEach(function (ver) {
				checkSims(results.simulators.ios[ver]);
			});

			should(results.simulators.watchos).be.an.Object;
			Object.keys(results.simulators.watchos).forEach(function (ver) {
				checkSims(results.simulators.watchos[ver]);
			});

			should(results.simulators.devicePairs).be.an.Object;
			Object.keys(results.simulators.devicePairs).forEach(function (udid) {
				should(results.simulators.devicePairs[udid]).be.an.Object;
				should(results.simulators.devicePairs[udid]).have.keys('phone', 'watch');
				should(results.simulators.devicePairs[udid].phone).be.a.String;
				should(results.simulators.devicePairs[udid].phone).not.equal('');
				should(results.simulators.devicePairs[udid].watch).be.a.String;
				should(results.simulators.devicePairs[udid].watch).not.equal('');
			});

			should(results.simulators.crashDir).be.a.String;
			should(results.simulators.crashDir).not.equal('');
			if (fs.existsSync(results.simulators.crashDir)) {
				should(fs.statSync(results.simulators.crashDir).isDirectory()).be.true;
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

	/*

		IMPORTANT!

		The findSimulator() tests REQUIRE that Xcode 6.4 and 7.0 are installed and that
		Xcode 6.4 is the selected version.

	*/

	it('fail with bad iOS Sim UDID', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: 'foo',
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err.message).equal('Unable to find an iOS Simulator with the UDID "foo".');
			done();
		});
	});

	it('iOS 9.0 Sim + bad Watch Sim UDID + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: '79D1EC85-352F-4D63-B92F-C397345934A6',
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('79D1EC85-352F-4D63-B92F-C397345934A6');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	it('fail with good iOS 9.0 Sim UDID + bad Watch Sim UDID + watch app', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: '79D1EC85-352F-4D63-B92F-C397345934A6',
			watchAppBeingInstalled: true,
			watchHandleOrUDID: 'bar'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err.message).equal('Unable to find a Watch Simulator with the UDID "bar".');
			done();
		});
	});

	it('iOS 8.4 Sim + Watch 1.0 Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: 'AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C',
			watchAppBeingInstalled: false,
			watchHandleOrUDID: 'D5C1DA2F-7A74-49C8-809A-906E554021B0'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('iOS 8.4 Sim is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: 'AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C',
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('iOS 8.4 Sim + Watch 1.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: 'AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C',
			watchAppBeingInstalled: true,
			watchHandleOrUDID: 'D5C1DA2F-7A74-49C8-809A-906E554021B0'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal('D5C1DA2F-7A74-49C8-809A-906E554021B0');
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('iOS 8.4 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: 'AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C',
			watchAppBeingInstalled: true
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal('D5C1DA2F-7A74-49C8-809A-906E554021B0');
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('iOS 8.4 Sim + Watch 2.0 Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: 'AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C',
			watchAppBeingInstalled: true,
			watchHandleOrUDID: '68572BC8-791C-4F45-95E1-E317D6CC210B'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err).be.instanceof(Error);
			should(err.message).equal('Specified Watch Simulator "68572BC8-791C-4F45-95E1-E317D6CC210B" is not compatible with iOS Simulator "AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C".');
			done();
		});
	});

	it('iOS 9.0 Sim + Watch 2.0 Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: '79D1EC85-352F-4D63-B92F-C397345934A6',
			watchAppBeingInstalled: false,
			watchHandleOrUDID: '68572BC8-791C-4F45-95E1-E317D6CC210B'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('79D1EC85-352F-4D63-B92F-C397345934A6');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	it('iOS 9.0 Sim is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: '79D1EC85-352F-4D63-B92F-C397345934A6',
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('79D1EC85-352F-4D63-B92F-C397345934A6');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	it('iOS 9.0 Sim + Watch 2.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: '79D1EC85-352F-4D63-B92F-C397345934A6',
			watchAppBeingInstalled: true,
			watchHandleOrUDID: '68572BC8-791C-4F45-95E1-E317D6CC210B'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('79D1EC85-352F-4D63-B92F-C397345934A6');
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal('68572BC8-791C-4F45-95E1-E317D6CC210B');
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	it('iOS 9.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: '79D1EC85-352F-4D63-B92F-C397345934A6',
			watchAppBeingInstalled: true
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('79D1EC85-352F-4D63-B92F-C397345934A6');
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal('68572BC8-791C-4F45-95E1-E317D6CC210B');
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	it('iOS 9.0 Sim + Watch 1.0 Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: '79D1EC85-352F-4D63-B92F-C397345934A6',
			watchAppBeingInstalled: true,
			watchHandleOrUDID: 'D5C1DA2F-7A74-49C8-809A-906E554021B0'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err).be.instanceof(Error);
			should(err.message).equal('Specified Watch Simulator "D5C1DA2F-7A74-49C8-809A-906E554021B0" is not compatible with iOS Simulator "79D1EC85-352F-4D63-B92F-C397345934A6".');
			done();
		});
	});

	it('no iOS Sim + Watch 1.0 Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			watchAppBeingInstalled: false,
			watchHandleOrUDID: 'D5C1DA2F-7A74-49C8-809A-906E554021B0'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('no iOS Sim + no Watch Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('no iOS Sim + app + no Watch Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('no iOS Sim + app + Watch 1.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: 'D5C1DA2F-7A74-49C8-809A-906E554021B0'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal('D5C1DA2F-7A74-49C8-809A-906E554021B0');
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('no iOS Sim + app + no Watch Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			watchAppBeingInstalled: true
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('AE9CBDC9-3ED6-4CEE-9723-7F415ED1DD4C');
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal('D5C1DA2F-7A74-49C8-809A-906E554021B0');
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	it('no iOS Sim + app + Watch 2.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: '68572BC8-791C-4F45-95E1-E317D6CC210B'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal('79D1EC85-352F-4D63-B92F-C397345934A6');
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal('68572BC8-791C-4F45-95E1-E317D6CC210B');
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	it('iPad Sim + Watch 2.0 Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			simHandleOrUDID: '5CC642EE-F31D-4EE3-9100-08AC3B132E9F',
			watchAppBeingInstalled: true,
			watchHandleOrUDID: '68572BC8-791C-4F45-95E1-E317D6CC210B'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err.message).equal('Specified Watch Simulator "68572BC8-791C-4F45-95E1-E317D6CC210B" is not compatible with iOS Simulator "5CC642EE-F31D-4EE3-9100-08AC3B132E9F".');
			done();
		});
	});

	it('iPad Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			simHandleOrUDID: '5CC642EE-F31D-4EE3-9100-08AC3B132E9F',
			watchAppBeingInstalled: true
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err.message).equal('Specified iOS Simulator "5CC642EE-F31D-4EE3-9100-08AC3B132E9F" does not support watch apps.');
			done();
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should launch the default simulator and stop it', function (done) {
		this.timeout(60000);
		this.slow(60000);

		ioslib.simulator.launch('79D1EC85-352F-4D63-B92F-C397345934A6', null, function (err, simHandle, watchSimHandle) {
			simHandlesToWipe.push(simHandle, watchSimHandle);

			if (err) {
				return done(err);
			}

			appc.subprocess.run('ps', '-ef', function (code, out, err) {
				if (code) {
					return done(new Error('Failed to get process list: ' + code));
				}

				should(out.split('\n').filter(function (line) { return line.indexOf(simHandle.simulator) !== -1; })).not.length(0);

				ioslib.simulator.stop(simHandle, function () {
					done();
				});
			});
		}).on('log-debug', function (line, simHandle) {
			logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and log basic logs', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_BASIC_LOGGING'], function (err, appPath) {
			if (err !== null) {
				logger(err);
				should(err).equal(null);
			}
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var counter = 0,
				launched = false,
				started = false;

			ioslib.simulator.launch(null, {
				appPath: appPath,
				autoExit: true,
				hide: true
			}).on('log', function (line) {
				counter++;
			}).on('log-debug', function (line, simHandle) {
				logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
			}).on('launched', function (simHandle, watchSimHandle) {
				launched = true;
				simHandlesToWipe.push(simHandle, watchSimHandle);
			}).on('error', function (err) {
				done(err);
			}).on('app-started', function (simHandle) {
				started = true;
			}).on('app-quit', function (err) {
				should(err).not.be.ok;
				should(launched).be.ok;
				should(started).be.ok;
				should(counter).not.equal(0);
				done();
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and log ti mocha results', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_TIMOCHA'], function (err, appPath) {
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

			emitter.on('app-started', function (handle) {
				simHandle = handle;
				stop();
			}).on('log-debug', function (line, simHandle) {
				logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
			}).on('launched', function (simHandle, watchSimHandle) {
				simHandlesToWipe.push(simHandle, watchSimHandle);
			}).on('error', function (err) {
				done(err);
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
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_TIMOCHA_MULTIPLE_LINES'], function (err, appPath) {
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

			emitter.on('app-started', function (handle) {
				simHandle = handle;
				stop();
			}).on('log-debug', function (line, simHandle) {
				logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
			}).on('launched', function (simHandle, watchSimHandle) {
				simHandlesToWipe.push(simHandle, watchSimHandle);
			}).on('error', function (err) {
				done(err);
			});

			timochaLogWatcher(emitter, function (err, results) {
				should(err).not.be.ok;
				should(results).be.an.Object;
				should(results).have.property('foo', 'bar');
				stop();
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and detect crash with Objective-C exception', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_OBJC_CRASH'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var simHandle;

			ioslib.simulator.launch(null, {
				appPath: appPath,
				hide: true
			}).on('app-started', function (handle) {
				simHandle = handle;
			}).on('log-debug', function (line, simHandle) {
				logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
			}).on('launched', function (simHandle, watchSimHandle) {
				simHandlesToWipe.push(simHandle, watchSimHandle);
			}).on('error', function (err) {
				done(err);
			}).on('app-quit', function (crash) {
				// stop the simulator before we start throwing exceptions
				ioslib.simulator.stop(simHandle, function () {
					try {
						should(crash).be.an.instanceOf(ioslib.simulator.SimulatorCrash);
						should(crash.toString()).eql('SimulatorCrash: App crashed in the iOS Simulator');
						should(crash).have.property('crashFiles');
						should(crash.crashFiles).be.an.Array;
						crash.crashFiles.forEach(function (file) {
							should(fs.existsSync(file)).be.ok;
						});
					} finally {
						if (crash && Array.isArray(crash.crashFiles)) {
							crash.crashFiles.forEach(function (file) {
								fs.existsSync(file) && fs.unlinkSync(file);
							});
						}
					}

					done();
				});
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should be able to launch simulator and detect crash with C exception', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_C_CRASH'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			var simHandle;

			ioslib.simulator.launch(null, {
				appPath: appPath,
				hide: true
			}).on('app-started', function (handle) {
				simHandle = handle;
			}).on('launched', function (simHandle, watchSimHandle) {
				simHandlesToWipe.push(simHandle, watchSimHandle);
			}).on('log-debug', function (line, simHandle) {
				logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
			}).on('error', function (err) {
				done(err);
			}).on('app-quit', function (crash) {
				// stop the simulator before we start throwing exceptions
				ioslib.simulator.stop(simHandle, function () {
					try {
						should(crash).be.an.instanceOf(ioslib.simulator.SimulatorCrash);
						should(crash.toString()).eql('SimulatorCrash: App crashed in the iOS Simulator');

						should(crash).have.property('crashFiles');
						should(crash.crashFiles).be.an.Array;
						crash.crashFiles.forEach(function (file) {
							should(fs.existsSync(file)).be.ok;
						});
					} finally {
						if (crash && Array.isArray(crash.crashFiles)) {
							crash.crashFiles.forEach(function (file) {
								fs.existsSync(file) && fs.unlinkSync(file);
							});
						}
					}

					done();
				});
			});
		});
	});

	(process.env.TRAVIS ? it.skip : it)('should launch the default simulator and launch the watchOS 1 app', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestWatchApp', '>=8.2 <9.0', ['TEST_BASIC_LOGGING'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			ioslib.simulator.detect(function (err, simInfo) {
				var ver = Object.keys(simInfo.simulators.ios).filter(function (ver) { return appc.version.gte(ver, '8.2') && appc.version.lt(ver, '9.0'); }).sort().pop();
				if (!ver) {
					return done(new Error('iOS 8.2, 8.3, or 8.4 not installed'));
				}

				var udid = simInfo.simulators.ios[ver][simInfo.simulators.ios[ver].length - 1].udid;
				//udid = null; // just a test so that it picks one
				//udid = '79D1EC85-352F-4D63-B92F-C397345934A6';

				ioslib.simulator.launch(udid, {
					appPath: appPath,
					hide: true,
					// watchUDID: '58045222-F0C1-41F7-A4BD-E2EDCFBCF5B9', // 38mm WatchOS 1
					// watchUDID: '35597169-FF72-4634-86DD-E490CE84A310', // 38mm WatchOS 2 (this id is machine dependent)
					launchWatchApp: true
				}).on('log-debug', function (line, simHandle) {
					logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
				}).on('launched', function (simHandle, watchSimHandle) {
					simHandlesToWipe.push(simHandle, watchSimHandle);
				}).on('app-started', function (simHandle, watchSimHandle) {
					ioslib.simulator.stop(simHandle, function () {
						if (watchSimHandle) {
							ioslib.simulator.stop(watchSimHandle, function () {
								done();
							});
						} else {
							done();
						}
					});
				}).on('error', function (err) {
					done(err);
				});
			});
		});
	});


	(process.env.TRAVIS ? it.skip : it)('should launch the default simulator and launch the watchOS 2 app', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestWatchApp2', '9.x', ['TEST_BASIC_LOGGING'], function (err, appPath) {
			should(err).not.be.ok;
			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			ioslib.simulator.detect(function (err, simInfo) {
				var ver = Object.keys(simInfo.simulators.ios).filter(function (ver) { return appc.version.gte(ver, '9.0'); }).sort().pop();
				if (!ver) {
					return done(new Error('iOS 9 not installed'));
				}

				var udid = simInfo.simulators.ios[ver][simInfo.simulators.ios[ver].length - 1].udid;

				ioslib.simulator.launch(udid, {
					appPath: appPath,
					hide: true,
					launchWatchApp: true
				}).on('log-debug', function (line, simHandle) {
					logger((simHandle ? '[' + simHandle.family.toUpperCase() + '] ' : '') + '[DEBUG]', line);
				}).on('launched', function (simHandle, watchSimHandle) {
					simHandlesToWipe.push(simHandle, watchSimHandle);
				}).on('app-started', function (simHandle, watchSimHandle) {
					ioslib.simulator.stop(simHandle, function () {
						if (watchSimHandle) {
							ioslib.simulator.stop(watchSimHandle, function () {
								done();
							});
						} else {
							done();
						}
					});
				}).on('error', function (err) {
					done(err);
				});
			});
		});
	});

});