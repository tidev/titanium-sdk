/**
* iOS module build command.
*
* @module cli/_buildModule
*
* @copyright
* Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
*
* @license
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

var appc = require('node-appc'),
	AdmZip = require('adm-zip'),
	archiver = require('archiver'),
	archiverCore = require('archiver/lib/archiver/core'),
	async = require('async'),
	crypto = require('crypto'),
	Builder = require('titanium-sdk/lib/builder'),
	ioslib = require('ioslib'),
	iosPackageJson = appc.pkginfo.package(module),
	jsanalyze = require('titanium-sdk/lib/jsanalyze'),
	ejs = require('ejs'),
	fs = require('fs'),
	path = require('path'),
	spawn = require('child_process').spawn,
	ti = require('titanium-sdk'),
	util = require('util'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__,
	afs = appc.fs,
	parallel = appc.async.parallel,
	series = appc.async.series,
	version = appc.version;

// Archiver 0.4.10 has a problem where the stack size is exceeded if the project
// has lots and lots of files. Below is a function copied directly from
// lib/archiver/core.js and modified to use a setTimeout to collapse the call
// stack. Copyright (c) 2012-2013 Chris Talkington, contributors.
archiverCore.prototype._processQueue = function _processQueue() {
	if (this.archiver.processing) {
		return;
	}

	if (this.archiver.queue.length > 0) {
		var next = this.archiver.queue.shift();
		var nextCallback = function(err, file) {
			next.callback(err);

			if (!err) {
				this.archiver.files.push(file);
				this.archiver.processing = false;
				// do a setTimeout to collapse the call stack
				setTimeout(function () {
					this._processQueue();
				}.bind(this), 0);
			}
		}.bind(this);

		this.archiver.processing = true;

		this._processFile(next.source, next.data, nextCallback);
	} else if (this.archiver.finalized && this.archiver.writableEndCalled === false) {
		this.archiver.writableEndCalled = true;
		this.end();
	} else if (this.archiver.finalize && this.archiver.queue.length === 0) {
		this._finalize();
	}
};

function randomStr (len) {
	return crypto.randomBytes(Math.ceil(len * 3 / 4))
		.toString('base64')
		.slice(0, len)
		.replace(/\+/g, '0')
		.replace(/\//g, '0');
}

function iOSModuleBuilder() {
	Builder.apply(this, arguments);
}

util.inherits(iOSModuleBuilder, Builder);

iOSModuleBuilder.prototype.config = function (logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);
};

iOSModuleBuilder.prototype.validate = function (logger, config, cli) {

	this.projectDir = cli.argv['project-dir'];

	this.cli = cli;
	this.logger = logger;

	this.manifest = this.cli.manifest;

	this.xcodeEnv = null;

	return function(finished) {

		ioslib.detect({
			// env
			xcodeSelect: config.get('osx.executables.xcodeSelect'),
			security: config.get('osx.executables.security'),
			// provisioning
			profileDir: config.get('ios.profileDir'),
			// xcode
			searchPath: config.get('paths.xcode'),
			minIosVersion: iosPackageJson.minIosVersion,
			supportedVersions: iosPackageJson.vendorDependencies.xcode
		}, function (err, iosInfo) {
			this.iosInfo = iosInfo;
			this.xcodeEnv = this.iosInfo.selectedXcode;

			if (!this.xcodeEnv) {
				// this should never happen
				logger.error(__('Unable to find suitable Xcode install that supports iOS SDK %s', cli.argv['ios-version']) + '\n');
				process.exit(1);
			}
			finished();
		}.bind(this));
	}.bind(this);
};

iOSModuleBuilder.prototype.run = function (logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	series(this, [
		function (next) {
			cli.emit('build.pre.construct', this, next);
		},

		'doAnalytics',
		'initialize',
		'loginfo',
		'processLicense',
		'processTiXcconfig',
		'compileJS',
		'buildModule',
		'createUniBinary',
		'verifyBuildArch',
		'generateDoc',
		'packageModule',
		'runModule'
	], function (err) {
		cli.emit('build.finalize', this, function () {
			finished(err);
		});
	});
};

iOSModuleBuilder.prototype.doAnalytics = function (next) {

	var cli = this.cli,
		manifest = this.manifest,
		eventName = 'ios.' + cli.argv.type;

	cli.addAnalyticsEvent(eventName, {
		dir: cli.argv['project-dir'],
		name: manifest.name,
		publisher: manifest.author,
		appid: manifest.moduleid,
		description: manifest.description,
		type: cli.argv.type,
		guid: manifest.guid,
		version: manifest.version,
		copyright: manifest.copyright,
		date: (new Date()).toDateString()
	});

	next();
};


iOSModuleBuilder.prototype.initialize = function (next) {

	this.moduleIdAsIdentifier = this.manifest.moduleid.replace(/[\s-]/g, '_').replace(/_+/g, '_').split(/\./).map(function (s) { return s.substring(0, 1).toUpperCase() + s.substring(1); }).join('');
	this.tiSymbols = {};
	this.documentation = [];
	this.metaData = [];
	this.metaDataFile = path.join(this.projectDir, 'metadata.json');
	this.manifestFile = path.join(this.projectDir, 'manifest');
	this.platformPath = appc.fs.resolvePath(__dirname, '..', '..');
	this.templatesDir = path.join(this.platformPath, 'templates');
	this.assetsTemplateFile = path.join(this.templatesDir, 'module', 'default', 'template', 'iphone', 'Classes', '{{ModuleIdAsIdentifier}}ModuleAssets.m.ejs');

	this.universalBinaryDir = path.join(this.projectDir, 'build');

	['assets', 'documentation', 'example', 'platform'].forEach(function (folder) {
		var dirName = folder+'Dir';
		this[dirName] = path.join(this.projectDir, folder);
		if (!fs.existsSync(this[dirName])) {
			this[dirName] = path.join(this.projectDir, '..', folder);
		}
	}, this);

	this.licenseDefault = "TODO: place your license here and we'll include it in the module distribution";
	this.licenseFile = path.join(this.projectDir, 'LICENSE');
	if (!fs.existsSync(this.licenseFile)) {
		this.licenseFile = path.join(this.projectDir, '..', 'LICENSE');
	}

	this.tiXcconfig = {};
	this.tiXcconfigFile = path.join(this.projectDir, 'titanium.xcconfig');

	this.moduleXcconfigFile = path.join(this.projectDir, 'module.xcconfig');

	next();
};

iOSModuleBuilder.prototype.loginfo = function (next) {
	this.logger.debug(__('Titanium SDK iOS directory: %s', this.platformPath.cyan));
	this.logger.info(__('Project directory: %s', this.projectDir.cyan));
	this.logger.info(__('Module ID: %s', this.manifest.moduleid.cyan));

	next();
};

iOSModuleBuilder.prototype.dirWalker = function (currentPath, callback) {
	var files = fs.readdirSync(currentPath);
	for (var i in files) {
		var currentFile = path.join(currentPath, files[i]);
		var stats = fs.statSync(currentFile);

		if (stats.isFile()) {
			callback(currentFile);
		} else if (stats.isDirectory()) {
			this.dirWalker(currentFile, callback);
		}
	}
};

iOSModuleBuilder.prototype.processLicense = function (next) {
	if (fs.existsSync(this.licenseFile)) {
		if (fs.readFileSync(this.licenseFile).toString().indexOf(this.licenseDefault) != -1) {
			this.logger.warn(__('Please update the LICENSE file with your license text before distributing.'));
		}
	}

	next();
};

iOSModuleBuilder.prototype.processTiXcconfig = function (next) {
	var re = /^(\S+)\s*=\s*(.*)$/,
		bindingReg = /\$\(([^$]+)\)/g,
		match,
		bindingMatch;

	if (fs.existsSync(this.tiXcconfigFile)) {
		fs.readFileSync(this.tiXcconfigFile).toString().split('\n').forEach(function (line) {
			match = line.match(re);
			if (match) {
				var keyList = [],
					value = match[2].trim();

				bindingMatch = bindingReg.exec(value);
				if (bindingMatch !== null) {
					while (bindingMatch !== null) {
						keyList.push(bindingMatch[1]);
						bindingMatch = bindingReg.exec(value);
					}

					keyList.forEach(function (key) {
						if (this.tiXcconfig[key]) {
							value = value.replace('$('+key+')', this.tiXcconfig[key]);
						}
					}, this);
				}
				this.tiXcconfig[match[1].trim()] = value;
			}
		}, this);
	}

	next();
};

iOSModuleBuilder.prototype.compileJS = function (next) {

	this.jsFilesToEncrypt = [];

	var moduleJS = this.manifest.moduleid + '.js',
		jsFile = path.join(this.assetsDir, moduleJS),
		renderData = {
			'moduleIdAsIdentifier' : this.moduleIdAsIdentifier,
			'mainEncryptedAssetReturn': 'return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[0]);',
			'allEncryptedAssetsReturn': 'NSNumber *index = [map objectForKey:path];'
				+ '\n\t\tif (index == nil) {\n\t\t\treturn nil;\n\t\t}'
				+ '\n\t\treturn filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[index.integerValue]);'
		},
		titaniumPrepHook = this.cli.createHook('build.ios.titaniumprep', this, function (exe, args, opts, done) {
			var tries = 0,
				completed = false,
				jsFilesToEncrypt = opts.jsFiles,
				placeHolderName = opts.placeHolder;

			this.logger.info('Encrypting JavaScript files: %s', (exe + ' "' + args.join('" "') + '"').cyan);
			jsFilesToEncrypt.forEach(function (file) {
				this.logger.debug(__('Preparing %s', file.cyan));
			}, this);

			async.whilst(
				function () {
					if (tries > 3) {
						// we failed 3 times, so just give up
						this.logger.error(__('titanium_prep failed to complete successfully'));
						this.logger.error(__('Try cleaning this project and build again') + '\n');
						process.exit(1);
					}
					return !completed;
				},
				function (cb) {
					var child = spawn(exe, args, opts),
						out = '';

					child.stdin.write(jsFilesToEncrypt.join('\n'));
					child.stdin.end();

					child.stdout.on('data', function (data) {
						out += data.toString();
					});

					child.on('close', function (code) {
						if (code) {
							this.logger.error(__('titanium_prep failed to run (%s)', code) + '\n');
							process.exit(1);
						}

						if (out.indexOf('initWithObjectsAndKeys') !== -1) {
							// success!
							renderData[placeHolderName] = out;

							completed = true;
						} else {
							// failure, maybe it was a fluke, try again
							this.logger.warn(__('titanium_prep failed to complete successfully, trying again'));
							tries++;
						}
						cb();
					}.bind(this));
				}.bind(this),
				done
			);
		});

	var tasks = [
		// 1. compile module js
		function (cb) {
			fs.existsSync(jsFile) && this.jsFilesToEncrypt.push(jsFile);

			if (!this.jsFilesToEncrypt.length) {
				renderData.mainEncryptedAsset = '';
				renderData.mainEncryptedAssetReturn = 'return nil;';
				return cb();
			}

			titaniumPrepHook(
				path.join(this.platformPath, 'titanium_prep'),
				[this.manifest.moduleid, this.assetsDir],
				{'jsFiles': this.jsFilesToEncrypt, 'placeHolder': 'mainEncryptedAsset'},
				cb
			);
		},

		// 2. compile all other js files in assets dir
		function (cb) {
			this.dirWalker(this.assetsDir, function (file) {
				if (path.extname(file) === '.js' && this.jsFilesToEncrypt.indexOf(file) === -1) {
					this.jsFilesToEncrypt.push(file);
				}
			}.bind(this));

			var jsFilesCount = this.jsFilesToEncrypt.length;

			if (jsFilesCount === 0 || ( fs.existsSync(jsFile) && jsFilesCount === 1)) {
				renderData.allEncryptedAssets = renderData.mainEncryptedAsset;
				renderData.allEncryptedAssetsReturn = 'return nil;';
				cb();
			} else {
				titaniumPrepHook(
					path.join(this.platformPath, 'titanium_prep'),
					[this.manifest.moduleid, this.assetsDir],
					{'jsFiles': this.jsFilesToEncrypt, 'placeHolder': 'allEncryptedAssets'},
					cb
				);
			}
		},

		// 3. write encrypted data to template
		function (cb) {
			var data = ejs.render(fs.readFileSync(this.assetsTemplateFile).toString(), renderData),
				moduleAssetsFile = path.join(this.projectDir, 'Classes', this.moduleIdAsIdentifier+'ModuleAssets.m');

			this.logger.debug(__('Writing module assets file: %s', moduleAssetsFile.cyan));
			fs.writeFileSync(moduleAssetsFile, data);
			cb();
		},

		// 4. genereate exports
		function (cb) {
			this.jsFilesToEncrypt.forEach(function(file) {
				var r = jsanalyze.analyzeJsFile(file, { minify: true });
				this.tiSymbols[file] = r.symbols;
				this.metaData.push.apply(this.metaData, r.symbols);
			}.bind(this));

			fs.existsSync(this.metaDataFile) && fs.unlinkSync(this.metaDataFile);
			fs.writeFileSync('metadata.json', JSON.stringify({ "exports": this.metaData }));

			cb();
		}
	];

	appc.async.series(this, tasks, next);
};

iOSModuleBuilder.prototype.buildModule = function (next) {
	var xcodebuildHook = this.cli.createHook('build.ios.xcodebuild', this, function (exe, args, opts, done) {
		var p = spawn(exe, args, opts),
			out = [],
			err = [],
			stopOutputting = false;

		p.stdout.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				if (line.length) {
					out.push(line);
					if (line.indexOf('Failed to minify') != -1) {
						stopOutputting = true;
					}
					if (!stopOutputting) {
						this.logger.trace(line);
					}
				}
			}, this);
		}.bind(this));

		p.stderr.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				if (line.length) {
					err.push(line);
				}
			}, this);
		}.bind(this));

		p.on('close', function (code, signal) {
			if (code) {
				// just print the entire error buffer
				err.forEach(function (line) {
					this.logger.error(line);
				}, this);
				this.logger.log();
				process.exit(1);
			}

			// end of the line
			done(code);
		}.bind(this));
	});

	// Create a build for the device
	xcodebuildHook(
		this.xcodeEnv.executables.xcodebuild,
		[
			'-configuration', 'Release',
			'-sdk', 'iphoneos'
		],
		{
			cwd: this.projectDir,
			env: {
				DEVELOPER_DIR: this.xcodeEnv.path,
				TMPDIR: process.env.TMPDIR,
				HOME: process.env.HOME,
				PATH: process.env.PATH,
				TITANIUM_CLI_XCODEBUILD: 'Enjoy hacking? http://jobs.appcelerator.com/',
				TITANIUM_CLI_IMAGES_OPTIMIZED: this.target == 'simulator' ? '' : this.imagesOptimizedFile
			}
		},
		null
	);

	// Create a build for the simulator
	xcodebuildHook(
		this.xcodeEnv.executables.xcodebuild,

		[
			'-configuration', 'Release',
			'-sdk', 'iphonesimulator'
		],
		{
			cwd: this.projectDir,
			env: {
				DEVELOPER_DIR: this.xcodeEnv.path,
				TMPDIR: process.env.TMPDIR,
				HOME: process.env.HOME,
				PATH: process.env.PATH,
				TITANIUM_CLI_XCODEBUILD: 'Enjoy hacking? http://jobs.appcelerator.com/',
				TITANIUM_CLI_IMAGES_OPTIMIZED: this.target == 'simulator' ? '' : this.imagesOptimizedFile
			}
		},
		next
	);
};

iOSModuleBuilder.prototype.createUniBinary = function (next) {
	// Create a universal build by merging the all builds to a single binary
	var binaryFiles = [],
		outputFile = path.join(this.projectDir, 'build', 'lib' + this.manifest.moduleid + '.a'),
		lipoArgs = [
			'-create',
			'-output',
			outputFile
		];

	this.dirWalker(this.universalBinaryDir, function (file) {
		if (path.extname(file) === '.a'
			&& file.indexOf( this.manifest.name + '.build') === -1
			&& file.indexOf('Release-') > -1
		) {
			binaryFiles.push(file);
		}
	}.bind(this));

	appc.subprocess.run(this.xcodeEnv.executables.lipo, binaryFiles.concat(lipoArgs), function (code, out, err) {
		next();
	});
};

iOSModuleBuilder.prototype.verifyBuildArch = function (next) {
	var outputFile = path.join(this.projectDir, 'build', 'lib' + this.manifest.moduleid + '.a'),
		lipoArgs = ['-info', outputFile];

	appc.subprocess.run(this.xcodeEnv.executables.lipo, lipoArgs, function (code, out, err) {
		var buildArchs = out.substr(out.lastIndexOf(':') + 1).trim().split(' '),
			manifestArchs = this.manifest.architectures.split(' '),
			buildDiff = manifestArchs.filter(function (i) { return buildArchs.indexOf(i) < 0; });

		if (buildArchs.length != manifestArchs.length || buildDiff.length > 0) {
			this.logger.error(__('There is discrepancy between the architectures specified in module manifest and compiled binary.'));
			this.logger.error(__('Architectures in manifest: %s', manifestArchs));
			this.logger.error(__('Compiled binary architectures: %s', buildArchs));
			this.logger.error(__('Please update manifest to match module binary architectures.'));

			process.exit(1);
		}

		if (buildArchs.indexOf('arm64') < 0) {
			this.logger.warn(__('The module is missing 64-bit support.'));
		}

		next();
	}.bind(this));
};

iOSModuleBuilder.prototype.generateDoc = function (next) {

	if (fs.existsSync(this.documentationDir)) {
		var markdown = require( 'markdown' ).markdown;
		var files = fs.readdirSync(this.documentationDir);
		for (var i in files) {
			var file = files[i],
				currentFile = path.join(this.documentationDir, file);
			if (fs.statSync(currentFile).isFile()) {
				var obj = {},
					contents = fs.readFileSync(currentFile).toString();

				obj[file] = markdown.toHTML(contents);
				this.documentation.push(obj);
			}
		}
	}

	next();
};

iOSModuleBuilder.prototype.packageModule = function (next) {
	var dest = archiver('zip', {
			forceUTC: true
		}),
		zipStream,
		origConsoleError = console.error,
		name = this.manifest.name,
		moduleId = this.manifest.moduleid,
		version = this.manifest.version,
		moduleZipName = [moduleId, '-iphone-', version, '.zip'].join(''),
		moduleZipFullPath = path.join(this.projectDir, moduleZipName),
		moduleFolders = path.join('modules', 'iphone', moduleId, version),
		binarylibName = 'lib'+moduleId+'.a',
		binarylibFile = path.join(this.projectDir, 'build', binarylibName);

	this.moduleZipPath = moduleZipFullPath;

	// since the archiver library didn't set max listeners, we squelch all error output
	console.error = function () {};

	try {
		// if the zip file is there, remove it
		fs.existsSync(moduleZipFullPath) && fs.unlinkSync(moduleZipFullPath);
		zipStream = fs.createWriteStream(moduleZipFullPath);
		zipStream.on('close', function() {
			console.error = origConsoleError;
			next();
		});
		dest.catchEarlyExitAttached = true; // silence exceptions
		dest.pipe(zipStream);

		this.logger.info(__('Creating module zip'));

		// 1. documentation folder
		this.documentation.forEach(function (item) {
			var fileName = Object.keys(item),
				content = item[fileName],
				filePath;

			fileName = fileName.toString().replace('.md', '.html');
			filePath = path.join(moduleFolders, 'documentation', fileName);

			dest.append(content, { name: filePath });

		}, this);

		// 2. example folder
		this.dirWalker(this.exampleDir, function (file) {
			dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'example', path.relative(this.exampleDir, file)) });
		}.bind(this));


		// 3. platform folder
		if (fs.existsSync(this.platformDir)) {
			this.dirWalker(this.platformDir, function (file) {
				dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'platform', path.relative(this.platformDir, file)) });
			}.bind(this));
		}

		// 4. assets folder, not including js files
		this.dirWalker(this.assetsDir, function (file) {
			if (path.extname(file) != '.js') {
				dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'assets', path.relative(this.assetsDir, file)) });
			}
		}.bind(this));

		// 5. the merge *.a file
		// 6. LICENSE file
		// 7. manifest
		// 8. module.xcconfig
		// 9. metadata.json
		dest.append(fs.createReadStream(binarylibFile), { name: path.join(moduleFolders, binarylibName) });
		dest.append(fs.createReadStream(this.licenseFile), { name: path.join(moduleFolders,'LICENSE') });
		dest.append(fs.createReadStream(this.manifestFile), { name: path.join(moduleFolders,'manifest') });
		dest.append(fs.createReadStream(this.moduleXcconfigFile), { name: path.join(moduleFolders,'module.xcconfig') });
		dest.append(fs.createReadStream(this.metaDataFile), { name: path.join(moduleFolders,'metadata.json') });

		this.logger.info(__('Writing module zip: %s', moduleZipFullPath));
		dest.finalize();
	} catch (ex) {
		console.error = origConsoleError;
		throw ex;
	}

	next();
};

iOSModuleBuilder.prototype.runModule = function (next) {
	var tmpName,
		tmpDir,
		tmpProjectDir;

	function checkLine(line, logger) {
		var re = new RegExp(
			'(?:\u001b\\[\\d+m)?\\[?(' +
			logger.getLevels().join('|') +
			')\\]?\s*(?:\u001b\\[\\d+m)?(.*)', 'i'
		);

		if (line) {
			var m = line.match(re);
			if (m) {
				logger[m[1].toLowerCase()](m[2].trim());
			} else {
				logger.debug(line);
			}
		}
	}

	function runTiCommand(cmd, args, logger, callback) {

		// when calling a Windows batch file, we need to escape ampersands in the command
		if (process.platform == 'win32' && /\.bat$/.test(cmd)) {
			args.unshift('/S', '/C', cmd.replace(/\&/g, '^&'));
			cmd = 'cmd.exe';
		}

		var child = spawn(cmd, args);

		child.stdout.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				checkLine(line, logger);
			});

		});

		child.stderr.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				checkLine(line, logger);
			});

		});

		child.on('close', function (code) {
			if (code) {
				logger.error(__('Failed to run ti %s', args[0]));
				logger.error();
				err.trim().split('\n').forEach(this.logger.error);
				logger.log();
				process.exit(1);
			}

			callback();
		});
	}

	var tasks = [

		function (cb) {
			// 1. create temp dir
			do {
				tmpName = 'm' + randomStr(6) + 'ti';
				tmpDir = path.join(process.env.TMPDIR, tmpName);
			} while(fs.existsSync(tmpDir));

			fs.mkdirSync(tmpDir);

			// 2. create temp proj
			this.logger.debug(__('Staging module project at %s', tmpDir.cyan));
			runTiCommand(
				'ti',
				[
					'create',
					'--id', this.manifest.moduleid,
					'-n', this.manifest.name,
					'-t', 'app',
					'-u', 'localhost',
					'-d', tmpDir,
					'-p', 'ios'
				],
				this.logger,
				cb
			);
		},

		function (cb) {

			tmpProjectDir = path.join(tmpDir, this.manifest.name);
			this.logger.debug(__('Created temp project %s', tmpProjectDir.cyan));

			// 3. patch tiapp.xml with module id
			var data = fs.readFileSync(path.join(tmpProjectDir, 'tiapp.xml')).toString();
			var result = data.replace(/<modules>/g, '<modules>\n\t\t<module platform="iphone">' + this.manifest.moduleid + '</module>');
			fs.writeFileSync(path.join(tmpProjectDir, 'tiapp.xml'), result);

			// 4. copy files in example to Resource
			afs.copyDirSyncRecursive(
				this.exampleDir,
				path.join(tmpProjectDir, 'Resources'),
				{
					preserve: true,
					logger: this.logger.debug
				}
			);

			// 5. unzip module to the tmp dir
			var zip = new AdmZip(this.moduleZipPath);
			zip.extractAllTo(tmpProjectDir, true);

			cb();
		},

		function (cb) {
			// 6. run the app
			this.logger.debug(__('Running example project...', tmpDir.cyan));
			runTiCommand(
				'ti',
				[
					'build',
					'-p', 'ios',
					'-d', tmpProjectDir
				],
				this.logger,
				cb
			);
		}
	];

	appc.async.series(this, tasks, next);
};

// create the builder instance and expose the public api
(function (iOSModuleBuilder) {
	exports.config   = iOSModuleBuilder.config.bind(iOSModuleBuilder);
	exports.validate = iOSModuleBuilder.validate.bind(iOSModuleBuilder);
	exports.run      = iOSModuleBuilder.run.bind(iOSModuleBuilder);
}(new iOSModuleBuilder(module)));
