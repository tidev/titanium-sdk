/*
 * package_windows.js: Titanium Mobile Web CLI library for packaging in a Windows Store or Windows Phone app
 *
 * Copyright (c) 2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var path = require('path'),
	fs = require('fs'),
	spawn = require('child_process').spawn,
	wrench = require('wrench'),
	async = require('async'),
	ejs = require('ejs'),
	uuid = require('node-uuid'),
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__;

exports.cliVersion = '>=3.X';

exports.init = function (logger, config, cli) {

	if (process.platform != 'win32') {
		return;
	}

	cli.addHook('build.post.compile', {
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
			require('titanium-sdk/lib/' + target).detect(function (env) {

				function run(command, callback) {
					var proc = spawn('vcvarsall.bat', [ '&&' ].concat(command), {
							cwd: path.join(env.visualStudioPath, 'VC')
						});
					proc.stdout.on('data', function (data) {
						data.toString().split('\r\n').forEach(function (line) {
							line = line.trim();
							if (line.length) {
								logger.trace(line);
							}
						});
					});
					proc.stderr.on('data', function (data) {
						data.toString().split('\r\n').forEach(function (line) {
							line = line.trim();
							if (line.length) {
								logger.error(line);
							}
						});
					});
					proc.on('error', function () {
						logger.error('An unknown error occured while trying to spawn the external command');
						callback(1);
					});
					proc.on('close', callback);
				}

				if (env.issues.length) {
					logger.error(__('There were issues detected with the %s development environment setup. ' +
						'Please run "titanium info" for more information', displayName));
					process.exit(1);
				}

				// Check if the certificate has been generated yet or not
				if (target == 'winstore' && !fs.existsSync(certificatePathRoot + '.pfx')) {

					logger.info(__('No code signing certificate for Windows Store applications was found, ' +
						'creating and installing one now. ' +
						'The certificate will be installed in the local machine\'s Trusted Root Certificate Authorities certificate store. ' +
						'When prompted for a password, leave everything blank.'));

					async.series([

						// Create the certificate and install it in the root trusted certificates
						function (next) {
							var cmd = [
									'powershell.exe',
									'-command',
									path.join(__dirname, '..', '..', '..', 'node_modules', 'titanium-sdk', 'bin', 'winstore_create_cert.ps1') + ' ' + tiapp.id + ' "' + certificatePathRoot + '"'
								];

							logger.info(__('Generating the code signing certificate'));
							logger.debug(__('Running: %s', ('"' + cmd.join('" "') + '"').cyan));

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
							logger.debug(__('Exporting the certificate to PKCS#12'));
							run([ 'Pvk2Pfx',
									'/pvk', certificatePathRoot + '.pvk',
									'/spc', certificatePathRoot + '.cer',
									'/pfx', certificatePathRoot + '.pfx'
								], function (code) {
									logger.debug(__('Removing intermediate certificate files'));
									fs.unlinkSync(certificatePathRoot + '.pvk');
									fs.unlinkSync(certificatePathRoot + '.cer');
									if (code) {
										logger.error(__('There were errors exporting the code signing certificate'));
									} else {
										logger.debug(__('Finished creating the code signing certificate'));
									}
									next(code);
								});
						}
					], function (err) {
						if (!err) {
							packageApp();
						}
					});
				} else {
					packageApp();
				}

				function packageApp() {

					var source = path.resolve(build.buildDir),
						destination = path.resolve(path.join(source, '..', 'mobileweb-' + target)),
						version = tiapp.version,
						templateData = target == 'wp8' ? {
								projectName: tiapp.id,
								projectDisplayName: tiapp.name,
								projectGUID: tiapp.guid || uuid.v4(),
								assemblyGUID: uuid.v4(),
								publisherGUID: cli.argv['wp8-publisher-guid'],
								company: 'not specified', // Hopefully we can support this some day
								projectDescription: tiapp.description || '',
								author: tiapp.publisher,
								copyright: tiapp.copyright || 'Copyright © ' + new Date().getFullYear(),
								appFiles: []
							} : {
								projectName: tiapp.id,
								projectDisplayName: tiapp.name,
								projectGUID: tiapp.guid || uuid.v4(),
								projectDescription: tiapp.description || '',
								author: config.user.name || 'Titanium',
								appFiles: [],
								visualStudioVersion: env.visualStudioVersion,
								certificatePath: certificatePathRoot + '.pfx'
							},
						templateDir = path.join(__dirname, '..', '..', 'templates', 'packages', target),
						filenameReplacementRegex = /\{\{ProjectName\}\}/g,
						templateFiles = target == 'wp8' ? [
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
							] : [
								'{{ProjectName}}.sln',
								path.join('{{ProjectName}}', '{{ProjectName}}.jsproj'),
								path.join('{{ProjectName}}', 'package.appxmanifest')
							],
						appFiles = templateData.appFiles,
						buildProcess,
						versionFormatRegex = /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/;

					// Validate and format the version to Major.Minor.Build.Revision format necessary for MS build systems
					if (!version) {
						version = '0.1.0.0';
					} else if (!versionFormatRegex.exec(version)) {
						version = version.match(/^[0-9]+(\.[0-9]+)*/);
						if (!version) {
							logger.warn(__('Invalid project version number %s, setting to 0.1.0.0', tiapp.version));
							version = '0.1.0.0';
						} else {
							version = version[0];
							while(!versionFormatRegex.exec(version)) {
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
					logger.info(__('Building the %s Visual Studio project', displayName));
					buildProcess = spawn('vcvarsall.bat', [
							'&&',
							'MSBuild',
							'/m',
							'/p:configuration=' + (cli.argv['deploy-type'] == 'production' ? 'Release' : 'Debug'),
							path.join(destination, tiapp.id + '.sln')
						], {
							cwd: path.join(env.visualStudioPath, 'VC')
						});
					buildProcess.stdout.on('data', function (data) {
						data.toString().split('\r\n').forEach(function (line) {
							if (line.length) {
								logger.trace(line);
							}
						});
					});
					buildProcess.stderr.on('data', function (data) {
						data.toString().split('\r\n').forEach(function (line) {
							if (line.length) {
								logger.error(line);
							}
						});
					});
					buildProcess.on('close', function (code) {
						if (code) {
							finished(code);
						} else {
							logger.info(__('Finished building the application'));
							finished();
						}
					});
				}
			});
		}
	});
};