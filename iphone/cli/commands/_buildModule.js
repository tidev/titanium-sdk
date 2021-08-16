/**
 * iOS module build command.
 *
 * @module cli/_buildModule
 *
 * @copyright
 * Copyright (c) 2014-2020 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

'use strict';

const { spawn } = require('child_process'); // eslint-disable-line security/detect-child-process

const appc = require('node-appc'),
	archiver = require('archiver'),
	async = require('async'),
	Builder = require('node-titanium-sdk/lib/builder'),
	ioslib = require('ioslib'),
	iosPackageJson = appc.pkginfo.package(module),
	jsanalyze = require('node-titanium-sdk/lib/jsanalyze'),
	ejs = require('ejs'),
	fs = require('fs-extra'),
	markdown = require('markdown').markdown,
	path = require('path'),
	temp = require('temp'),
	util = require('util'),
	xcodeParser = require('xcode/lib/parser/pbxproj'),
	__ = appc.i18n(__dirname).__,
	series = appc.async.series,
	xcode = require('xcode');

const plist = require('simple-plist');
const parsePlist = util.promisify(plist.readFile);

function iOSModuleBuilder() {
	Builder.apply(this, arguments);
}

util.inherits(iOSModuleBuilder, Builder);

iOSModuleBuilder.prototype.validate = function validate(logger, config, cli) {
	Builder.prototype.config.apply(this, arguments);
	Builder.prototype.validate.apply(this, arguments);

	// cli.manifest is set by the --project-dir option's callback in cli/commands/build.js
	this.manifest      = cli.manifest;
	this.moduleId      = cli.manifest.moduleid;
	this.moduleName    = cli.manifest.name;
	this.moduleIdAsIdentifier = this.scrubbedName(this.moduleId);
	this.moduleVersion = cli.manifest.version;
	this.isMacOSEnabled  = this.detectMacOSTarget();
	this.moduleGuid    = cli.manifest.guid;
	this.isFramework   = fs.existsSync(path.join(this.projectDir, 'Info.plist')); // TODO: There MUST be a better way to determine if it's a framework (Swift)

	this.buildOnly     = cli.argv['build-only'];
	this.xcodeEnv      = null;
	const sdkModuleAPIVersion = cli.sdk.manifest && cli.sdk.manifest.moduleAPIVersion && cli.sdk.manifest.moduleAPIVersion['iphone'];
	if (this.manifest.apiversion && sdkModuleAPIVersion && this.manifest.apiversion !== sdkModuleAPIVersion) {
		logger.error(__('The module manifest apiversion is currently set to %s', this.manifest.apiversion));
		logger.error(__('Titanium SDK %s iOS module apiversion is at %s', this.titaniumSdkVersion, sdkModuleAPIVersion));
		logger.error(__('Please update module manifest apiversion to match Titanium SDK module apiversion.'));
		process.exit(1);
	}

	return function (finished) {
		ioslib.detect({
			// env
			xcodeSelect:       config.get('osx.executables.xcodeSelect'),
			security:          config.get('osx.executables.security'),
			// provisioning
			profileDir:        config.get('ios.profileDir'),
			// xcode
			searchPath:        config.get('paths.xcode'),
			minIosVersion:     iosPackageJson.minIosVersion,
			supportedVersions: iosPackageJson.vendorDependencies.xcode
		}, function (err, iosInfo) {
			this.iosInfo = iosInfo;
			this.xcodeEnv = this.iosInfo.selectedXcode;

			if (!this.xcodeEnv) {
				// this should never happen
				logger.error(__('Unable to find suitable Xcode install') + '\n');
				process.exit(1);
			}

			finished();
		}.bind(this));
	}.bind(this);
};

iOSModuleBuilder.prototype.detectMacOSTarget = function detectMacOSTarget() {
	if (this.manifest.mac !== undefined) {
		return this.manifest.mac === 'true';
	}
	const pbxFilePath = path.join(this.projectDir, `${this.moduleName}.xcodeproj`, 'project.pbxproj');

	if (!fs.existsSync(pbxFilePath)) {
		this.logger.warn(__(`The Xcode project does not contain the default naming scheme. This is required to detect macOS targets in your module.\nPlease rename your Xcode project to "${this.moduleName}.xcodeproj"`));
		return true;
	}

	let isMacOSEnabled = true;
	const proj = xcode.project(pbxFilePath).parseSync();
	const configurations = proj.hash.project.objects.XCBuildConfiguration;

	for (const key of Object.keys(proj.hash.project.objects.XCBuildConfiguration)) {
		const configuration = configurations[key];
		if (typeof configuration === 'object' && configuration.buildSettings.SUPPORTS_MACCATALYST) {
			isMacOSEnabled = configuration.buildSettings.SUPPORTS_MACCATALYST === 'YES';
			break;
		}
	}

	return isMacOSEnabled;
};

iOSModuleBuilder.prototype.generateXcodeUuid = function generateXcodeUuid(xcodeProject) {
	// normally we would want truly unique ids, but we want predictability so that we
	// can detect when the project has changed and if we need to rebuild the app
	if (!this.xcodeUuidIndex) {
		this.xcodeUuidIndex = 1;
	}
	const id = appc.string.lpad(this.xcodeUuidIndex++, 24, '0');
	if (xcodeProject && xcodeProject.allUuids().indexOf(id) >= 0) {
		return this.generateXcodeUuid(xcodeProject);
	} else {
		return id;
	}
};

iOSModuleBuilder.prototype.run = function run(logger, config, cli, finished) {
	Builder.prototype.run.apply(this, arguments);

	series(this, [
		function (next) {
			cli.emit('build.module.pre.construct', this, next);
		},

		'doAnalytics',
		'initialize',
		'loginfo',

		function (next) {
			cli.emit('build.module.pre.compile', this, next);
		},

		'processLicense',
		'processTiXcconfig',
		'compileJS',
		'buildModule',
		'createUniversalBinary',
		function (next) {
			// eslint-disable-next-line promise/no-callback-in-promise
			this.verifyBuildArch().then(next).catch(next);
		},
		'packageModule',
		function (next) {
			this.runModule(cli, next);
		},

		function (next) {
			cli.emit('build.module.post.compile', this, next);
		}
	], function (err) {
		cli.emit('build.module.finalize', this, function () {
			finished(err);
		});
	});
};

iOSModuleBuilder.prototype.doAnalytics = function doAnalytics() {
	const cli = this.cli,
		eventName = 'ios.' + cli.argv.type;

	cli.addAnalyticsEvent(eventName, {
		name:        this.moduleName,
		publisher:   this.manifest.author,
		appid:       this.moduleId,
		description: this.manifest.description,
		type:        this.cli.argv.type,
		guid:        this.moduleGuid,
		version:     this.moduleVersion,
		copyright:   this.manifest.copyright,
		date:        new Date().toDateString()
	});
};

iOSModuleBuilder.prototype.initialize = function initialize() {
	this.moduleIdAsIdentifier
		= this.moduleId
			.replace(/[\s-]/g, '_')
			.replace(/_+/g, '_')
			.split(/\./)
			.map(function (s) {
				return s.substring(0, 1).toUpperCase() + s.substring(1);
			}).join('');
	this.tiSymbols = {};
	this.metaData = [];
	this.metaDataFile = path.join(this.projectDir, 'metadata.json');
	this.manifestFile = path.join(this.projectDir, 'manifest');
	this.distDir = path.join(this.projectDir, 'dist');
	this.templatesDir = path.join(this.platformPath, 'templates');
	this.assetsTemplateFile = path.join(this.templatesDir, 'module', this.isFramework ? 'swift' : 'objc', 'template', 'ios', 'Classes', '{{ModuleIdAsIdentifier}}ModuleAssets.m.ejs');
	this.universalBinaryDir = path.join(this.projectDir, 'build');

	[ 'assets', 'documentation', 'example', 'platform', 'Resources' ].forEach(function (folder) {
		var dirName = folder.toLowerCase() + 'Dir';
		this[dirName] = path.join(this.projectDir, folder);
		if (!fs.existsSync(this[dirName])) {
			this[dirName] = path.join(this.projectDir, '..', folder);
		}
	}, this);

	this.hooksDir = path.join(this.projectDir, 'hooks');
	this.sharedHooksDir = path.resolve(this.projectDir, '..', 'hooks');

	this.licenseDefault = 'TODO: place your license here and we\'ll include it in the module distribution';
	this.licenseFile = path.join(this.projectDir, 'LICENSE');
	if (!fs.existsSync(this.licenseFile)) {
		this.licenseFile = path.join(this.projectDir, '..', 'LICENSE');
	}

	this.tiXcconfig = {};
	this.tiXcconfigFile = path.join(this.projectDir, 'titanium.xcconfig');

	this.moduleXcconfigFile = path.join(this.projectDir, 'module.xcconfig');
};

iOSModuleBuilder.prototype.loginfo = function loginfo() {
	this.logger.debug(__('Titanium SDK iOS directory: %s', this.platformPath.cyan));
	this.logger.info(__('Project directory: %s', this.projectDir.cyan));
	this.logger.info(__('Module ID: %s', this.moduleId.cyan));
	this.logger.info(__('Module Type: ' + (this.isFramework ? 'Framework (Swift)' : 'Static Library (Objective-C)')));
};

iOSModuleBuilder.prototype.dirWalker = function dirWalker(currentPath, callback) {
	fs.readdirSync(currentPath).forEach(function (name, i, arr) {
		var currentFile = path.join(currentPath, name);
		if (fs.statSync(currentFile).isDirectory()) {
			this.dirWalker(currentFile, callback);
		} else {
			callback(currentFile, name, i, arr);
		}
	}, this);
};

iOSModuleBuilder.prototype.processLicense = function processLicense() {
	if (fs.existsSync(this.licenseFile) && fs.readFileSync(this.licenseFile).toString().indexOf(this.licenseDefault) !== -1) {
		this.logger.warn(__('Please update the LICENSE file with your license text before distributing.'));
	}
};

iOSModuleBuilder.prototype.processTiXcconfig = function processTiXcconfig(next) {
	const srcFile = path.join(this.projectDir, this.moduleName + '.xcodeproj', 'project.pbxproj');
	const xcodeProject = xcode.project(path.join(this.projectDir, this.moduleName + '.xcodeproj', 'project.pbxproj'));
	const contents = fs.readFileSync(srcFile).toString();
	const appName = this.moduleIdAsIdentifier;

	if (this.isFramework && !contents.includes('TitaniumKit.xcframework')) {
		this.logger.warn(`Module created with sdk < 9.2.0, need to add TitaniumKit.xcframework. The ${this.moduleName}.xcodeproj has been updated.`);

		xcodeProject.hash = xcodeParser.parse(contents);
		const xobjs = xcodeProject.hash.project.objects,
			projectUuid = xcodeProject.hash.project.rootObject,
			pbxProject = xobjs.PBXProject[projectUuid],
			mainTargetUuid = pbxProject.targets.filter(function (t) { return t.comment.replace(/^"/, '').replace(/"$/, '') === appName; })[0].value,
			mainGroupChildren = xobjs.PBXGroup[pbxProject.mainGroup].children,
			buildPhases = xobjs.PBXNativeTarget[mainTargetUuid].buildPhases,
			frameworksGroup = xobjs.PBXGroup[mainGroupChildren.filter(function (child) { return child.comment === 'Frameworks'; })[0].value],
			// we lazily find the frameworks and embed frameworks uuids by working our way backwards so we don't have to compare comments
			frameworksBuildPhase = xobjs.PBXFrameworksBuildPhase[
				buildPhases.filter(phase => xobjs.PBXFrameworksBuildPhase[phase.value])[0].value
			],
			frameworkFileRefUuid = this.generateXcodeUuid(xcodeProject),
			frameworkBuildFileUuid = this.generateXcodeUuid(xcodeProject);

		xobjs.PBXFileReference[frameworkFileRefUuid] = {
			isa: 'PBXFileReference',
			lastKnownFileType: 'wrapper.xcframework',
			name: '"TitaniumKit.xcframework"',
			path: '"$(TITANIUM_SDK)/iphone/Frameworks/TitaniumKit.xcframework"',
			sourceTree: '"<absolute>"'
		};
		xobjs.PBXFileReference[frameworkFileRefUuid + '_comment'] = 'TitaniumKit.xcframework';

		xobjs.PBXBuildFile[frameworkBuildFileUuid] = {
			isa: 'PBXBuildFile',
			fileRef: frameworkFileRefUuid,
			fileRef_comment: 'TitaniumKit.xcframework'
		};
		xobjs.PBXBuildFile[frameworkBuildFileUuid + '_comment'] = 'TitaniumKit.xcframework in Frameworks';

		frameworksBuildPhase.files.push({
			value: frameworkBuildFileUuid,
			comment: xobjs.PBXBuildFile[frameworkBuildFileUuid + '_comment']
		});

		frameworksGroup.children.push({
			value: frameworkFileRefUuid,
			comment: 'TitaniumKit.xcframework'
		});

		const updatedContent = xcodeProject.writeSync();

		fs.writeFileSync(srcFile, updatedContent);
	}

	const re = /^(\S+)\s*=\s*(.*)$/,
		bindingReg = /\$\(([^$]+)\)/g;

	if (fs.existsSync(this.tiXcconfigFile)) {
		const contents = fs.readFileSync(this.tiXcconfigFile).toString();
		// with move to 8.0.0, we needed to add FRAMEWORK_SEARCH_PATHS to titanium.xcconfig
		if (!contents.includes('FRAMEWORK_SEARCH_PATHS = $(inherited) "$(TITANIUM_SDK)/iphone/Frameworks/**"')) {
			this.logger.warn(`Build may fail due to missing FRAMEWORK_SEARCH_PATHS value in ${this.tiXcconfigFile.cyan}
Please append the following line to that file:

FRAMEWORK_SEARCH_PATHS = $(inherited) "$(TITANIUM_SDK)/iphone/Frameworks/**"`);
		}
		contents.split('\n').forEach(function (line) {
			const match = line.match(re);
			if (match) {
				const keyList = [];
				let value = match[2].trim();

				let bindingMatch = bindingReg.exec(value);
				if (bindingMatch) {
					while (bindingMatch) {
						keyList.push(bindingMatch[1]);
						bindingMatch = bindingReg.exec(value);
					}

					keyList.forEach(function (key) {
						if (this.tiXcconfig[key]) {
							value = value.replace('$(' + key + ')', this.tiXcconfig[key]);
						}
					}, this);
				}
				this.tiXcconfig[match[1].trim()] = value;
			}
		}, this);
	}

	next();
};

iOSModuleBuilder.prototype.compileJS = function compileJS(next) {
	this.jsFilesToEncrypt = [];

	const moduleJS = this.moduleId + '.js',
		jsFile = path.join(this.assetsDir, moduleJS),
		renderData = {
			moduleIdAsIdentifier: this.moduleIdAsIdentifier,
			mainEncryptedAssetReturn: 'return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[0]);',
			allEncryptedAssetsReturn: 'NSNumber *index = [map objectForKey:path];'
				+ '\n  if (index == nil) {\n    return nil;\n  }'
				+ '\n  return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[index.integerValue]);'
		},
		titaniumPrepHook = this.cli.createHook('build.ios.titaniumprep', this, function (exe, args, opts, done) {
			const jsFilesToEncrypt = opts.jsFiles,
				placeHolderName = opts.placeHolder;
			let tries = 0,
				completed = false;

			this.logger.info('Encrypting JavaScript files: %s', (exe + ' "' + args.slice(0, -1).join('" "') + '"').cyan);
			jsFilesToEncrypt.forEach(function (file) {
				this.logger.debug(__('Preparing %s', file.cyan));
			}, this);

			async.whilst(
				function (cb) {
					if (tries > 3) {
						// we failed 3 times, so just give up
						this.logger.error(__('titanium_prep failed to complete successfully'));
						this.logger.error(__('Try cleaning this project and build again') + '\n');
						process.exit(1);
					}
					return cb(null, !completed);
				},
				function (cb) {
					const child = spawn(exe, args, opts),
						relativePaths = [],
						basepath = args[1];
					let out = '';

					// titanium_prep is dumb and assumes all paths are relative to the assets dir we passed in as an argument
					// So we *must* chop the paths down to relative paths
					jsFilesToEncrypt.forEach(function (file) {
						relativePaths.push(path.relative(basepath, file));
					}, this);

					child.stdin.write(relativePaths.join('\n'));
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

	const tasks = [
		// 1. compile module js
		function (cb) {
			fs.existsSync(jsFile) && this.jsFilesToEncrypt.push(jsFile);

			if (!this.jsFilesToEncrypt.length) {
				renderData.mainEncryptedAsset = '';
				renderData.mainEncryptedAssetReturn = 'return nil;';
				return cb();
			}

			fs.ensureDirSync(this.assetsDir);

			titaniumPrepHook(
				path.join(this.platformPath, 'titanium_prep'),
				[ this.moduleId, this.assetsDir, this.moduleGuid ],
				{ jsFiles: this.jsFilesToEncrypt, placeHolder: 'mainEncryptedAsset' },
				cb
			);
		},

		// 2. compile all other js files in assets dir
		function (cb) {
			try {
				if (!fs.existsSync(this.assetsDir)) {
					throw new Error();
				}

				this.dirWalker(this.assetsDir, function (file) {
					if (path.extname(file) === '.js' && this.jsFilesToEncrypt.indexOf(file) === -1) {
						this.jsFilesToEncrypt.push(file);
					}
				}.bind(this));

				const jsFilesCount = this.jsFilesToEncrypt.length;

				if (jsFilesCount === 0 || (fs.existsSync(jsFile) && jsFilesCount === 1)) {
					throw new Error();
				}

				titaniumPrepHook(
					path.join(this.platformPath, 'titanium_prep'),
					[ this.moduleId, this.assetsDir, this.moduleGuid ],
					{ jsFiles: this.jsFilesToEncrypt, placeHolder: 'allEncryptedAssets' },
					cb
				);
			} catch (e) {
				renderData.allEncryptedAssets = renderData.mainEncryptedAsset;
				renderData.allEncryptedAssetsReturn = 'return nil;';
				cb();
			}
		},

		// 3. write encrypted data to template
		function (cb) {
			const data = ejs.render(fs.readFileSync(this.assetsTemplateFile).toString(), renderData),
				moduleAssetsDir = path.join(this.projectDir, 'Classes'),
				moduleAssetsFile = path.join(moduleAssetsDir, this.moduleIdAsIdentifier + 'ModuleAssets.m');

			this.logger.debug(__('Writing module assets file: %s', moduleAssetsFile.cyan));
			fs.ensureDirSync(moduleAssetsDir);
			fs.writeFileSync(moduleAssetsFile, data);
			cb();
		},

		// 4. generate exports
		function (cb) {
			this.jsFilesToEncrypt.forEach(function (file) {
				const r = jsanalyze.analyzeJsFile(file, { minify: true });
				this.tiSymbols[file] = r.symbols;
				this.metaData.push.apply(this.metaData, r.symbols);
			}.bind(this));

			fs.existsSync(this.metaDataFile) && fs.unlinkSync(this.metaDataFile);
			fs.writeFileSync(this.metaDataFile, JSON.stringify({ exports: this.metaData }));

			cb();
		}
	];

	appc.async.series(this, tasks, next);
};

iOSModuleBuilder.prototype.buildModule = function buildModule(next) {
	const opts = {
		cwd: this.projectDir,
		env: {}
	};
	Object.keys(process.env).forEach(function (key) {
		opts.env[key] = process.env[key];
	});
	opts.env.DEVELOPER_DIR = this.xcodeEnv.path;

	const xcodebuildHook = this.cli.createHook('build.module.ios.xcodebuild', this, function (exe, args, opts, type, done) {
		this.logger.debug(__('Running: %s', ('DEVELOPER_DIR=' + opts.env.DEVELOPER_DIR + ' ' + exe + ' ' + args.join(' ')).cyan));
		const p = spawn(exe, args, opts),
			out = [],
			err = [];
		let stopOutputting = false;

		p.stdout.on('data', function (data) {
			data.toString().split('\n').forEach(function (line) {
				if (line.length) {
					out.push(line);
					if (line.indexOf('Failed to minify') !== -1) {
						stopOutputting = true;
					}
					if (!stopOutputting) {
						this.logger.trace('[' + type + '] ' + line);
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

		p.on('close', function (code) {
			if (code) {
				// just print the entire error buffer
				err.forEach(function (line) {
					this.logger.error('[' + type + '] ' + line);
				}, this);
				this.logger.log();
				if (type === 'xcode-macos') {
					this.logger.info(__('To exclude mac target, set/add mac: false in manifest file.'));
				}
				process.exit(1);
			}

			// end of the line
			done(code);
		}.bind(this));
	}.bind(this));

	const xcBuild = this.xcodeEnv.executables.xcodebuild;

	const xcodeBuildArgumentsForTarget = function (target) {
		let args = [
			'archive',
			'-configuration', 'Release',
			'-sdk', target,
			'-archivePath', path.join(this.projectDir, 'build', target + '.xcarchive'),
			'-UseNewBuildSystem=YES',
			'ONLY_ACTIVE_ARCH=NO',
			'SKIP_INSTALL=NO',
		];

		if (this.isFramework) {
			args.push('BUILD_LIBRARY_FOR_DISTRIBUTION=YES');
		}

		const scheme = this.isFramework ? this.moduleIdAsIdentifier : this.moduleName;
		args.push('-scheme');
		args.push(scheme);

		if (target === 'macosx') {
			args.push('SUPPORTS_MACCATALYST=YES');
		}

		if (target === 'iphonesimulator') {
			// Search for third party framewrok included in module. If found any, exclude arm64 from simulator build.
			// Assumption is that simulator arm64  architecture can only be supported via .xcframework.
			const frameworksPath = path.join(this.projectDir, 'platform');
			const legacyFrameworks = new Set();

			if (fs.existsSync(frameworksPath)) {
				fs.readdirSync(frameworksPath).forEach(filename => {
					if (filename.endsWith('.framework')) {
						legacyFrameworks.add(filename);
					}
				});
			}
			if (legacyFrameworks.size > 0) {
				const pbxFilePath = path.join(this.projectDir, `${this.moduleName}.xcodeproj`, 'project.pbxproj');
				const proj = xcode.project(pbxFilePath).parseSync();
				const configurations = proj.hash.project.objects.XCBuildConfiguration;
				let excludeArchs = 'EXCLUDED_ARCHS=arm64 ';

				// Merge with excluded archs in xcode setting
				for (const key of Object.keys(proj.hash.project.objects.XCBuildConfiguration)) {
					const configuration = configurations[key];
					if (typeof configuration === 'object' && configuration.name === 'Release' && configuration.buildSettings.EXCLUDED_ARCHS) {
						let archs = configuration.buildSettings.EXCLUDED_ARCHS;  // e.g. "i386 arm64 x86_64"
						archs = archs.replace(/["]/g, '');
						excludeArchs = excludeArchs.concat(archs);
						break;
					}
				}

				args.push(excludeArchs);
				this.logger.warn(__(`The module is using frameworks (${Array.from(legacyFrameworks)}) that do not support simulator arm64. Excluding simulator arm64. The app using this module may fail if you're on an arm64 Apple Silicon device.`));
			}
		}

		return args;
	}.bind(this);

	this.cli.env.getOSInfo(osInfo => {
		const macOsVersion = osInfo.osver;

		// 1. Create a build for the simulator
		xcodebuildHook(xcBuild, xcodeBuildArgumentsForTarget('iphonesimulator'), opts, 'xcode-sim', () => {
			// 2. Create a build for device
			xcodebuildHook(xcBuild, xcodeBuildArgumentsForTarget('iphoneos'), opts, 'xcode-dist', () => {
				const osVersionParts = macOsVersion.split('.').map(n => parseInt(n));
				if (osVersionParts[0] > 10 || (osVersionParts[0] === 10 && osVersionParts[1] >= 15)) {
					// 3. Create a build for the mac-catalyst if enabled
					if (this.isMacOSEnabled) {
						xcodebuildHook(xcBuild, xcodeBuildArgumentsForTarget('macosx'), opts, 'xcode-macos', next);
					} else {
						this.logger.info(__('macOS support disabled in Xcode project. Skipping …'));
						next();
					}
				} else {
					this.logger.warn(__('Ignoring build for mac as mac target is < 10.15'));
					next();
				}
			});
		});
	});
};

iOSModuleBuilder.prototype.createUniversalBinary = function createUniversalBinary(next) {
	this.logger.info(__('Creating universal library'));

	const moduleId = this.isFramework ? this.moduleIdAsIdentifier : this.moduleId;
	const findLib = function (dest) {
		let libPath = this.isFramework ? '.xcarchive/Products/Library/Frameworks/' + moduleId + '.framework' : '.xcarchive/Products/usr/local/lib/lib' + this.moduleId + '.a';

		const lib = path.join(this.projectDir, 'build', dest + libPath);
		this.logger.info(__('Looking for ' + lib));

		if (!fs.existsSync(lib)) {
			// unfortunately the initial module project template incorrectly
			// used the camel-cased module id
			libPath = '.xcarchive/Products/usr/local/lib/lib' + this.moduleIdAsIdentifier + '.a';
			const newLib = path.join(this.projectDir, 'build', dest + libPath);
			this.logger.debug('Searching library: ' + newLib);
			if (!fs.existsSync(newLib)) {
				return new Error(__('Unable to find the built %s library', 'Release-' + dest));
			} else {
				// rename file to 'lib' + moduleId + '.a'
				fs.renameSync(newLib, lib);
			}
		}
		return lib;
	}.bind(this);

	// Create xcframework
	const args = [];

	const headerPath = path.join(this.projectDir, 'build', 'dummyheader/');
	if (!this.isFramework && !fs.existsSync(headerPath)) {
		fs.mkdirSync(headerPath);
	}
	const buildType = this.isFramework ? '-framework' : '-library';

	let lib = findLib('iphoneos');
	if (lib instanceof Error) {
		return next(lib);
	}

	args.push('-create-xcframework');
	args.push(buildType);
	args.push(lib);

	if (!this.isFramework) {
		args.push('-headers');
		args.push(headerPath);
	}

	lib = findLib('iphonesimulator');
	if (lib instanceof Error) {
		return next(lib);
	}
	args.push(buildType);
	args.push(lib);
	if (!this.isFramework) {
		args.push('-headers');
		args.push(headerPath);
	}
	if (this.isMacOSEnabled) {
		lib = findLib('macosx');
		if (lib instanceof Error) {
			this.logger.warn(__('The module is missing macOS support. Ignoring mac target for this module...'));
		} else {
			args.push(buildType);
			args.push(lib);
			if (!this.isFramework) {
				args.push('-headers');
				args.push(headerPath);
			}
		}
	}

	// Wipe the destination folder first to avoid "couldn't be copied" errors on rebuilds
	const xcframeworkDest = path.join(this.projectDir, 'build', moduleId + '.xcframework');
	if (fs.pathExistsSync(xcframeworkDest)) {
		fs.removeSync(xcframeworkDest);
	}

	args.push(
		'-output',
		xcframeworkDest
	);

	this.logger.debug(__('Running: %s', (this.xcodeEnv.executables.xcodebuild + ' ' + args.join(' ')).cyan));
	appc.subprocess.run(this.xcodeEnv.executables.xcodebuild, args, function (code, out, err) {
		if (code) {
			this.logger.error(__('Failed to generate universal binary (code %s):', code));
			this.logger.error(err.trim() + '\n');
			process.exit(1);
		}
		next();
	}.bind(this));
};

iOSModuleBuilder.prototype.verifyBuildArch = async function verifyBuildArch() {
	this.logger.info(__('Verifying universal library'));

	const moduleId = this.isFramework ? this.moduleIdAsIdentifier  : this.moduleId;
	const frameworkPath = path.join(this.projectDir, 'build', moduleId + '.xcframework');
	// Make sure xcframework exists...
	if (!(await fs.pathExists(frameworkPath))) {
		throw new Error(__(`Unable to find "${moduleId}.xcframework"`));
	}

	// Confirm that the library/binary the Info.plist is pointing at actually exists on disk
	const verifyLibraryExists = async (libInfo) => {
		let libraryPath = path.join(frameworkPath, libInfo.LibraryIdentifier, libInfo.LibraryPath);
		if (libraryPath.endsWith('.framework')) {
			const frameworkName = path.basename(libraryPath, '.framework');
			libraryPath = path.join(libraryPath, frameworkName);
		}
		if (!(await fs.pathExists(libraryPath))) {
			throw new Error(__('Unable to find the built library %s', libraryPath));
		}
	};

	// Verify the architectures and platform variants
	const buildArchs = new Set();

	const xcFrameworkInfo = await parsePlist(path.join(frameworkPath, 'Info.plist'));

	// Check iOS device
	const iosDevice = xcFrameworkInfo.AvailableLibraries.find(l => l.SupportedPlatform === 'ios' && !l.SupportedPlatformVariant);
	if (!iosDevice) {
		throw new Error('The module is missing iOS device support.');
	}
	await verifyLibraryExists(iosDevice);
	if (!iosDevice.SupportedArchitectures.includes('arm64')) {
		this.logger.warn(__('The module is missing iOS device 64-bit support.'));
	}
	iosDevice.SupportedArchitectures.forEach(arch => buildArchs.add(arch));

	// Check iOS Simulator
	const iosSim = xcFrameworkInfo.AvailableLibraries.find(l => l.SupportedPlatformVariant === 'simulator');
	if (!iosSim) {
		throw new Error(__('The module is missing iOS simulator support.'));
	}
	await verifyLibraryExists(iosSim);
	if (!iosSim.SupportedArchitectures.includes('arm64')) {
		this.logger.warn(__('The module is missing arm64 iOS simulator support.'));
	}
	iosSim.SupportedArchitectures.forEach(arch => buildArchs.add(arch));

	// MacOS Catalyst support is optional
	const macos = xcFrameworkInfo.AvailableLibraries.find(l => l.SupportedPlatformVariant === 'maccatalyst');
	if (!macos) {
		this.logger.warn(__('The module is missing macOS support.'));
	} else {
		await verifyLibraryExists(macos);
		if (!macos.SupportedArchitectures.includes('arm64')) {
			this.logger.warn(__('The module is missing arm64 macOS support. This will not work on Apple Silicon devices (and is likley due to use of an Xcode that does not support arm64 maccatalyst).'));
		}
	}

	// Spit out the platform variants and their architectures
	for (const libInfo of xcFrameworkInfo.AvailableLibraries) {
		let target;
		if (libInfo.SupportedPlatformVariant === 'maccatalyst') {
			target = 'Mac';
		} else if (libInfo.SupportedPlatformVariant === 'simulator') {
			target = 'Simulator';
		} else {
			target = 'Device';
		}
		this.logger.info(__(`${target} has architectures: ${libInfo.SupportedArchitectures}`));
	}

	// Match against manifest
	// TODO: Drop architectures from manifest altogether now?
	const manifestArchs = new Set(this.manifest.architectures.split(' '));
	if (buildArchs.size !== manifestArchs.size) {
		this.logger.error(__('There is discrepancy between the architectures specified in module manifest and compiled binary.'));
		this.logger.error(__('Architectures in manifest: %s', Array.from(manifestArchs)));
		this.logger.error(__('Compiled binary architectures: %s', Array.from(buildArchs)));
		this.logger.error(__('Please update manifest to match module binary architectures.') + '\n');
		process.exit(1); // TODO: Just throw an Error!
	}
};

iOSModuleBuilder.prototype.packageModule = function packageModule(next) {
	const dest = archiver('zip', {
			forceUTC: true
		}),
		origConsoleError = console.error,
		moduleId = this.moduleId,
		version = this.moduleVersion,
		moduleZipName = [ moduleId, '-iphone-', version, '.zip' ].join(''),
		moduleZipFullPath = path.join(this.distDir, moduleZipName),
		moduleFolders = path.join('modules', 'iphone', moduleId, version),
		binarylibName = this.isFramework ? this.moduleIdAsIdentifier + '.xcframework' : moduleId + '.xcframework',
		binarylibFile = path.join(this.projectDir, 'build', binarylibName);

	this.logger.info(__('binarylibFile is ' + binarylibFile));

	this.moduleZipPath = moduleZipFullPath;

	// since the archiver library didn't set max listeners, we squelch all error output
	console.error = function () {};

	try {
		// if the zip file is there, remove it
		fs.ensureDirSync(this.distDir);
		fs.existsSync(moduleZipFullPath) && fs.unlinkSync(moduleZipFullPath);
		const zipStream = fs.createWriteStream(moduleZipFullPath);
		zipStream.on('close', function () {
			console.error = origConsoleError;
			next();
		});
		dest.catchEarlyExitAttached = true; // silence exceptions
		dest.pipe(zipStream);

		this.logger.info(__('Creating module zip'));

		// 1. documentation folder
		const mdRegExp = /\.md$/;
		if (fs.existsSync(this.documentationDir)) {
			(function walk(dir, parent) {
				if (!fs.existsSync(dir)) {
					return;
				}

				fs.readdirSync(dir).forEach(function (name) {
					const file = path.join(dir, name);
					if (!fs.existsSync(file)) {
						return;
					}
					if (fs.statSync(file).isDirectory()) {
						return walk(file, path.join(parent, name));
					}

					let contents = fs.readFileSync(file).toString();

					if (mdRegExp.test(name)) {
						contents = markdown.toHTML(contents);
						name = name.replace(/\.md$/, '.html');
					}

					dest.append(contents, { name: path.join(parent, name) });
				});
			}(this.documentationDir, path.join(moduleFolders, 'documentation')));
		}

		// 2. example folder
		this.dirWalker(this.exampleDir, function (file) {
			dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'example', path.relative(this.exampleDir, file)) });
		}.bind(this));

		// 3. platform folder
		if (fs.existsSync(this.platformDir)) {
			this.dirWalker(this.platformDir, function (file, name) {
				var stat = fs.statSync(file);
				if (name !== 'README.md') {
					dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'platform', path.relative(this.platformDir, file)), mode: stat.mode });
				}
			}.bind(this));
		}

		// 4. hooks folder
		const hookFiles = {};
		if (fs.existsSync(this.hooksDir)) {
			this.dirWalker(this.hooksDir, function (file) {
				const relFile = path.relative(this.hooksDir, file);
				hookFiles[relFile] = 1;
				dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'hooks', relFile) });
			}.bind(this));
		}
		if (fs.existsSync(this.sharedHooksDir)) {
			this.dirWalker(this.sharedHooksDir, function (file) {
				var relFile = path.relative(this.sharedHooksDir, file);
				if (!hookFiles[relFile]) {
					dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'hooks', relFile) });
				}
			}.bind(this));
		}

		// 5. Resources folder
		if (fs.existsSync(this.resourcesDir)) {
			this.dirWalker(this.resourcesDir, function (file, name) {
				if (name !== 'README.md') {
					dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'Resources', path.relative(this.resourcesDir, file)) });
				}
			}.bind(this));
		}

		// 6. assets folder, not including js files
		if (fs.existsSync(this.assetsDir)) {
			this.dirWalker(this.assetsDir, function (file) {
				if (path.extname(file) !== '.js') {
					dest.append(fs.createReadStream(file), { name: path.join(moduleFolders, 'assets', path.relative(this.assetsDir, file)) });
				}
			}.bind(this));
		}

		// 7. Add the xcframework dir
		// DO NOT WALK THE DIR! Include it as-is to preserve the folder/file symlinks used by mac catalsyt frameworks!
		dest.directory(binarylibFile, path.join(moduleFolders, binarylibName));

		// 8. LICENSE file
		dest.append(fs.createReadStream(this.licenseFile), { name: path.join(moduleFolders, 'LICENSE') });

		// 9. manifest
		dest.append(fs.createReadStream(this.manifestFile), { name: path.join(moduleFolders, 'manifest') });

		// 10. module.xcconfig
		if (fs.existsSync(this.moduleXcconfigFile)) {
			let contents = fs.readFileSync(this.moduleXcconfigFile).toString();

			contents = '// This flag is generated by the module build, do not change it.\nTI_MODULE_VERSION=' + this.moduleVersion + '\n\n' + contents;

			dest.append(contents, { name: path.join(moduleFolders, 'module.xcconfig') });
		}

		// 11. metadata.json
		dest.append(fs.createReadStream(this.metaDataFile), { name: path.join(moduleFolders, 'metadata.json') });

		this.logger.info(__('Writing module zip: %s', moduleZipFullPath));
		dest.finalize();
	} finally {
		console.error = origConsoleError;
	}
};

iOSModuleBuilder.prototype.runModule = function runModule(cli, next) {
	if (this.buildOnly) {
		return next();
	}

	const tmpDir = temp.path('ti-ios-module-build-'),
		tmpProjectDir = path.join(tmpDir, this.moduleName),
		logger = this.logger;

	function log(data) {
		data.toString().split('\n').forEach(function (line) {
			if (line = line.trim()) {
				logger.trace(line);
			}
		});
	}

	function runTiCommand(args, callback) {
		logger.debug(__('Running: %s', ('titanium ' + args.join(' ')).cyan));
		const child = spawn('titanium', args);

		child.stdout.on('data', log);
		child.stderr.on('data', log);

		child.on('close', function (code) {
			if (code) {
				logger.error(__('Failed to run ti %s', args[0]));
				logger.log();
				process.exit(1);
			}
			callback();
		});
	}

	series(this, [
		function (cb) {
			// 1. create temp dir
			fs.ensureDirSync(tmpDir);

			// 2. create temp proj
			this.logger.debug(__('Staging module project at %s', tmpDir.cyan));
			runTiCommand(
				[
					'create',
					'--id', this.moduleId,
					'-n', this.moduleName,
					'-t', 'app',
					'-u', 'localhost',
					'-d', tmpDir,
					'-p', 'ios',
					'--force',
					'--no-prompt',
					'--no-progress-bars',
					'--no-colors'
				],
				cb
			);
		},

		function (cb) {
			this.logger.debug(__('Created temp project %s', tmpProjectDir.cyan));

			// 3. patch tiapp.xml with module id
			const data = fs.readFileSync(path.join(tmpProjectDir, 'tiapp.xml')).toString();
			const result = data.replace(/<modules>/g, '<modules>\n\t\t<module platform="iphone">' + this.moduleId + '</module>');
			fs.writeFileSync(path.join(tmpProjectDir, 'tiapp.xml'), result);

			// 4. copy files in example to Resource
			appc.fs.copyDirSyncRecursive(
				this.exampleDir,
				path.join(tmpProjectDir, 'Resources'),
				{
					preserve: true,
					logger: this.logger.debug
				}
			);

			// 5. unzip module to the tmp dir
			appc.zip.unzip(this.moduleZipPath, tmpProjectDir, null, cb);
		},

		// Emit hook so modules can also alter project before launch
		function (cb) {
			cli.emit('create.module.app.finalize', [ this, tmpProjectDir ], cb);
		},

		function (cb) {
			// 6. run the app
			this.logger.debug(__('Running example project...', tmpDir.cyan));
			runTiCommand(
				[
					'build',
					'-p', 'ios',
					'-d', tmpProjectDir,
					'--no-prompt',
					'--no-colors',
					'--no-progress-bars'
				],
				cb
			);
		}
	], next);
};

iOSModuleBuilder.prototype.scrubbedName = function (name) {
	return name.replace(/[\s-]/g, '_').replace(/_+/g, '_').split(/\./).map(function (s) {
		return s.substring(0, 1).toUpperCase() + s.substring(1);
	}).join('');
};

// create the builder instance and expose the public api
(function (iOSModuleBuilder) {
	exports.validate = iOSModuleBuilder.validate.bind(iOSModuleBuilder);
	exports.run      = iOSModuleBuilder.run.bind(iOSModuleBuilder);
}(new iOSModuleBuilder(module)));
