/**
 * Packages Windows Phone 8 and Windows Store resources for Titanium Mobile Web
 * apps.
 *
 * @copyright
 * Copyright (c) 2013-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('node-appc'),
	async = require('async'),
	crypto = require('crypto'),
	ejs = require('ejs'),
	fs = require('fs'),
	os = require('os'),
	path = require('path'),
	spawn = require('child_process').spawn,
	uuid = require('node-uuid'),
	windows = require('titanium-sdk/lib/windows'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {
	if (process.platform != 'win32') {
		return;
	}

	cli.on('build.mobileweb.createIcons', function (builder, callback) {
		if (builder.target != 'wp8' && builder.target != 'winstore') return callback();

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

	cli.on('build.mobileweb.assembleConfigTemplate', {
		pre: function (data, callback) {
			if (this.target == 'wp8' || this.target == 'winstore') {
				var options = data.args[1];
				options.tiAnalyticsPlatformName = 'windows';
				options.tiOsName = 'mobileweb';
				options.tiPlatformName = 'Windows Hybrid';
			}
			callback();
		}
	});

	cli.on('build.mobileweb.assemblePlatformImplementation', {
		pre: function (data, callback) {
			if (this.target == 'wp8' || this.target == 'winstore') {
				data.args[0] += fs.readFileSync(path.join(this.platformPath, 'src', this.target + '.js')).toString() + '\n';
			}
			callback();
		}
	});

	cli.on('build.pre.compile', function(builder, finished) {
		if (this.target == 'wp8' || this.target == 'winstore') {
			var session = appc.auth.status();
			builder.logToken = '';
			if (builder.enableLogging) {
				builder.logToken = crypto.createHash('md5').update((session.loggedIn && session.email || '') + ':' + os.hostname()).digest('hex');
			}
		}
		finished();
	});

	cli.on('build.post.compile', {
		priority: 8000,
		post: function (builder, finished) {
			var target = cli.argv.target,
				tiapp = builder.tiapp,
				displayName = target == 'wp8' ? __('Windows Phone 8') : __('Windows Store'),
				certificatePathRoot = path.join(builder.projectDir, tiapp.name + '_WindowsCodeSigningCert');

			if (process.platform != 'win32' || target != 'winstore' && target != 'wp8') {
				finished();
				return;
			}

			logger.info(__('Bundling Mobile Web app as a standalone %s app', displayName));

			windows.detect(config, null, function (env) {
				var vsInfo = windows.getSelectedVisualStudio(env);

				if (!vsInfo) {
					var validVersions = Object.keys(env.visualstudio).filter(function (v) { return env.visualstudio[v].supported; }).sort();
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

				function makePipe(log) {
					return function (data) {
						data.toString().split(/\r\n|\n/).forEach(function (line) {
							line = line.trim();
							line.length && log(line);
						});
					};
				}

				function run(command, callback) {
					var child = spawn(vsInfo.vcvarsall, ['&&'].concat(command), {
						cwd: path.join(vsInfo.path, 'VC')
					});
					child.stdout.on('data', makePipe(logger.trace));
					child.stderr.on('data', makePipe(logger.error));
					child.on('close', callback);
				}

				// Check if the certificate has been generated yet or not
				if (target == 'winstore' && !fs.existsSync(certificatePathRoot + '.pfx')) {
					logger.info(__('No code signing certificate for Windows Store applications was found, creating and installing one now.'));
					logger.info(__("The certificate will be installed in the local machine's Trusted Root Certificate Authorities certificate store."));
					logger.info(__('When prompted for a password, leave everything blank.'));

					async.series([
						// Create the certificate and install it in the root trusted certificates
						function (next) {
							var cmd = [
								config.get('windows.executables.powershell', 'powershell'),
								'-command',
								path.resolve(__dirname, '..', '..', '..', 'node_modules', 'titanium-sdk', 'bin', 'winstore_create_cert.ps1'),
								tiapp.id,
								certificatePathRoot
							];

							logger.info(__('Generating the code signing certificate'));
							logger.debug(__('Running: %s', cmd.join(' ').cyan));

							run(cmd, function (code) {
								if (code) {
									logger.error(__('There were errors creating the temporary code signing certificate'));
								} else {
									logger.debug(__('Finished creating the code signing certificate'));
								}
								next(code);
							});
						},

						// Package the certificate as pfx
						function (next) {
							var cmd = [
								config.get('windows.executables.pvk2pfx', 'Pvk2Pfx'),
								'/pvk', certificatePathRoot + '.pvk',
								'/spc', certificatePathRoot + '.cer',
								'/pfx', certificatePathRoot + '.pfx'
							];

							logger.info(__('Exporting the certificate to PKCS#12'));
							logger.debug(__('Running: %s', cmd.join(' ').cyan));

							run(cmd, function (code) {
								logger.debug(__('Removing intermediate certificate files'));
								fs.existsSync(certificatePathRoot + '.pvk') && fs.unlinkSync(certificatePathRoot + '.pvk');
								fs.existsSync(certificatePathRoot + '.cer') && fs.unlinkSync(certificatePathRoot + '.cer');
								if (code) {
									logger.error(__('There were errors exporting the code signing certificate'));
								} else {
									logger.debug(__('Finished creating the code signing certificate'));
								}
								next(code);
							});
						}
					], function (err) {
						if (err) {
							finished(err);
						} else {
							packageApp();
						}
					});
				} else {
					packageApp();
				}

				function packageApp() {
					var source = path.resolve(builder.buildDir),
						destination = path.resolve(source, '..', 'mobileweb-' + target),
						version = tiapp.version,
						templateData = {
							// general
							projectName: tiapp.id,
							projectDisplayName: tiapp.name,
							projectGUID: tiapp.guid || uuid.v4(),
							projectDescription: tiapp.description || '',
							author: tiapp.publisher || config.get('user.name') || 'Titanium',
							appFiles: [],

							// windows phone specific
							assemblyGUID: uuid.v4(),
							publisherGUID: cli.argv['wp8-publisher-guid'],
							company: 'not specified', // Hopefully we can support this some day
							copyright: tiapp.copyright || ('Copyright © ' + new Date().getFullYear()),
							logToken: builder.logToken,

							// windows store specific
							visualStudioVersion: env.visualStudioVersion,
							certificatePath: certificatePathRoot + '.pfx'
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
					templateData.projectVersion = tiapp._windowsVersion = version;

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

					// Compile the app
					var cmd = [
						'MSBuild',
						'/m',
						'/p:configuration=' + (cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug'),
						path.join(destination, tiapp.id + '.sln')
					];
					logger.info(__('Building the %s Visual Studio project', displayName));
					logger.debug(__('Running: %s', cmd.join(' ').cyan));
					run(cmd, function (code) {
						if (!code) {
							logger.info(__('Finished building the application'));
						}
						finished(code);
					});
				}
			});
		}
	});
};