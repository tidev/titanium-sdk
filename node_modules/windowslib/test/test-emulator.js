/**
 * Tests windowslib's emulator module.
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	async = require('async'),
	fs = require('fs'),
	path = require('path'),
	windowslib = require('..');

describe('emulator', function () {
	it('namespace should be an object', function () {
		should(windowslib.emulator).be.an.Object;
	});

	it('detect Windows Phone emulators', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.emulator.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			should(results).be.an.Object;
			should(results).have.keys('emulators', 'issues');

			should(results.emulators).be.an.Object;
			Object.keys(results.emulators).forEach(function (ver) {
				should(results.emulators[ver]).be.an.Array;
				results.emulators[ver].forEach(function (emu) {
					should(emu).be.an.Object;
					should(emu).have.keys('name', 'udid', 'index', 'wpsdk');

					should(emu.name).be.a.String;
					should(emu.name).not.equal('');

					should(emu.index).be.an.Integer;

					should(emu.wpsdk).be.a.String;
					should(emu.wpsdk).not.equal('');
				});
			});

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

	it('detect if emulator is running', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.emulator.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			var wpsdk = Object.keys(results.emulators)[0],
				emu = results.emulators[wpsdk][0];

			windowslib.emulator.isRunning(emu.udid, function (err, running) {
				if (!err && running) {
					err = new Error('Expected the emulator to not be running');
				}
				done(err);
			});
		});
	});

	it('should shutdown specified emulator', function (done) {
		this.timeout(5000);
		this.slow(4000);

		windowslib.emulator.stop({
			name: 'Some emulator that does not exist'
		}, function () {
			done();
		});
	});

	it('launch and shutdown emulator', function (done) {
		this.timeout(120000);
		this.slow(110000);

		windowslib.emulator.detect(function (err, results) {
			if (err) {
				return done(err);
			}

			var wpsdk = Object.keys(results.emulators)[0],
				emu = results.emulators[wpsdk][0];

			windowslib.emulator.isRunning(emu.udid, function (err, running) {
				if (err) {
					return done(err);
				}

				if (running) {
					return done(new Error('Expected the emulator to not be running'));
				}

				windowslib.emulator.launch(null, { killIfRunning: true }, function (err, emuHandle) {
					if (err) {
						return done(err);
					}

					windowslib.emulator.isRunning(emuHandle.udid, function (err, running) {
						if (err) {
							return done(err);
						}

						if (!running) {
							return done(new Error('Expected the emulator to be running'));
						}

						windowslib.emulator.stop(emuHandle, function () {
							done();
						});
					});
				});
			});
		});
	});

	it('launch emulator, then install app via install, then shutdown emulator', function (done) {
		this.timeout(120000);
		this.slow(110000);

		var xapFile = path.join(__dirname, 'TestApp', 'Bin', 'Debug', 'TestApp_Debug_AnyCPU.xap'),
			wpsdk,
			emu,
			emuHandle;

		async.series([
			function (next) {
				windowslib.visualstudio.build({
					buildConfiguration: 'Debug',
					project: path.join(__dirname, 'TestApp', 'TestApp.csproj')
				}, function (err, result) {
					next(err);
				});
			},

			function (next) {
				should(fs.existsSync(xapFile)).be.ok;
				next();
			},

			function (next) {
				windowslib.emulator.detect(function (err, results) {
					if (!err) {
						wpsdk = Object.keys(results.emulators)[0];
						emu = results.emulators[wpsdk][0];
					}
					next(err);
				});
			},

			function (next) {
				windowslib.emulator.install(null, xapFile, { killIfRunning: true, wpsdk: wpsdk }, function (err, _emuHandle) {
					emuHandle = _emuHandle;
					next(err);
				});
			},

			function (next) {
				setTimeout(function () { next(); }, 1000);
			},

			function (next) {
				windowslib.emulator.isRunning(emuHandle.udid, function (err, running) {
					if (err) {
						next(err);
					} else if (!running) {
						next(new Error('Expected the emulator to be running'));
					} else {
						next();
					}
				});
			},

			function (next) {
				windowslib.emulator.stop(emuHandle, function () {
					done();
				});
			}
		], function (err) {
			done(err);
		});
	});

	it('launch emulator, then install app via launch, then shutdown emulator', function (done) {
		this.timeout(120000);
		this.slow(110000);

		var xapFile = path.join(__dirname, 'TestApp', 'Bin', 'Debug', 'TestApp_Debug_AnyCPU.xap'),
			wpsdk,
			emu,
			emuHandle;

		async.series([
			function (next) {
				windowslib.visualstudio.build({
					buildConfiguration: 'Debug',
					project: path.join(__dirname, 'TestApp', 'TestApp.csproj')
				}, function (err, result) {
					next(err);
				});
			},

			function (next) {
				should(fs.existsSync(xapFile)).be.ok;
				next();
			},

			function (next) {
				windowslib.emulator.detect(function (err, results) {
					if (!err) {
						wpsdk = Object.keys(results.emulators)[0];
						emu = results.emulators[wpsdk][0];
					}
					next(err);
				});
			},

			function (next) {
				windowslib.emulator.launch(null, { killIfRunning: true, wpsdk: wpsdk }, function (err, _emuHandle) {
					emuHandle = _emuHandle;
					next(err);
				});
			},

			function (next) {
				windowslib.emulator.isRunning(emuHandle.udid, function (err, running) {
					if (err) {
						next(err);
					} else if (!running) {
						next(new Error('Expected the emulator to be running'));
					} else {
						next();
					}
				});
			},

			function (next) {
				windowslib.emulator.launch(emuHandle.udid, { appPath: xapFile, killIfRunning: false, wpsdk: wpsdk }, function (err, _emuHandle) {
					next(err);
				});
			},

			function (next) {
				setTimeout(function () { next(); }, 1000);
			},

			function (next) {
				windowslib.emulator.isRunning(emuHandle.udid, function (err, running) {
					if (err) {
						next(err);
					} else if (!running) {
						next(new Error('Expected the emulator to be running'));
					} else {
						next();
					}
				});
			},

			function (next) {
				windowslib.emulator.stop(emuHandle, function () {
					done();
				});
			}
		], function (err) {
			done(err);
		});
	});
});
