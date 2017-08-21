/**
 * iOS build hook that scans for available frameworks from modules and in the
 * project folder and then configures them in the Xcode project
 */

const appc = require('node-appc');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const frameworkPattern = /([^/]+)\.framework$/;

const FRAMEWORK_TYPE_STATIC = 'static';
const FRAMEWORK_TYPE_DYNAMIC = 'dynamic';

exports.cliVersion = '>=3.2.1';

exports.init = function (logger, config, cli) {
	let frameworkManager = new FrameworkManager(cli, config, logger);
	frameworkManager.initialize();
};

/**
 * Manages all available frameworks either from modules or the project itself
 *
 * Scans for available frameworks and analyses them to get the required info to
 * properly integrate them into the Xcode project.
 */
class FrameworkManager {

	/**
	 * Constructs a new framework manager
	 *
	 * @param {Object} cli CLI instance
	 * @param {Object} config Project configuration
	 * @param {Object} logger Logger instance
	 */
	constructor(cli, config, logger) {
		this._cli = cli;
		this._config = config;
		this._logger = logger;
		this._builder = null;
		this._frameworks = new Map();
	}

	/**
	 * Initializes the framework manager by hooking into the required build steps
	 */
	initialize() {
		this._cli.on('build.pre.compile', {
			priority: 1200,
			post: (builder, callback) => {
				this._builder = builder;
				this.detectFrameworks().then(() => {
					builder.frameworks = this._frameworks;
					callback();
				}).catch((err) => callback(err));
			}
		});

		this._cli.on('build.ios.xcodeproject', {
			pre: this.addFrameworksToXcodeProject.bind(this)
		});
	}

	/**
	 * Detects all available frameworks
	 *
	 * @return {Promise}
	 */
	detectFrameworks() {
		return Promise.all([
			this.scanModuleFrameworks(),
			this.scanProjectFrameworks()
		]);
	}

	/**
	 * Scans the platform folder from all modules for included frameworks
	 *
	 * @return {Promise}
	 */
	scanModuleFrameworks() {
		let scanPromises = [];
		for (let module of this._builder.modules) {
			let moduleFrameworkPaths = [
				path.join(module.modulePath, 'platform', 'ios', 'Frameworks'),
				path.join(module.modulePath, 'platform', 'iphone', 'Frameworks')
			];
			for (let frameworksPath of moduleFrameworkPaths) {
				let scanPromise = this.scanPathForFrameworks(frameworksPath);
				scanPromises.push(scanPromise);
			}
		}

		return Promise.all(scanPromises);
	}

	/**
	 * Scans the project's platform folder for available frameworks
	 *
	 * This is required for Hyperloop
	 *
	 * @return {Promise}
	 */
	scanProjectFrameworks() {
		let scanPromises = [];
		let projectFrameworkPaths = [
			path.join(this._builder.projectDir, 'platform', 'ios', 'Frameworks'),
			path.join(this._builder.projectDir, 'platform', 'iphone', 'Frameworks'),
		];
		for (let frameworksPath of projectFrameworkPaths) {
			let scanPromise = this.scanPathForFrameworks(frameworksPath);
			scanPromises.push(scanPromise);
		}

		return Promise.all(scanPromises);
	}

	/**
	 * Scans the given path for frameworks and returns framwork info objects for
	 * each framework found
	 *
	 * @param {string} frameworksPath Path to scan for frameworks
	 * @return {Promise}
	 */
	scanPathForFrameworks(frameworksPath) {
		if (!fs.existsSync(frameworksPath)) {
			return Promise.resolve();
		}

		this._logger.trace(`Scanning ${frameworksPath.cyan} for frameworks`);
		let infoPromises = [];
		return new Promise((resolve, reject) => {
			fs.readdir(frameworksPath, (err, files) => {
				if (err) {
					reject(err);
				}

				let frameworkAnalyzer = new FrameworkAnalyzer(this._logger);
				for (let filename of files) {
					let possibleFrameworkPath = path.join(frameworksPath, filename);
					if (frameworkPattern.test(possibleFrameworkPath)) {
						let infoPromise = frameworkAnalyzer.analyze(possibleFrameworkPath).then((frameworkInfo) => {
							if (this._frameworks.has(frameworkInfo.name)) {
								let existingFrameworkInfo = this._frameworks.get(frameworkInfo.name);
								return reject(new Error(`Duplicate framework ${frameworkInfo.name} detected (found at ${frameworkInfo.path.cyan} and ${existingFrameworkInfo.path.cyan}`));
							}
							this._frameworks.set(frameworkInfo.name, frameworkInfo);
						}, reject);
						infoPromises.push(infoPromise);
					}
				}

				Promise.all(infoPromises).then(resolve, reject);
			});
		});
	}

	/**
	 * Adds all found framworks to the Xcode project
	 *
	 * @param {Object} hookData Data from the Xcode project hook
	 * @param {Function} callback Callback function
	 */
	addFrameworksToXcodeProject(hookData, callback) {
		if (this._frameworks.size === 0) {
			return callback();
		}

		let xcodeProject = hookData.args[0];
		let frameworkIntegrator = new FrameworkIntegrator(xcodeProject, this._builder, this._logger);
		for (let frameworkInfo of this._frameworks.values()) {
			this._logger.trace(`Integrating ${frameworkInfo.type} framework "${frameworkInfo.name}" into Xcode project.`);
			frameworkIntegrator.integrateFramework(frameworkInfo);
		}

		if (this.hasFrameworksWithFatBinary()) {
			this._logger.trace('Framework with fat binary present, integrating script to strip invalid architectures.');
			frameworkIntegrator.integrateStripFrameworksScript();
		}

		frameworkIntegrator.adjustRunpathSearchPath();

		callback();
	}

	/**
	 * Checks all found dyanmic frameworks if any of them include both device and
	 * simulator architectures
	 *
	 * @return {Boolean} True if device and simulator archs were found, false otherwise
	 */
	hasFrameworksWithFatBinary() {
		let deviceArchitectures = new Set(['armv7', 'arm64']);
		let simulatorArchitectures = new Set(['i386', 'x86_64']);
		let hasDeviceArchitectures = false;
		let hasSimulatorArchitectures = false;

		for (let frameworkInfo of this._frameworks.values()) {
			if (frameworkInfo.type !== FRAMEWORK_TYPE_DYNAMIC) {
				continue;
			}

			for (let deviceArchitecture of deviceArchitectures) {
				if (frameworkInfo.architectures.has(deviceArchitecture)) {
					hasDeviceArchitectures = true;
					break;
				}
			}

			for (let simulatorArchitecture of simulatorArchitectures) {
				if (frameworkInfo.architectures.has(simulatorArchitecture)) {
					hasSimulatorArchitectures = true;
					break;
				}
			}

			if (hasDeviceArchitectures && hasSimulatorArchitectures) {
				return true;
			}
		}

		return false;
	}
}

/**
 * Integrates frameworks into a Xcode project by adding the required build phases
 * and adjusting build settings
 */
class FrameworkIntegrator {

	/**
	 * Constructs a new framework integrator
	 *
	 * @param {Object} xcodeProject Parsed Xcode project from node-xcode
	 * @param {Object} builder iOS builder instance
	 * @param {Object} logger Appc logger instance
	 */
	constructor(xcodeProject, builder, logger) {
		this._builder = builder;
		this._logger = logger;

		this._xcodeProject = xcodeProject;
		this._xobjs = xcodeProject.hash.project.objects;
		this._projectUuid = xcodeProject.hash.project.rootObject;
		this._pbxProject = this._xobjs.PBXProject[this._projectUuid];
		this._mainTargetUuid = this._pbxProject.targets.filter((target) => { return target.comment.replace(/^"/, '').replace(/"$/, '') === this._builder.tiapp.name; })[0].value;
		this._mainTarget = this._xobjs.PBXNativeTarget[this._mainTargetUuid];
		this._mainGroupChildren = this._xobjs.PBXGroup[this._pbxProject.mainGroup].children;
		this._frameworksGroup = this._xobjs.PBXGroup[this._mainGroupChildren.filter(function (child) { return child.comment === 'Frameworks'; })[0].value];
		this._frameworksBuildPhase = this._xobjs.PBXFrameworksBuildPhase[this._mainTarget.buildPhases.filter((phase) => { return this._xobjs.PBXFrameworksBuildPhase[phase.value]; })[0].value];

		this._frameworkSearchPaths = new Map();
		this._runpathSearchPaths = new Map();
		let buildConfigurations = this._xobjs.XCConfigurationList[this._mainTarget.buildConfigurationList].buildConfigurations;
		for (let buildConf of buildConfigurations) {
			if (!this._frameworkSearchPaths.has(buildConf.value)) {
				this._frameworkSearchPaths.set(buildConf.value, new Set());
				this._runpathSearchPaths.set(buildConf.value, new Set());
			}

			var buildSettings = this._xobjs.XCBuildConfiguration[buildConf.value].buildSettings;
			if (Array.isArray(buildSettings.FRAMEWORK_SEARCH_PATHS)) {
				let frameworkSearchPaths = this._frameworkSearchPaths.get(buildConf.value);
				for (let frameworkSearchPath of buildSettings.FRAMEWORK_SEARCH_PATHS) {
					let cleanFrameworkSearchPath = frameworkSearchPath.replace('"', '');
					if (!frameworkSearchPaths.has(cleanFrameworkSearchPath)) {
						frameworkSearchPaths.add(cleanFrameworkSearchPath);
					}
				}
			}

			if (Array.isArray(buildSettings.LD_RUNPATH_SEARCH_PATHS)) {
				let runpathSearchPaths = this._runpathSearchPaths.get(buildConf.value);
				for (let runpathSearchPath of buildSettings.LD_RUNPATH_SEARCH_PATHS) {
					let cleanRunpathSearchPath = runpathSearchPath.replace(/"/g, '');
					if (!runpathSearchPaths.has(cleanRunpathSearchPath)) {
						runpathSearchPaths.add(cleanRunpathSearchPath);
					}
				}
			}
		}
	}

	/**
	 * Integrates a frameworks into the Xcode project by adding the required
	 * build phases and adjusting the framework search path
	 *
	 * @param {FrameworkInfo} frameworkInfo
	 */
	integrateFramework(frameworkInfo) {
		let fileRefUuid = this.addFrameworkFileReference(frameworkInfo);
		this.addLinkFrameworkBuildPhase(frameworkInfo, fileRefUuid);
		if (frameworkInfo.type === FRAMEWORK_TYPE_DYNAMIC) {
			this.addEmbeddFrameworkBuildPhase(frameworkInfo, fileRefUuid);
		}
		this.addFrameworkSearchPath(path.dirname(frameworkInfo.path));
	}

	/**
	 * Add the framework as a new file reference to the Xcode project
	 *
	 * @param {frameworkInfo} frameworkInfo
	 * @return {string} Uuid of the created file reference
	 */
	addFrameworkFileReference(frameworkInfo) {
		let frameworkPackageName = frameworkInfo.name + '.framework';
		let fileRefUuid = this._builder.generateXcodeUuid();
		this._xobjs.PBXFileReference[fileRefUuid] = {
			isa: 'PBXFileReference',
			lastKnownFileType: 'wrapper.framework',
			name: '"' + frameworkPackageName + '"',
			path: '"' + frameworkInfo.path + '"',
			sourceTree: '"<absolute>"'
		};
		this._xobjs.PBXFileReference[fileRefUuid + '_comment'] = frameworkPackageName;
		this._frameworksGroup.children.push({
			value: fileRefUuid,
			comment: frameworkPackageName
		});

		return fileRefUuid;
	}

	/**
	 * Adds the framework to the project's link frameworks build phase
	 *
	 * @param {frameworkInfo} frameworkInfo
	 * @param {string} fileRefUuid Uuid of the frameworks file reference inside the Xcode project
	 */
	addLinkFrameworkBuildPhase(frameworkInfo, fileRefUuid) {
		let frameworkPackageName = frameworkInfo.name + '.framework';
		var buildFileUuid = this._builder.generateXcodeUuid();
		this._xobjs.PBXBuildFile[buildFileUuid] = {
			isa: 'PBXBuildFile',
			fileRef: fileRefUuid,
			fileRef_comment: frameworkPackageName
		};
		this._xobjs.PBXBuildFile[buildFileUuid + '_comment'] = frameworkPackageName + ' in Frameworks';
		this._frameworksBuildPhase.files.push({
			value: buildFileUuid,
			comment: frameworkPackageName + ' in Frameworks'
		});
	}

	/**
	 * Adds the frameworks to the project's embedd frameworks build phase
	 *
	 * @param {frameworkInfo} frameworkInfo
	 * @param {string} fileRefUuid Uuid of the frameworks file reference inside the Xcode project
	 */
	addEmbeddFrameworkBuildPhase(frameworkInfo, fileRefUuid) {
		let frameworkPackageName = frameworkInfo.name + '.framework';
		var embeddedBuildFileUuid = this._builder.generateXcodeUuid();
		this._xobjs.PBXBuildFile[embeddedBuildFileUuid] = {
			isa: 'PBXBuildFile',
			fileRef: fileRefUuid,
			fileRef_comment: frameworkPackageName,
			settings: {ATTRIBUTES: ['CodeSignOnCopy']}
		};
		this._xobjs.PBXBuildFile[embeddedBuildFileUuid + '_comment'] = frameworkPackageName + ' in Embed Frameworks';

		var embedFrameworksBuildPhase = null;
		for (let phase of this._mainTarget.buildPhases) {
			if (phase.comment === 'Embed Frameworks') {
				embedFrameworksBuildPhase = this._xobjs.PBXCopyFilesBuildPhase[phase.value];
				break;
			}
		}
		if (embedFrameworksBuildPhase === null) {
			var embedFrameworksBuildPhaseUuid = this._builder.generateXcodeUuid();
			embedFrameworksBuildPhase = {
				isa: 'PBXCopyFilesBuildPhase',
				buildActionMask: 2147483647,
				dstPath: '""',
				dstSubfolderSpec: 10,
				files: [],
				name: '"Embed Frameworks"',
				runOnlyForDeploymentPostprocessing: 0
			};
			this._xobjs.PBXCopyFilesBuildPhase = this._xobjs.PBXCopyFilesBuildPhase || {};
			this._xobjs.PBXCopyFilesBuildPhase[embedFrameworksBuildPhaseUuid] = embedFrameworksBuildPhase;
			this._xobjs.PBXCopyFilesBuildPhase[embedFrameworksBuildPhaseUuid + '_comment'] = 'Embed Frameworks';
			this._mainTarget.buildPhases.push(embedFrameworksBuildPhaseUuid);
		}
		embedFrameworksBuildPhase.files.push({
			value: embeddedBuildFileUuid,
			comment: frameworkPackageName + ' in Embed Frameworks'
		});
	}

	/**
	 * Adds the given paths to the framework search paths build setting
	 *
	 * @param {Set<string>} frameworkSearchPaths
	 */
	addFrameworkSearchPath(frameworkSearchPath) {
		let buildConfigurations = this._xobjs.XCConfigurationList[this._mainTarget.buildConfigurationList].buildConfigurations;
		for (let buildConf of buildConfigurations) {
			let frameworkSearchPaths = this._frameworkSearchPaths.get(buildConf.value);
			if (frameworkSearchPaths.has(frameworkSearchPath)) {
				continue;
			}

			let buildSettings = this._xobjs.XCBuildConfiguration[buildConf.value].buildSettings;
			buildSettings.FRAMEWORK_SEARCH_PATHS = buildSettings.FRAMEWORK_SEARCH_PATHS || ['"$(inherited)"'];
			buildSettings.FRAMEWORK_SEARCH_PATHS.push('"\\"' + frameworkSearchPath + '\\""');
			frameworkSearchPaths.add(frameworkSearchPath);
		}
	}

	adjustRunpathSearchPath() {
		let dynamicFrameworksRunpath = '@executable_path/Frameworks';
		let buildConfigurations = this._xobjs.XCConfigurationList[this._mainTarget.buildConfigurationList].buildConfigurations;
		for (let buildConf of buildConfigurations) {
			let runpathSearchPaths = this._runpathSearchPaths.get(buildConf.value);
			if (runpathSearchPaths.has(dynamicFrameworksRunpath)) {
				continue;
			}

			let buildSettings = this._xobjs.XCBuildConfiguration[buildConf.value].buildSettings;
			buildSettings.LD_RUNPATH_SEARCH_PATHS = buildSettings.LD_RUNPATH_SEARCH_PATHS || ['"$(inherited)"'];
			buildSettings.LD_RUNPATH_SEARCH_PATHS.push('"\\"' + dynamicFrameworksRunpath + '\\""');
			runpathSearchPaths.add(dynamicFrameworksRunpath);
		}
	}

	integrateStripFrameworksScript() {
		let stripFrameworksScriptPath = null;
		const scriptFilename = 'strip-frameworks.sh';

		['ios', 'iphone'].some((platformName) => {
			let scriptPath = path.join(this._builder.projectDir, 'platform', platformName, scriptFilename);
			if (fs.existsSync(scriptPath)) {
				stripFrameworksScriptPath = scriptPath;
				this._logger.trace('Using custom user script at ' + stripFrameworksScriptPath.cyan);
				return true;
			}
			return false;
		});

		if (stripFrameworksScriptPath === null) {
			let templateSourcePath = path.join(this._builder.templatesDir, scriptFilename);
			stripFrameworksScriptPath = path.join(this._builder.buildDir, scriptFilename);
			if (!fs.existsSync(stripFrameworksScriptPath)) {
				appc.fs.copyFileSync(templateSourcePath, stripFrameworksScriptPath);
			}
			this._logger.trace('Using bundled script at ' + stripFrameworksScriptPath.cyan);

			this._builder.unmarkBuildDirFile(stripFrameworksScriptPath);
		}

		var scriptPhaseUuid = this._builder.generateXcodeUuid();
		var shellPath = '/bin/sh';
		var shellScript = 'bash "' + stripFrameworksScriptPath + '"';

		this._xobjs.PBXShellScriptBuildPhase = this._xobjs.PBXShellScriptBuildPhase || {};
		this._xobjs.PBXShellScriptBuildPhase[scriptPhaseUuid] = {
			isa: 'PBXShellScriptBuildPhase',
			buildActionMask: '2147483647',
			files: [],
			inputPaths: [],
			name: '"[Ti] Strip framework architectures"',
			outputPaths: [],
			runOnlyForDeploymentPostprocessing: 0,
			shellPath: shellPath,
			shellScript: JSON.stringify(shellScript)
		};
		this._mainTarget.buildPhases.push(scriptPhaseUuid);
	}
}

/**
 * Collects data about a framework that is required throughout the build
 */
class FrameworkAnalyzer {

	constructor(logger) {
		this._logger = logger;
	}

	/**
	 * Analyzes a framework under the given path and returns a new FrameworkInfo
	 * instance for it
	 *
	 * @param {string} frameworkPath Path to the framwork to analyze
	 * @return {Promise}
	 */
	analyze(frameworkPath) {
		let frameworkMatch = frameworkPath.match(frameworkPattern);
		let frameworkName = frameworkMatch[1];
		let binaryPathAndFilename = path.join(frameworkPath, frameworkName);
		return this.detectBinaryTypeAndArchitectures(binaryPathAndFilename).then((result) => {
			let frameworkInfo = new FrameworkInfo(frameworkName, frameworkPath, result.type, result.architectures);
			let archs = Array.from(frameworkInfo.architectures.values()).join(', ');
			this._logger.trace(`Found framework ${frameworkName.green} (type: ${result.type}, archs: ${archs}) at ${frameworkPath.cyan}`);
			return frameworkInfo;
		});
	}

	/**
	 * Detects the framwork's binary type (static or dynamic) and the included
	 * architectures.
	 *
	 * @param {string} binaryPathAndFilename Path to a framwork's binary
	 * @return {Promise}
	 */
	detectBinaryTypeAndArchitectures(binaryPathAndFilename) {
		return new Promise((resolve, reject) => {
			exec('file -b ' + binaryPathAndFilename, function(error, stdout) {
				if (error) {
					return reject(error);
				}

				let architectures = new Set();
				let architecturePattern = /architecture (\w+)/g;
				let architectureMatch = architecturePattern.exec(stdout);
				while (architectureMatch !== null) {
					architectures.add(architectureMatch[1]);
					architectureMatch = architecturePattern.exec(stdout);
				}

				let type;
				if (stdout.indexOf('current ar archive') !== -1) {
					type = FRAMEWORK_TYPE_STATIC;
				} else if (stdout.indexOf('dynamically linked shared library') !== -1) {
					type = FRAMEWORK_TYPE_DYNAMIC;
				} else {
					return reject(new Error('Unknown framework type:\n' + stdout));
				}

				resolve({
					type: type,
					architectures: architectures
				});
			});
		});
	}
}

/**
 * Holds information about a framwork
 */
class FrameworkInfo {

	/**
	 * Constructs a new framework info container
	 *
	 * @param {string} name Framework name
	 * @param {string} path Path to the framework
	 * @param {string} type Framwork's binary type (static or dynamic)
	 * @param {Set} architectures Set of supported architectures
	 */
	constructor(name, path, type, architectures) {
		if (typeof name  !== 'string') {
			throw new TypeError('Framework name needs to be a string');
		}
		this._name = name;

		if (typeof path !== 'string') {
			throw new TypeError('Framework path needs to be a string');
		}
		this._path = path;

		if (type !== FRAMEWORK_TYPE_STATIC && type !== FRAMEWORK_TYPE_DYNAMIC) {
			throw new TypeError('Framework type needs to be either static or dynamic');
		}
		this._type = type;

		if (!(architectures instanceof Set)) {
			throw new TypeError('Framework architectures must be a set of valid architectures');
		}
		this._architectures = architectures;
	}

	/**
	 * Gets the framework name
	 *
	 * @return {string}
	 */
	get name() {
		return this._name;
	}

	/**
	 * Gets the full path to the framework folder
	 *
	 * @return {string}
	 */
	get path() {
		return this._path;
	}

	/**
	 * Gets the Mach-O type of the framework's binary
	 *
	 * @return {string}
	 */
	get type() {
		return this._type;
	}

	/**
	 * Gets the architectures the framework was built for
	 *
	 * @return {Set}
	 */
	get architectures() {
		return this._architectures;
	}
}
