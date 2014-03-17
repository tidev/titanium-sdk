/*
 * run.js: Titanium Mobile Web CLI run in Windows Phone 8 hook
 *
 * Copyright (c) 2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	dgram = require('dgram'),
	net = require('net'),
	path = require('path'),
	spawn = require('child_process').spawn,
	windows = require('titanium-sdk/lib/windows'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
	if (process.platform != 'win32') {
		return;
	}

	cli.addHook('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (builder.buildOnly || cli.argv.target != 'wp8') {
				return finished();
			}

			windows.detect(config, null, function (env) {
				var wpInfo = windows.getSelectedWindowsPhoneSDK(env);

				if (!wpInfo) {
					var validVersions = Object.keys(env.windowsphone).filter(function (v) { return env.windowsphone[v].supported; }).sort();
					if (validVersions.length) {
						logger.error(
							__('Unable to find a suitable Windows Phone SDK.') + '\n' +
							__('Manually select one of the following: %s', validVersions.join(', ')) + '\n' +
							'  titanium config windows.windowsphone.selectedVersion <version>\n'
						);
					} else {
						logger.error(
							__('Unable to find a suitable Windows Phone SDK.') + '\n' +
							__('You can install it from %s.', '__http://appcelerator.com/windowsphone__') + '\n'
						);
					}
					return finished(1);
				}

				if (builder.enableLogging && builder.logToken) {
					initLogProxy();
				}

				function makePipe(log) {
					return function (data) {
						data.toString().split(/\r\n|\n/).forEach(function (line) {
							line = line.trim();
							line.length && log(line);
						});
					};
				}

				var tiapp = builder.tiapp,
					buildType = cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug',
					cmd = wpInfo.xapDeployCmd,
					args = [
						'/installlaunch',
						path.resolve(builder.buildDir, '..', 'mobileweb-wp8', tiapp.id, 'Bin', buildType, tiapp.id + '_' + buildType + '_AnyCPU.xap'),
						'/targetdevice:' + cli.argv['device-id']
					];

				logger.info(__('Installing and launching the application'));
				logger.debug(__('Running: %s', (cmd + ' "' + args.join('" "') + '"').cyan));

				var child = spawn(cmd, args);
				child.stdout.on('data', makePipe(logger.trace));
				child.stderr.on('data', makePipe(logger.error));
				child.on('close', function (code) {
					if (code) {
						finished(code);
					} else {
						logger.info(__('Finished launching the application'));

						if (builder.enableLogging && builder.logToken) {
							logger.info(__('Waiting for app to connect to display log output...'));
						}

						finished();
					}
				});

				function initLogProxy() {
					var levels = logger.getLevels(),
						logLevelRE = /^(\u001b\[\d+m)?\[(.+)\]\s*(\u001b\[\d+m)?(.*)/i,
						logStarted = false,
						logEnded = false,

						timeout = config.get('mobileweb.log.timeout', 60000), // 1 minute
						timer = setTimeout(shutdown, timeout)

						multicastPort = ~~config.get('mobileweb.log.multicastPort', 8666),
						tcpPort = ~~config.get('mobileweb.log.tcpPort', 8666),

						multicastServer = dgram.createSocket('udp4'),
						multicastAddress = config.get('mobileweb.log.multicastMembership', '239.6.6.6'),

						tcpServer = net.createServer(function (conn) {
							if (logStarted) {
								// already logging
								conn.close();
								return;
							}

							// no need for the multicast server anymore
							multicastServer.close();
							multicastServer = null;

							clearTimeout(timer);

							var startLogTxt = __('Start application log');
							logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
							logStarted = true;

							var buffer = '',
								lastLogger = 'debug';

							conn.on('data', function (data) {
								buffer += data.toString();
								var lines = buffer.split('\n');
								buffer = lines.pop(); // keep the last line because it could be incomplete
								for (var i = 0, len = lines.length; i < len; i++) {
									line = lines[i];
									if (line) {
										var m = line.match(logLevelRE);
										if (m) {
											lastLogger = m[2].toLowerCase();
											if (levels.indexOf(lastLogger) == -1) {
												logger.log(line.grey);
											} else {
												logger[lastLogger](m[4].trim());
											}
										} else {
											logger[lastLogger](line);
										}
									}
								}
							});

							conn.on('close', shutdown);

							conn.on('error', function () {});
						});

					function shutdown() {
						if (multicastServer) {
							multicastServer.close();
							multicastServer = null;
						}
						if (tcpServer) {
							tcpServer.close();
							tcpServer = null;
						}

						if (logStarted && !logEnded) {
							var endLogTxt = __('End application log');
							logger.log(('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey);
							logEnded = true;
						}
					}

					multicastServer.on('error', shutdown);

					multicastServer.on('message', function (msg, rinfo) {
						if (msg.toString().trim() == 'TI_WP8_LOGGER') {
							var message = new Buffer(builder.logToken + ':' + multicastPort);
							multicastServer.send(message, 0, message.length, rinfo.port, rinfo.address);
						}
					});

					multicastServer.bind(multicastPort, function () {
						multicastServer.addMembership(multicastAddress);
						var address = multicastServer.address();
						logger.debug(__('Log proxy beacon listening on UDP port %s', address.port));
					});

					tcpServer.on('error', shutdown);

					tcpServer.listen(tcpPort, function () {
						logger.debug(__('Log proxy listening on TCP port %s', tcpServer.address().port));
					});

					// listen for ctrl-c
					process.on('SIGINT', function () {
						if (!logEnded) {
							var endLogTxt = __('End application log');
							logger.log('\r' + ('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
						}
						process.exit(0);
					});
				}
			});
		}
	});
};