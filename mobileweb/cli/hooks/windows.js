/**
 * Adds support for Windows Hybrid apps on top of Titanium Mobile Web.
 *
 * @copyright
 * Copyright (c) 2013-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	crypto = require('crypto'),
	ejs = require('ejs'),
	fields = require('fields'),
	fs = require('fs'),
	os = require('os'),
	path = require('path'),
	spawn = require('child_process').spawn,
	uuid = require('node-uuid'),
	windowslib = require('windowslib'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.2.1';

exports.init = function (logger, config, cli) {
	if (process.platform !== 'win32' || (cli.argv['p'] || cli.argv['platform']) !== 'mobileweb') {
		return;
	}

	var packageJson = appc.pkginfo.package(module),
		windowslibOptions = {
			powershell:                       config.get('windows.executables.powershell'),
			pvk2pfx:                          config.get('windows.executables.pvk2pfx'),
			preferredWindowsPhoneSDK:         config.get('windows.wpsdk.selectedVersion'),
			preferredVisualStudio:            config.get('windows.visualstudio.selectedVersion'),
			supportedMSBuildVersions:         packageJson.vendorDependencies['msbuild'],
			supportedVisualStudioVersions:    packageJson.vendorDependencies['visual studio'],
			supportedWindowsPhoneSDKVersions: packageJson.vendorDependencies['windows phone sdk'],
			tasklist:                         config.get('windows.executables.tasklist')
		},
		targetWPSDK,
		deviceCache,
		windowsInfo,
		targetDevice,
		emuHandle,
		emuInstall,
		logRelay,
		appVersion;

	function assertTargetWPSDK() {
		if (targetWPSDK) return;

		// determine the target Windows Phone SDK version
		var availableSDKs = windowsInfo.windowsphone && Object.keys(windowsInfo.windowsphone).sort().reverse().filter(function (v) { return windowsInfo.windowsphone[v].supported; }),
			targetSDK = cli.tiapp['windows-phone'] && cli.tiapp['windows-phone']['target-sdk'];

		if (!availableSDKs.length) {
			logger.error(__('Unable to find any supported Windows Phone devices or emulators'));
			logger.error(__('Run "ti info" for more info.') + '\n');
			process.exit(1);
		}

		// make sure the target sdk is good
		if (targetSDK && availableSDKs.indexOf(targetSDK) === -1) {
			logger.error(__('Invalid Windows Phone Target SDK "%s"', targetSDK) + '\n');
			logger.log(__('Available Target SDKs:'));
			availableSDKs.forEach(function (ver) {
				logger.log('   ' + String(ver).cyan);
			});
			logger.log();
			process.exit(1);
		}

		// auto select the oldest, most compatible (in theory) version
		if (!targetSDK) {
			targetSDK = availableSDKs.shift();
		}

		return targetWPSDK = targetSDK;
	}

	function getTargetDevices() {
		if (deviceCache) {
			return deviceCache;
		}

		assertTargetWPSDK();

		var devices = Array.isArray(windowsInfo.devices) ? windowsInfo.devices.map(function (x) { x.type = 'device'; return x; }) : [],
			emulators = windowsInfo.emulators && Array.isArray(windowsInfo.emulators[targetWPSDK]) ? windowsInfo.emulators[targetWPSDK].map(function (x) { x.type = 'emulator'; return x; }) : [];

		return deviceCache = devices.concat(emulators);
	}

	// hook into the config and add the --device-id and --wp-publisher-guid
	cli.on('build.mobileweb.config', function (data, callback) {
		var conf = data.args[0];

		// add 'wp8' and 'winstore' to the targets
		windowslib.detect(windowslibOptions, function (err, wi) {
			windowsInfo = wi;
			if (err) {
				callback(err);
				return;
			}

			if (wi.visualstudio && Object.keys(wi.visualstudio).some(function (ver) { return wi.visualstudio[ver].supported; })) {
				if (wi.windowsphone && Object.keys(wi.windowsphone).some(function (ver) { return wi.windowsphone[ver].supported; })) {
					this.targets.push('wp8');
				}
				if (wi.powershell.enabled) {
					this.targets.push('winstore');
				}
			}

			// add the --device-id option stub... the rest will be filled in IF building for a
			if (!conf.options['device-id']) {
				conf.options['device-id'] = {
					abbr: 'C',
					desc: __('the device or emulator udid to launch the app on'),
					hint: 'udid',
					order: 130
				};
			};

			// add the --wp-publisher-guid option
			conf.options['wp-publisher-guid'] = {
				default: config.get('windows.phone.publisherGuid'),
				desc: __('your publisher GUID, obtained from %s', 'http://appcelerator.com/windowsphone'.cyan),
				hint: __('guid'),
				order: 120,
				prompt: function (callback) {
					callback(fields.text({
						promptLabel: __('What is your __Windows Phone Publisher GUID__?'),
						validate: conf.options['wp-publisher-guid'].validate
					}));
				},
				validate: function (value, callback) {
					if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
						return callback(new Error(__('Invalid "--wp-publisher-guid" value "%s"', value)));
					}
					callback(null, value);
				}
			};

			function assertIssue(issues, name, exit) {
				var i = 0,
					len = issues.length;
				for (; i < len; i++) {
					if ((typeof name === 'string' && issues[i].id === name) || (name && typeof name === 'object' && name.test(issues[i].id))) {
						logger.banner();
						issues[i].message.split('\n').forEach(function (line) {
							logger.error(line.replace(/(__(.+?)__)/g, '$2'.bold));
						});
						logger.log();
						exit && process.exit(1);
					}
				}
			}

			// wire up the --target callback handler
			var oldTargetCallback = conf.options.target.callback;

			conf.options.target.callback = function (value) {
				// if --target already has a callback, then we need to fire the original first
				if (typeof oldTargetCallback === 'function') {
					var tmp = oldTargetCallback(value);
					// if the original callback returned a non-undefined value, then the value
					// was changed and that's what we'll use
					if (tmp !== void 0) {
						value = tmp;
					}
				}

				// make sure we have a sane environment for the specified target
				if (value === 'wp8' || value === 'winstore') {
					assertIssue(windowsInfo.issues, 'WINDOWS_VISUAL_STUDIO_NOT_INSTALLED', true);
					assertIssue(windowsInfo.issues, 'WINDOWS_MSBUILD_ERROR', true);
					assertIssue(windowsInfo.issues, 'WINDOWS_MSBUILD_TOO_OLD', true);

					// wire up the --device-id handlers
					conf.options['device-id'].prompt = function (callback) {
						var devices = getTargetDevices(),
							maxLen = devices.reduce(function (a, b) { return Math.max(a, b.name.length); }, 0);

						if (!devices.length) {
							cli.argv['build-only'] = true;
							return callback();
						}

						callback(fields.select({
							title: __("Which device or emulator do you want to install your app on?"),
							promptLabel: __('Select by number or name'),
							default: devices.length && devices[0].name,
							formatters: {
								option: function (opt, idx, num) {
									return '  ' + num + appc.string.rpad(opt.name, maxLen).cyan + '  ' + __('(udid: %s)', opt.udid).grey;
								}
							},
							margin: '',
							numbered: true,
							relistOnError: true,
							complete: ['name', 'udid'],
							completeIgnoreCase: true,
							ignoreCase: true,
							suggest: false,
							optionLabel: 'name',
							optionValue: 'udid',
							options: devices,
							validate: conf.options['device-id'].validate
						}));
					};

					conf.options['device-id'].validate = function (value, callback) {
						if (!value && value !== 0) {
							return callback(new Error(__('Invalid device id')));
						}

						var devices = getTargetDevices();

						if (value === 'xd') {
							// pick first emulator
							var emu = devices.filter(function (x) { return x.type === 'emulator'; })[0];
							if (emu) {
								return callback(null, emu.udid);
							}
						}

						if (value === 'de') {
							// pick first device
							var dev = devices.filter(function (x) { return x.type === 'device'; })[0];
							if (dev) {
								return callback(null, dev.udid);
							}
						}

						var dev;

						if (!devices.some(function (d) {
							if (d.udid == value || d.name === value) {
								dev = d;
								value = d.udid;
								return true;
							}
							return false;
						})) {
							return callback(new Error(__('Invalid device id: %s', value)));
						}

						// check the device
						if (dev.type === 'device') {
							// try connecting to the device to detect no device or more than 1 device
							windowslib.device.connect(dev.udid, windowslibOptions)
								.on('connected', function () {
									callback(null, value);
								})
								.on('error', function (err) {
									logger.log();
									logger.error(err.message || err.toString());
									logger.log();
									process.exit(1);
								});
						} else {
							// must be emulator then
							callback(null, value);
						}
					};

					conf.options['device-id'].verifyIfRequired = function (callback) {
						callback(!cli.argv['build-only']);
					};
				}

				if (value === 'wp8') {
					assertIssue(windowsInfo.issues, 'WINDOWS_PHONE_SDK_NOT_INSTALLED', true);
					assertIssue(windowsInfo.issues, 'WINDOWS_PHONE_SDK_MISSING_DEPLOY_CMD', true);
					assertIssue(windowsInfo.issues, 'WINDOWS_PHONE_ENUMERATE_DEVICES_FAILED', true);

					conf.options['wp-publisher-guid'].required = true;
					conf.options['device-id'].required = true;
				}

				if (value === 'winstore') {
					assertIssue(windowsInfo.issues, 'WINDOWS_STORE_APPS_NOT_SUPPORTED', true);
					assertIssue(windowsInfo.issues, 'WINDOWS_POWERSHELL_SCRIPTS_DISABLED', true);
				}

				return value;
			};

			callback();
		}.bind(this));
	});

	// launch the Windows Phone emulator, create the log relay and start it
	cli.on('build.pre.compile', function (builder, finished) {
		var includeInternalIPAddresses = true;

		if (builder.target === 'wp8') {
			if (builder.buildOnly) {
				// if build only, then we need to manually make sure there's a selected target Windows Phone SDK
				assertTargetWPSDK();
			} else {
				targetDevice = getTargetDevices().filter(function (d) { return d.udid === cli.argv['device-id']; })[0];
				if (!targetDevice) {
					// this should never happen
					return finished(__('Invalid device id: %s', cli.argv['device-id']));
				}

				includeInternalIPAddresses = targetDevice.type !== 'device';

				if (targetDevice.type === 'emulator') {
					// start the emulator now while we finish building
					logger.info(__('Launching the Windows Phone emulator'));

					windowslib.emulator.launch(targetDevice.udid, appc.util.mix({
						killIfRunning: false
					}, windowslibOptions), function (err, _emuHandle) {
						emuHandle = _emuHandle;

						logger.info(__('Windows Phone emulator is ready'));

						// unblock the install if necessary
						if (typeof emuInstall === 'function') {
							setTimeout(function () {
								emuInstall();
							}, 1000);
						}
					});
				}
			}
		}

		if (builder.target === 'wp8' && !builder.buildOnly && builder.enableLogging) {
			// create the log relay instance so we can get a token to embed in our app
			var session = appc.auth.status(),
				userToken = session.loggedIn && session.email || uuid.v4(),
				appToken = builder.tiapp.id,
				machineToken = os.hostname(),
				deviceToken = cli.argv['device-id'],
				targetToken = builder.target,
				levels = logger.getLevels(),
				logLevelRE = /^(\u001b\[\d+m)?\[(.+)\]\s*(\u001b\[\d+m)?(.*)/i,
				lastLogger = 'debug';

			logRelay = new windowslib.LogRelay({
				includeInternalIPAddresses: includeInternalIPAddresses,
				serverToken: crypto.createHash('md5').update(userToken + '/' + appToken + '/' + machineToken + '/' + targetToken + '/' + deviceToken).digest('hex'),
				tcpPort: config.get('windows.log.tcpPort', config.get('mobileweb.log.tcpPort'))
			});

			logRelay.on('message', function (msg) {
				var m = msg.match(logLevelRE);
				if (m) {
					lastLogger = m[2].toLowerCase();
					if (levels.indexOf(lastLogger) == -1) {
						logger.log(msg.grey);
					} else {
						logger[lastLogger](m[4].trim());
					}
				} else {
					(logger[lastLogger] || logger.info)(msg);
				}
			});

			logRelay.on('log-debug', function (msg) {
				logger.debug(msg);
			});

			logRelay.on('started', function () {
				finished();
			});

			logRelay.start();
		} else {
			finished();
		}
	});

	// create Windows Phone specific icons
	cli.on('build.mobileweb.createIcons', function (builder, callback) {
		if (builder.target !== 'wp8' && builder.target !== 'winstore') return callback();

		logger.info(__('Creating favicon'));

		var buildDir = builder.buildDir,
			iconFilename = /\.(png|jpg|gif)$/.test(builder.tiapp.icon) ? builder.tiapp.icon : 'appicon.png',
			file = path.join(builder.projectResDir, 'mobileweb', iconFilename),
			resizeImages = [];

		if (!fs.existsSync(file)) {
			// try in the root
			file = path.join(builder.projectResDir, iconFilename);
		}

		// if they don't have a appicon, copy it from the sdk
		if (!fs.existsSync(file)) {
			file = path.join(builder.platformPath, 'templates', 'app', 'default', 'Resources', 'mobileweb', 'appicon.png');
		}

		// copy the appicon.png
		appc.fs.copyFileSync(file, buildDir, { logger: logger.debug });

		function copyIcon(filename, width, height) {
			var file = path.join(builder.projectResDir, 'mobileweb', filename);
			if (!fs.existsSync(file)) {
				file = path.join(builder.projectResDir, filename);
			}
			if (fs.existsSync(file)) {
				appc.fs.copyFileSync(file, buildDir, { logger: logger.debug });
			} else {
				resizeImages.push({
					file: path.join(buildDir, filename).replace(/\.ico$/, '.png'),
					width: width,
					height: height
				});
			}
		}

		copyIcon('favicon.png', 16, 16);

		// if there are no images to resize, just return
		if (!resizeImages.length) return callback();

		appc.image.resize(file, resizeImages, function (err, stdout, stderr) {
			if (err) {
				logger.error(__('Failed to create icons'));
				stdout && stdout.toString().split('\n').forEach(function (line) {
					line && logger.error(line.replace(/^\[ERROR\]/i, '').trim());
				});
				stderr && stderr.toString().split('\n').forEach(function (line) {
					line && logger.error(line.replace(/^\[ERROR\]/i, '').trim());
				});
				logger.log('');
				process.exit(1);
			}

			// rename the favicon
			fs.renameSync(path.join(buildDir, 'favicon.png'), path.join(buildDir, 'favicon.ico'));

			callback();
		}, logger);
	});

	// add Windows Hybrid related settings to the config.js template
	cli.on('build.mobileweb.assembleConfigTemplate', {
		pre: function (data, callback) {
			if (this.target === 'wp8' || this.target === 'winstore') {
				var options = data.args[1];
				options.tiAnalyticsPlatformName = 'windows';
				options.tiOsName = 'mobileweb';
				options.tiPlatformName = 'Windows Hybrid';
			}
			callback();
		}
	});

	// add the Windows Phone/Store specific shims
	cli.on('build.mobileweb.assemblePlatformImplementation', {
		pre: function (data, callback) {
			if (this.target === 'wp8' || this.target === 'winstore') {
				data.args[0] += fs.readFileSync(path.join(this.platformPath, 'src', this.target + '.js')).toString() + '\n';
			}
			callback();
		}
	});

	// after the mobile web project is built, copy output, create Visual Studio project, generate certs, copy icons, build Visual Studio project
	cli.on('build.post.compile', {
		priority: 8000,
		post: function (builder, finished) {
			var target = builder.target,
				tiapp = builder.tiapp,
				displayName = target === 'wp8' ? __('Windows Phone') : __('Windows Store'),
				certificateFile = path.join(builder.projectDir, tiapp.name + '_WindowsCodeSigningCert.pfx');

			if (!builder.buildOnly && (target === 'wp8' || target === 'winstore')) {
				var delta = appc.time.prettyDiff(cli.startTime, Date.now());
				logger.info(__('Finished building the application in %s', delta.cyan));
			}

			if (target !== 'winstore' && target !== 'wp8') {
				return finished();
			}

			logger.info(__('Bundling Mobile Web app as a standalone %s app', displayName));

			var vsInfo = windowsInfo.selectedVisualStudio;
			if (!vsInfo) {
				var validVersions = Object.keys(windowsInfo.visualstudio).filter(function (v) { return windowsInfo.visualstudio[v].supported; }).sort();
				if (validVersions.length) {
					logger.error(
						__('Unable to find a suitable version of Microsoft Visual Studio.') + '\n' +
						__('Manually select one of the following: %s', validVersions.join(', ')) + '\n' +
						'  titanium config windows.visualstudio.selectedVersion <version>\n'
					);
				} else {
					logger.error(
						__('Unable to find a suitable version of Microsoft Visual Studio.') + '\n' +
						__('You can install it from %s.', '__http://appcelerator.com/visualstudio__') + '\n'
					);
				}
				return finished(1);
			}

			// check if the certificate has been generated yet or not
			var generateWinstoreCert = target === 'winstore' && !fs.existsSync(certificateFile);

			async.series([
				function (next) {
					if (!generateWinstoreCert) return next();

					// Create the certificate and install it in the root trusted certificates
					logger.info(__('No code signing certificate for Windows Store applications was found, creating and installing one now.'));
					logger.info(__("The certificate will be installed in the local machine's Trusted Root Certificate Authorities certificate store."));
					logger.info(__('When prompted for a password, leave everything blank.'));

					windowslib.certs.create(tiapp.id, certificateFile, windowslibOptions, next);
				},

				function (next) {
					var source = path.resolve(builder.buildDir),
						destination = path.resolve(source, '..', 'mobileweb-' + target),
						version = tiapp.version,
						templateData = {
							// general
							projectName: tiapp.id,
							projectDisplayName: tiapp.name,
							projectGUID: tiapp.guid || uuid.v4(),
							projectDescription: tiapp.description || 'No description',
							author: tiapp.publisher || config.get('user.name') || 'Titanium',
							appFiles: [],

							// windows phone specific
							assemblyGUID: uuid.v4(),
							company: 'not specified', // Hopefully we can support this some day
							copyright: tiapp.copyright || ('Copyright © ' + new Date().getFullYear()),
							ipAddressList: logRelay && logRelay.ipAddressList.join(',') || '',
							logConnectionTimeout: config.get('windows.log.connectionTimeout', 2000),
							publisherGUID: cli.argv['wp-publisher-guid'],
							serverToken: logRelay && logRelay.serverToken || '',
							targetSDK: targetWPSDK,
							targetFrameworkVersion: targetWPSDK ? 'v' + targetWPSDK : '',
							tcpPort: logRelay && logRelay.tcpPort || '',

							// windows store specific
							visualStudioVersion: windowsInfo.visualStudioVersion,
							certificatePath: certificateFile
						},
						templateDir = path.join(__dirname, '..', '..', 'templates', 'packages', target),
						filenameReplacementRegex = /\{\{ProjectName\}\}/g,
						templateFiles,
						appFiles = templateData.appFiles,
						versionFormatRegex = /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/;

					if (target == 'wp8') {
						templateFiles = [
							'{{ProjectName}}.sln',
							path.join('{{ProjectName}}', '{{ProjectName}}.csproj'),
							path.join('{{ProjectName}}', 'titanium_settings.ini'),
							path.join('{{ProjectName}}', 'Resources', 'AppResources.Designer.cs'),
							path.join('{{ProjectName}}', 'Properties', 'AssemblyInfo.cs'),
							path.join('{{ProjectName}}', 'Properties', 'WMAppManifest.xml')
						];
					} else {
						templateFiles = [
							'{{ProjectName}}.sln',
							path.join('{{ProjectName}}', '{{ProjectName}}.jsproj'),
							path.join('{{ProjectName}}', 'package.appxmanifest')
						];
					}

					// validate and format the version to Major.Minor.Build.Revision format necessary for MS build systems
					if (!version) {
						version = '0.1.0.0';
					} else if (!versionFormatRegex.test(version)) {
						version = version.match(/^[0-9]+(\.[0-9]+)*/);
						if (!version) {
							logger.warn(__('Invalid project version number %s, setting to 0.1.0.0', tiapp.version));
							version = '0.1.0.0';
						} else {
							version = version[0];
							while (!versionFormatRegex.test(version)) {
								version = version + '.0';
							}
							logger.info(__('Project version number will be converted to %s for compatibility with Visual Studio', version));
						}
					}
					templateData.projectVersion = version;
					appVersion = version;

					// Create the destination folder if it doesn't exist
					if (!fs.existsSync(destination)) {
						wrench.mkdirSyncRecursive(destination);
					}

					// Copy the built app over
					logger.info(__('Copying Mobile Web output to the Visual Studio project'));
					wrench.mkdirSyncRecursive(path.join(destination, templateData.projectName, 'App'));
					wrench.readdirSyncRecursive(source).forEach(function (file) {
						var sourcePath = path.join(source, file),
							destinationPath = path.join(destination, templateData.projectName, 'App', file),
							fileStats = fs.statSync(sourcePath);
						if (fileStats.isDirectory()) {
							logger.debug(__('Creating directory %s', destinationPath.cyan));
							wrench.mkdirSyncRecursive(destinationPath);
						} else if (fileStats.size === 0) {
							logger.warn(__('%s is empty and will not be copied over', sourcePath.cyan));
						} else {
							logger.debug(__('Copying file %s => %s', sourcePath.cyan, destinationPath.cyan));
							fs.writeFileSync(destinationPath, fs.readFileSync(sourcePath));

							// Store the file for inclusion in the csproj file.
							appFiles.push(path.join('App', file));
						}
					});

					// Copy the template files over
					logger.info(__('Generating %s Visual Studio project', displayName));
					wrench.readdirSyncRecursive(templateDir).forEach(function (file) {
						var sourcePath = path.join(templateDir, file),
							sourceData,
							destinationPath = path.join(destination,
								file.replace(filenameReplacementRegex, templateData.projectName || 'Project'));

						// If this is a folder, just create the destination folder directly
						if (fs.statSync(sourcePath).isDirectory()) {
							logger.debug(__('Creating directory %s', destinationPath.cyan));
							wrench.mkdirSyncRecursive(destinationPath);
						} else {
							// Otherwise, run the file through EJS if it needs to be templated, else just copy it
							sourceData = fs.readFileSync(sourcePath);
							if (templateFiles.indexOf(file) != -1) {
								logger.debug(__('Generating file %s', destinationPath.cyan));
								fs.writeFileSync(destinationPath, ejs.render(sourceData.toString(), templateData));
							} else {
								logger.debug(__('Copying file %s => %s', sourcePath.cyan, destinationPath.cyan));
								fs.writeFileSync(destinationPath, sourceData);
							}
						}
					});

					// copy the tile icons
					logger.info(__('Copying tile icons'));

					var buildDir = builder.buildDir,
						m = builder.tiapp.icon.match(/^(.*)(?:\.(?:png|jpg|gif))$/),
						iconPrefix = m && m[1] != 'appicon' && m[1];

					function copyTile(suffix, destFilename) {
						var file = path.join(builder.projectResDir, 'mobileweb', iconPrefix + suffix);
						if (!fs.existsSync(file)) {
							file = path.join(builder.projectResDir, iconPrefix + suffix);
						}
						if (!fs.existsSync(file)) {
							file = path.join(builder.projectResDir, 'mobileweb', 'appicon' + suffix);
						}
						if (!fs.existsSync(file)) {
							file = path.join(builder.projectResDir, 'appicon' + suffix);
						}
						if (fs.existsSync(file)) {
							appc.fs.copyFileSync(file, path.join(destination, tiapp.id, 'Assets', destFilename), { logger: logger.debug });
						}
					}

					copyTile('.png', 'ApplicationIcon.png');
					copyTile('-tile-small.png', 'Tiles\\FlipCycleTileSmall.png');
					copyTile('-tile-medium.png', 'Tiles\\FlipCycleTileMedium.png');
					copyTile('-tile-large.png', 'Tiles\\FlipCycleTileLarge.png');

					// compile the app
					logger.info(__('Building the %s Visual Studio project', displayName));
					windowslib.visualstudio.build(
						appc.util.mix({
							buildConfiguration: builder.deployType === 'production' ? 'Release' : 'Debug',
							project: path.join(destination, tiapp.id + '.sln')
						}, windowslibOptions)
					).on('success', function () {
						next();
					}).on('error', function (err) {
						logger.error(err.message);
						if (err.extendedError && err.extendedError.out) {
							logger.error();
							err.extendedError.out.trim().split('\n').forEach(function (line) {
								logger.error(line);
							});
							logger.error();
						}
						next(err);
					});
				}
			], function (err) {
				if (!err) {
					logger.info(__('Finished building the application'));
				}
				finished(err);
			});
		}
	});

	// install app on Windows Phone device or emulator
	cli.on('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (builder.buildOnly || builder.target !== 'wp8') {
				return finished();
			}

			// this is more of a sanity check... windowslib will do another sanity check during install
			var wpInfo = windowsInfo.windowsphone[targetWPSDK];
			if (!wpInfo) {
				var validVersions = Object.keys(windowsInfo.windowsphone).filter(function (v) { return windowsInfo.windowsphone[v].supported; }).sort();
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

			function install() {
				if (logRelay) {
					// start the log relay server
					var started = false;

					function endLog() {
						if (started) {
							var endLogTxt = __('End application log');
							logger.log('\r' + ('-- ' + endLogTxt + ' ' + (new Array(75 - endLogTxt.length)).join('-')).grey + '\n');
							started = false;
						}
					}

					logRelay.on('connection', function () {
						endLog();
						var startLogTxt = __('Start application log');
						logger.log(('-- ' + startLogTxt + ' ' + (new Array(75 - startLogTxt.length)).join('-')).grey);
						started = true;
					});

					logRelay.on('disconnect', endLog);

					logRelay.on('stopped', endLog);

					process.on('SIGINT', function () {
						logRelay.stop();
						process.exit(0);
					});
				}

				var tiapp = builder.tiapp,
					buildType = builder.deployType === 'production' ? 'Release' : 'Debug',
					xapFile = path.resolve(builder.buildDir, '..', 'mobileweb-wp8', tiapp.id, 'Bin', buildType, tiapp.id + '_' + buildType + '_AnyCPU.xap'),
					opts = appc.util.mix({
						killIfRunning: false,
						timeout: config.get('mobileweb.log.timeout', 60000),
						wpsdk: targetWPSDK
					}, windowslibOptions);

				logger.info(__('Installing and launching the application'));

				windowslib.install(targetDevice.udid, xapFile, opts)
					.on('installed', function (handle) {
						logger.info(__('Finished launching the application'));

						// watch for when the emulator is quit, if necessary
						if (targetDevice.type === 'emulator') {
							var pollInterval = config.get('windows.emulator.pollInterval', 1000);
							if (pollInterval > 0) {
								(function watchForEmulatorQuit() {
									setTimeout(function () {
										windowslib.emulator.isRunning(handle.udid, windowslibOptions, function (err, running) {
											if (!err && !running) {
												logRelay && logRelay.stop();
												process.exit(0);
											} else {
												watchForEmulatorQuit();
											}
										});
									}, pollInterval);
								}());
							}
						}

						if (logRelay) {
							logger.info(__('Waiting for app to connect to log relay'));
						} else {
							// no reason to stick around, let the build command finish
							finished();
						}
					})
					.on('timeout', function (err) {
						logRelay && logRelay.stop();
						finished(err);
					})
					.on('error', function (err) {
						logRelay && logRelay.stop();
						finished(err);
					});
			}

			if (targetDevice.type === 'device' || emuHandle) {
				install();
			} else {
				// emulator not started yet, queue up the install
				emuInstall = install;
				logger.info(__('Waiting for Windows Phone emulator to finish booting'));
			}
		}
	});

	// install app as Windows Store app
	cli.on('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (builder.buildOnly || builder.target !== 'winstore') {
				return finished();
			}

			logger.info(__('Installing and launching the application'));

			var tiapp = builder.tiapp;

			async.series([
				function (next) {
					logger.info(__('Checking to see if the application is already installed'));
					windowslib.winstore.uninstall(tiapp.id, windowslibOptions, function (err) {
						next(err);
					});
				},

				function (next) {
					logger.info(__('Installing the app'));
					windowslib.winstore.install(
						path.resolve(builder.buildDir, '..', 'mobileweb-winstore', tiapp.id),
						appc.util.mix({
							buildConfiguration: builder.deployType === 'production' ? 'Release' : 'Debug'
						}, windowslibOptions),
						function (err) {
							if (!err) {
								logger.debug(__('Finished deploying the application'));
							}
							next(err);
						}
					);
				},

				function (next) {
					logger.info(__('Launching the app'));
					windowslib.winstore.launch(
						tiapp.id,
						appc.util.mix({
							version: appVersion
						}, windowslibOptions),
						function (err) {
							next(err);
						}
					);
				}
			], function (err) {
				finished(err);
			});
		}
	});
};
