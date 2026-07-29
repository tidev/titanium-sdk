/*
 * install.js: Titanium iOS CLI install hook
 *
 * Installs and launches device builds via `xcrun devicectl` (CoreDevice).
 * The legacy MobileDevice.framework path (ioslib/node-ios-device) is gone:
 * iOS 17+ devices connect exclusively through CoreDevice/RemoteXPC and are
 * invisible to the old API, even over USB.
 *
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * See the LICENSE file for more information.
 */

import appc from 'node-appc';
import async from 'async';
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const cliVersion = '>=3.2';

const EXEC_LIMIT = { maxBuffer: 10 * 1024 * 1024 };

function listDevices(callback) {
	const jsonFile = path.join(os.tmpdir(), `ti-devicectl-${process.pid}.json`);
	execFile('xcrun', [ 'devicectl', 'list', 'devices', '--json-output', jsonFile ], EXEC_LIMIT, function (err, stdout, stderr) {
		let devices = [];
		if (err) {
			return callback(new appc.exception('Failed to list devices via devicectl', (stderr || stdout || '').trim().split('\n')));
		}
		try {
			devices = JSON.parse(fs.readFileSync(jsonFile, 'utf8')).result.devices;
		} catch (e) {
			return callback(new appc.exception(`Failed to parse devicectl output: ${e.message}`));
		} finally {
			try {
				fs.unlinkSync(jsonFile);
			} catch (e) {
				// ignore
			}
		}
		callback(null, devices);
	});
}

function getLockState(deviceId, callback) {
	const jsonFile = path.join(os.tmpdir(), `ti-devicectl-lock-${process.pid}.json`);
	execFile('xcrun', [ 'devicectl', 'device', 'info', 'lockState', '--timeout', '20', '--device', deviceId, '--json-output', jsonFile ], EXEC_LIMIT, function (err) {
		let locked = null; // null = unknown, e.g. device unreachable
		if (!err) {
			try {
				locked = !!JSON.parse(fs.readFileSync(jsonFile, 'utf8')).result.passcodeRequired;
			} catch (e) {
				// leave unknown
			}
		}
		try {
			fs.unlinkSync(jsonFile);
		} catch (e) {
			// ignore
		}
		callback(locked);
	});
}

export function init(logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (builder, finished) {
			if (cli.argv.target !== 'device') {
				return finished();
			}

			if (cli.argv['build-only']) {
				logger.info('Performed build only, skipping installing of the application');
				return finished();
			}

			listDevices(function (err, deviceList) {
				if (err) {
					return finished(err);
				}

				// paired is enough: CoreDevice establishes the tunnel on demand,
				// even when the device currently reports tunnelState "disconnected"
				const targets = deviceList.filter(d => d.hardwareProperties
					&& d.hardwareProperties.reality === 'physical'
					&& d.hardwareProperties.platform === 'iOS'
					&& d.connectionProperties
					&& d.connectionProperties.pairingState === 'paired'
					&& (!builder.deviceId || builder.deviceId === 'all'
						|| d.hardwareProperties.udid === builder.deviceId
						|| d.identifier === builder.deviceId));

				if (!targets.length) {
					logger.warn('No connected iOS devices found, skipping install');
					return finished();
				}

				const levels = logger.getLevels(),
					logLevelRE = new RegExp('^(\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\\s*(\\[\\d+m)?(.*)', 'i'), // eslint-disable-line security/detect-non-literal-regexp
					children = {};
				let startLog = false,
					runningCount = 0;

				function quit(udid) {
					if (udid) {
						if (children[udid]) {
							children[udid].kill();
							delete children[udid];
						}
						runningCount--;
					} else {
						Object.keys(children).forEach(function (u) {
							children[u].kill();
							delete children[u];
						});
						runningCount = 0;
					}

					if (runningCount <= 0) {
						if (startLog) {
							const endLogTxt = 'End application log';
							logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
						}
						process.exit(0);
					}
				}

				function launchApp(device) {
					const name = device.deviceProperties.name;
					let waitLogged = false;

					runningCount++;

					function attempt() {
						let lastLogger = 'debug',
							remainder = '';

						logger.info(`Launching app on device: ${name.cyan}`);

						const child = spawn('xcrun', [
							'devicectl', 'device', 'process', 'launch',
							'--console', '--terminate-existing',
							'--device', device.identifier,
							builder.tiapp.id
						]);
						children[device.identifier] = child;

						function processLine(line) {
							if (!line.trim()) {
								return;
							}
							if (!startLog) {
								const startLogTxt = 'Start application log';
								logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
								startLog = true;
							}
							let m = line.match(logLevelRE);
							if (m) {
								lastLogger = m[2].toLowerCase();
								line = m[4].trim();
							}
							if (levels.indexOf(lastLogger) === -1) {
								logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + line);
							} else {
								logger[lastLogger](line);
							}
						}

						function onData(data) {
							const lines = (remainder + data.toString()).split('\n');
							remainder = lines.pop();
							lines.forEach(processLine);
						}

						child.stdout.on('data', onData);
						child.stderr.on('data', onData);

						child.on('exit', function (code) {
							delete children[device.identifier];

							if (code && !startLog) {
								// launch failed before any log output, check if the device is simply locked
								return getLockState(device.identifier, function (locked) {
									if (locked) {
										waitForUnlock();
									} else {
										logger.warn(`Failed to launch app on "${name}"`);
										logger.log('Please manually launch the application'.magenta + '\n');
										quit(device.identifier);
									}
								});
							}
							quit(device.identifier);
						});
					}

					function waitForUnlock() {
						if (!waitLogged) {
							waitLogged = true;
							logger.info(`Device "${name.cyan}" is locked, the app will launch as soon as it is unlocked (press CTRL-C to quit)`);
						}
						getLockState(device.identifier, function (locked) {
							if (locked === true) {
								setTimeout(waitForUnlock, 3000);
							} else {
								attempt();
							}
						});
					}

					// check the lock state first so we don't burn a guaranteed-to-fail launch attempt
					getLockState(device.identifier, function (locked) {
						if (locked === true) {
							waitForUnlock();
						} else {
							attempt();
						}
					});
				}

				// listen for ctrl-c
				process.on('SIGINT', function () {
					logger.log();
					quit();
				});

				async.eachSeries(targets, function (device, next) {
					const name = device.deviceProperties.name;
					logger.info(`Installing app on device: ${name.cyan}`);
					execFile('xcrun', [ 'devicectl', 'device', 'install', 'app', '--timeout', '90', '--device', device.identifier, builder.xcodeAppDir ], EXEC_LIMIT, function (err, stdout, stderr) {
						if (err) {
							return next(new appc.exception(`Failed to install app on "${name}"`, (stderr || stdout || '').trim().split('\n')));
						}
						logger.info(`App successfully installed on device: ${name.cyan}`);
						cli.emit('build.post.install', builder, function () {
							launchApp(device);
							next();
						});
					});
				}, function (err) {
					if (!err) {
						logger.log('Streaming application log, press CTRL-C to quit'.magenta + '\n');
					}
					// the attached console children keep the process alive until
					// the app quits or the user hits ctrl-c, like the old log relay
					finished(err);
				});
			});
		}
	});
}
