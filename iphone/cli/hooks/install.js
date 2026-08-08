/*
 * install.js: Titanium iOS CLI install hook
 *
 * Installs and launches device builds via ioslib, which drives
 * `xcrun devicectl` (CoreDevice) under the hood.
 *
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * See the LICENSE file for more information.
 */

import appc from 'node-appc';
import async from 'async';
import ioslib from 'ioslib';

export const cliVersion = '>=3.2';

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

			ioslib.device.detect({ bypassCache: true }, function (err, results) {
				if (err) {
					return finished(err);
				}

				const targets = results.devices.filter(d => !builder.deviceId || builder.deviceId === 'all'
					|| d.udid === builder.deviceId || d.identifier === builder.deviceId);

				if (!targets.length) {
					logger.warn('No connected iOS devices found, skipping install');
					return finished();
				}

				const levels = logger.getLevels(),
					// strips the NSLog preamble ("2026-08-08 10:15:06.643 AppName[123:456] ..."),
					// same treatment as the simulator log file tail in run.js
					trimRE = new RegExp('^.*' + builder.tiapp.name + '\\[[^\\]]+\\]\\s*', 'g'), // eslint-disable-line security/detect-non-literal-regexp
					logLevelRE = new RegExp('^(\\[\\d+m)?\\[?(' + levels.join('|') + '|log|timestamp)\\]?\\s*(\\[\\d+m)?(.*)', 'i'), // eslint-disable-line security/detect-non-literal-regexp
					handles = {};
				let startLog = false,
					runningCount = 0;

				function quit(udid) {
					if (udid) {
						if (handles[udid]) {
							handles[udid].stop();
							delete handles[udid];
						}
						runningCount--;
					} else {
						Object.keys(handles).forEach(function (u) {
							handles[u].stop();
							delete handles[u];
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
					let lastLogger = 'debug',
						waitLogged = false;

					runningCount++;

					handles[device.udid] = ioslib.device
						.launch(device.udid, builder.tiapp.id)
						.on('launching', function () {
							logger.info(`Launching app on device: ${device.name.cyan}`);
						})
						.on('locked', function () {
							if (!waitLogged) {
								waitLogged = true;
								logger.info(`Device "${device.name.cyan}" is locked, the app will launch as soon as it is unlocked (press CTRL-C to quit)`);
							}
						})
						.on('log', function (line) {
							if (!startLog) {
								const startLogTxt = 'Start application log';
								logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
								startLog = true;
							}
							line = line.replace(trimRE, '');
							const m = line.match(logLevelRE);
							if (m) {
								lastLogger = m[2].toLowerCase();
								line = m[4].trim();
							}
							if (levels.indexOf(lastLogger) === -1) {
								logger.log(('[' + lastLogger.toUpperCase() + '] ').cyan + line);
							} else {
								logger[lastLogger](line);
							}
						})
						.on('app-quit', function () {
							quit(device.udid);
						})
						.on('error', function () {
							logger.warn(`Failed to launch app on "${device.name}"`);
							logger.log('Please manually launch the application'.magenta + '\n');
							quit(device.udid);
						});
				}

				// listen for ctrl-c
				process.on('SIGINT', function () {
					logger.log();
					quit();
				});

				async.eachSeries(targets, function (device, next) {
					logger.info(`Installing app on device: ${device.name.cyan}`);
					ioslib.device
						.install(device.udid, builder.xcodeAppDir)
						.on('installed', function () {
							logger.info(`App successfully installed on device: ${device.name.cyan}`);
							cli.emit('build.post.install', builder, function () {
								launchApp(device);
								next();
							});
						})
						.on('error', function (err) {
							next(new appc.exception(`Failed to install app on "${device.name}"`, err.message.split('\n')));
						});
				}, function (err) {
					if (!err) {
						logger.log('Streaming application log, press CTRL-C to quit'.magenta + '\n');
					}
					// the attached launch handles keep the process alive until
					// the app quits or the user hits ctrl-c, like the old log relay
					finished(err);
				});
			});
		}
	});
}
