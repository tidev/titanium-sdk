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
	path = require('path'),

	// these will vary by machine
	xc6_ios84_iphone6 = 'F3A838A8-9109-4F8C-AAA3-21EB164D5377',
	xc6_watchos1_42mm = 'D5C1DA2F-7A74-49C8-809A-906E554021B0',
	xc7_ios9_iphone6  = 'FA9941AA-A14E-405D-A76F-1472C47CBFED',
	xc7_watchos2_42mm = 'EDD1754C-C0D2-47E2-8E9B-46934962F84B',
	xc7_ios9_ipadAir2 = 'B6CEDBA2-4E8A-4BE7-8E0E-2A5E2B679488';

function checkSims(sims) {
	should(sims).be.an.Array;
	sims.forEach(function (sim) {
		should(sim).be.an.Object;
		should(sim).have.keys('udid', 'name', 'version', 'type', 'deviceType', 'deviceName', 'deviceDir', 'model', 'family', 'supportsXcode', 'supportsWatch', 'watchCompanion', 'runtime', 'runtimeName', 'systemLog', 'dataDir');

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

		if (!xc.eulaAccepted) {
			return done(new Error('Xcode must be launched and the EULA must be accepted before the iOS app can be compiled.'));
		}

		var args = [
			xc.executables.xcodebuild,
			'clean', 'build',
			'-configuration', 'Debug',
			'-scheme', app,
			'-destination', "platform='iOS Simulator',OS=" + appc.version.format(iosVersion, 2, 2) + ",name='iPhone 6'",
			'-derivedDataPath', path.join(__dirname, app),
			'GCC_PREPROCESSOR_DEFINITIONS="' + defs.join(' ') + '"'
		];

		exec(args.join(' '), {
			cwd: path.join(__dirname, app)
		}, function (err, stdout, stderr) {
			if (err) {
				return done(stdout + '\n' + stderr);
			}
			should(stdout).match(/BUILD SUCCEEDED/);
			var appPath = path.join(__dirname, app, 'build', 'Products', 'Debug-iphonesimulator', app + '.app');
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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('fail with bad iOS Sim UDID', function (done) {
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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 9.0 Sim + bad Watch Sim UDID + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc7_ios9_iphone6,
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc7_ios9_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('fail with good iOS 9.0 Sim UDID + bad Watch Sim UDID + watch app', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc7_ios9_iphone6,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: 'bar'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err.message).equal('Unable to find a Watch Simulator with the UDID "bar".');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 8.4 Sim + Watch 1.0 Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc6_ios84_iphone6,
			watchAppBeingInstalled: false,
			watchHandleOrUDID: xc6_watchos1_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 8.4 Sim is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc6_ios84_iphone6,
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 8.4 Sim + Watch 1.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc6_ios84_iphone6,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: xc6_watchos1_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc6_watchos1_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 8.4 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc6_ios84_iphone6,
			watchAppBeingInstalled: true
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc6_watchos1_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 8.4 Sim + Watch 2.0 Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc6_ios84_iphone6,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: xc7_watchos2_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err).be.instanceof(Error);
			should(err.message).equal('Specified Watch Simulator "' + xc7_watchos2_42mm + '" is not compatible with iOS Simulator "' + xc6_ios84_iphone6 + '".');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 9.0 Sim + Watch 2.0 Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc7_ios9_iphone6,
			watchAppBeingInstalled: false,
			watchHandleOrUDID: xc7_watchos2_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc7_ios9_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 9.0 Sim is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc7_ios9_iphone6,
			watchAppBeingInstalled: false
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc7_ios9_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 9.0 Sim + Watch 2.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc7_ios9_iphone6,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: xc7_watchos2_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc7_ios9_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc7_watchos2_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 9.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc7_ios9_iphone6,
			watchAppBeingInstalled: true
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc7_ios9_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc7_watchos2_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iOS 9.0 Sim + Watch 1.0 Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			simHandleOrUDID: xc7_ios9_iphone6,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: xc6_watchos1_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err).be.instanceof(Error);
			should(err.message).equal('Specified Watch Simulator "' + xc6_watchos1_42mm + '" is not compatible with iOS Simulator "' + xc7_ios9_iphone6 + '".');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('no iOS Sim + Watch 1.0 Sim + no watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			watchAppBeingInstalled: false,
			watchHandleOrUDID: xc6_watchos1_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('no iOS Sim + no Watch Sim + no watch app is valid', function (done) {
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
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('no iOS Sim + app + no Watch Sim + no watch app is valid', function (done) {
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
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			assert(watchSimHandle === null);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('no iOS Sim + app + Watch 1.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: xc6_watchos1_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc6_watchos1_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('no iOS Sim + app + no Watch Sim + watch app is valid', function (done) {
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
			should(simHandle.udid).equal(xc6_ios84_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc6_watchos1_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('6.4');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('no iOS Sim + app + Watch 2.0 Sim + watch app is valid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: xc7_watchos2_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc7_ios9_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc7_watchos2_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iPad Sim + Watch 2.0 Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			simHandleOrUDID: xc7_ios9_ipadAir2,
			watchAppBeingInstalled: true,
			watchHandleOrUDID: xc7_watchos2_42mm
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err.message).equal('Specified Watch Simulator "' + xc7_watchos2_42mm + '" is not compatible with iOS Simulator "' + xc7_ios9_ipadAir2 + '".');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('iPad Sim + watch app is invalid', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled: true,
			simHandleOrUDID: xc7_ios9_ipadAir2,
			watchAppBeingInstalled: true
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			should(err).be.ok;
			should(err.message).equal('Specified iOS Simulator "' + xc7_ios9_ipadAir2 + '" does not support watch apps.');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('find a Xcode 7 iOS 9 iOS and Watch Sim', function (done) {
		this.timeout(5000);
		this.slow(2000);

		ioslib.simulator.findSimulators({
			logger: logger,
			appBeingInstalled:      true,
			simType:                'iphone',
			watchAppBeingInstalled: true,
			watchMinOSVersion:      '2.0'
		}, function (err, simHandle, watchSimHandle, selectedXcode, simInfo, xcodeInfo) {
			if (err) {
				return done(err);
			}

			should(simHandle).be.ok;
			should(simHandle.udid).equal(xc7_ios9_iphone6);
			should(watchSimHandle).be.ok;
			should(watchSimHandle.udid).equal(xc7_watchos2_42mm);
			should(selectedXcode).be.ok;
			should(selectedXcode.version).equal('7.0');
			done();
		});
	});

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should launch the default simulator and stop it', function (done) {
		this.timeout(60000);
		this.slow(60000);

		ioslib.simulator.launch(xc7_ios9_iphone6, null, function (err, simHandle, watchSimHandle) {
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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should be able to launch simulator and log basic logs', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_BASIC_LOGGING'], function (err, appPath) {
			if (err) {
				return done(err);
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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should be able to launch simulator and log ti mocha results', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_TIMOCHA'], function (err, appPath) {
			if (err) {
				return done(err);
			}

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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should be able to launch simulator and log ti mocha results with multiple lines', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_TIMOCHA_MULTIPLE_LINES'], function (err, appPath) {
			if (err) {
				return done(err);
			}

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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should be able to launch simulator and detect crash with Objective-C exception', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_OBJC_CRASH'], function (err, appPath) {
			if (err) {
				return done(err);
			}

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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should be able to launch simulator and detect crash with C exception', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestApp', null, ['TEST_C_CRASH'], function (err, appPath) {
			if (err) {
				return done(err);
			}

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

	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should launch the default simulator and launch the watchOS 1 app', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestWatchApp', '>=8.2 <9.0', ['TEST_BASIC_LOGGING'], function (err, appPath) {
			if (err) {
				return done(err);
			}

			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			ioslib.simulator.detect(function (err, simInfo) {
				ioslib.simulator.launch(xc6_ios84_iphone6, {
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


	(process.env.TRAVIS || process.env.JENKINS ? it.skip : it)('should launch the default simulator and launch the watchOS 2 app', function (done) {
		this.timeout(60000);
		this.slow(60000);

		build('TestWatchApp2', '9.x', ['TEST_BASIC_LOGGING'], function (err, appPath) {
			if (err) {
				return done(err);
			}

			should(appPath).be.a.String;
			should(fs.existsSync(appPath)).be.ok;

			ioslib.simulator.detect(function (err, simInfo) {
				ioslib.simulator.launch(xc7_ios9_iphone6, {
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
