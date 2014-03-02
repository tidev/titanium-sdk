/*
 * package_windows.js: Titanium Mobile Web CLI library for packaging in a Windows Store or Windows Phone app
 *
 * Copyright (c) 2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	async = require('async'),
	ejs = require('ejs'),
	fs = require('fs'),
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

	cli.on('build.mobileweb.processConfigTemplate', {
		pre: function (data, callback) {
			var options = data.args[1];
			options.tiAnalyticsPlatformName = 'windows';
			options.tiOsName = 'mobileweb';
			options.tiPlatformName = 'Windows Hybrid';
			callback();
		}
	});

	cli.on('build.post.compile', {
		priority: 8000,
		post: function (build, finished) {
			var target = cli.argv.target,
				tiapp = build.tiapp,
				displayName = target == 'wp8' ? __('Windows Phone 8') : __('Windows Store'),
				certificatePathRoot = path.join(build.projectDir, tiapp.name + '_WindowsCodeSigningCert');

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
					var source = path.resolve(build.buildDir),
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
							path.join('{{ProjectName}}', 'MainPage.xaml'),
							path.join('{{ProjectName}}', 'MainPage.xaml.cs'),
							path.join('{{ProjectName}}', 'LocalizedStrings.cs'),
							path.join('{{ProjectName}}', 'App.xaml'),
							path.join('{{ProjectName}}', 'App.xaml.cs'),
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