/**
 * iOS build hook that scans for available storyboards from modules
 * and then configures them in the Xcode project
 */

// TO DO: Can we merge storyboard.js and framework.js

import fs from 'fs-extra';
import { IncrementalFileTask } from 'appc-tasks';
import path from 'path';

export const cliVersion = '>=3.2.1';

export function init(logger, config, cli) {
	const storyboardManager = new StoryboardManager(logger, config, cli);
	storyboardManager.initialize();
}

/**
 * Manages all available storyboards from modules.
 *
 * Scans for available storyboards and inspects them to get the required info to
 * properly integrate them into the Xcode project.
 */
class StoryboardManager {

	/**
	 * Constructs a new storyboard manager.
	 *
	 * @param {Object} logger - Logger instance
	 * @param {Object} config - Project configuration
	 * @param {Object} cli - CLI instance
	 * @access public
	 */
	constructor(logger, config, cli) {
		this._cli = cli;
		this._config = config;
		this._logger = logger;
		this._builder = null;
		this._storyboards = new Map();
	}

	/**
	 * Initializes the storyboard manager by hooking into the required build steps.
	 *
	 * @access public
	 */
	initialize() {
		this._cli.on('build.pre.compile', {
			priority: 1200,
			post: async (builder, callback) => {
				try {
					this._logger.trace('Starting storyboard detection');
					this._builder = builder;
					await this.detectStoryboards();
				} catch (err) {
					callback(err);
					return;
				}
				callback();
			}
		});

		this._cli.on('build.ios.xcodeproject', {
			pre: this.addStoryboardsToXcodeProject.bind(this)
		});
	}

	/**
	 * Detects all available storyboards.
	 *
	 * @return {Promise<void>}
	 * @access private
	 */
	async detectStoryboards() {
		const storyboardPaths = await this.findStoryboardPaths();
		if (storyboardPaths.length === 0) {
			return;
		}

		const incrementalDirectory = path.join(this._builder.projectDir, 'build', 'incrementalStoryboards');
		const outputDirectory = path.join(this._builder.projectDir, 'build', 'inspectStoryboards');
		const task = new InspectStoryboardsTask({
			name: 'ti:inspectStoryboards',
			logger: this._logger,
			incrementalDirectory
		});
		task.outputDirectory = outputDirectory;
		storyboardPaths.forEach(storyboardPath => {
			task.addStoryboardPath(storyboardPath);
		});
		task.postTaskRun = () => {
			this._storyboards = task.storyboards;

			// Convert the internal ES6 map to an object to avoid ES6 in the builder
			const storyboardObject = {};
			this._storyboards.forEach(storyboardInfo => {
				storyboardObject[storyboardInfo.name] = {
					name: storyboardInfo.name,
					path: storyboardInfo.path
				};
			});
			this._builder.storyboards = storyboardObject;
		};
		return task.run();
	}

	/**
	 * Finds any .storyboard file inside modules.
	 *
	 * @return {Promise<string[]>} Promise resolving to array of available storyboard paths
	 * @access private
	 */
	async findStoryboardPaths() {
		const pathsToScan = [];
		for (let module of this._builder.modules) {
			pathsToScan.push(path.join(module.modulePath, 'platform'));
			pathsToScan.push(path.join(module.modulePath, 'Resources'));
		}

		const results = await Promise.all(pathsToScan.map(pathToScan => this.scanPathForStoryboards(pathToScan)));
		return results.filter(foundPath => foundPath).reduce((acc, value) => acc.concat(value), []);
	}

	/**
	 * Scans the given path for any .storyboard file.
	 *
	 * @param {String} storyboardsPath - Path to scan for storybo
	 * @return {Promise<string[]>}
	 * @access private
	 */
	async scanPathForStoryboards(storyboardsPath) {
		let files = [];
		try {
			files = await fs.readdir(storyboardsPath);
		} catch (err) {
			// ignore non-existing directories
			return;
		}

		this._logger.trace(`Scanning ${storyboardsPath.cyan} for storyboards`);
		const foundStoryboardPaths = [];
		for (const filename of files) {
			if (filename.endsWith('.storyboard')) {
				const possibleStoryPath = path.join(storyboardsPath, filename);
				this._logger.trace(`  found ${path.relative(storyboardsPath, possibleStoryPath)}`);
				foundStoryboardPaths.push(possibleStoryPath);
			}
		}

		return foundStoryboardPaths;
	}

	/**
	 * Adds all found storyboards to the Xcode project.
	 *
	 * @param {Object} hookData - Data from the Xcode project hook
	 * @param {Function} callback - Callback function
	 * @return {undefined}
	 * @access private
	 */
	addStoryboardsToXcodeProject(hookData, callback) {
		if (this._storyboards.size === 0) {
			return callback();
		}

		const xcodeProject = hookData.args[0];
		const storyboardIntegrator = new StoryboardIntegrator(xcodeProject, this._builder, this._logger);
		for (const storyboardInfo of this._storyboards.values()) {
			this._logger.trace(`Integrating storyboard ${storyboardInfo.name.green} into Xcode project.`);
			storyboardIntegrator.integrateStoryboard(storyboardInfo);
		}

		callback();
	}
}
/**
 * Task that takes a set of paths and inspects the storyboards that are found
 * there.
 */
class InspectStoryboardsTask extends IncrementalFileTask {

	/**
	 * Constructs a new storyboards insepcation task
	 *
	 * @param {Object} taskInfo - Task info object
	 * @access public
	 */
	constructor(taskInfo) {
		super(taskInfo);

		this._storyboardPaths = new Set();
		this._storyboards = new Map();
		this._outputDirectory = null;
		this._metadataPathAndFilename = null;
	}

	/**
	 * @inheritdoc
	 */
	get incrementalOutputs() {
		return [ this._outputDirectory ];
	}

	get outputDirectory() {
		return this._outputDirectory;
	}

	/**
	 * Sets the output directory where this task will write the storyboard metadata
	 *
	 * @param {String} outputPath - Full path to the output directory
	 * @access public
	 */
	set outputDirectory(outputPath) {
		this._outputDirectory = outputPath;
		this.registerOutputPath(outputPath);
		this._metadataPathAndFilename = path.join(this._outputDirectory, 'storyboards.json');
	}

	/**
	 * Returns a list with metadata of all recognized storyboards
	 *
	 * @return {Map.<String, StoryboardInfo>} Map of storyboard paths and the associated metadata
	 * @access public
	 */
	get storyboards() {
		return this._storyboards;
	}

	/**
	 * Adds a .storyboard folder so this task can inspect it to collect metadata
	 * about the storyboard.
	 *
	 * @param {String} storyboardPath - Path to the .storyboard folder to inspect
	 * @access public
	 */
	addStoryboardPath(storyboardPath) {
		if (this._storyboardPaths.has(storyboardPath)) {
			return;
		}

		this._storyboardPaths.add(storyboardPath);
		this.addInputFile(storyboardPath);
	}

	/**
	 * Does a full task run by inspecting all available storyboard paths
	 *
	 * @return {Promise<void>}
	 * @access private
	 */
	async doFullTaskRun() {
		this._storyboards = new Map();
		await this.inspectStoryboards(this._storyboardPaths);
		return this.writeStoryboardMetadata();
	}

	/**
	 * Does an incremental task run by only scanning changed storyboard folders
	 * and removing deleted storyboards from the metadata object
	 *
	 * @param {Map.<String, String>} changedFiles - Map of changed files and their status (created, changed or deleted)
	 * @return {Promise<void>}
	 * @access private
	 */
	async doIncrementalTaskRun(changedFiles) {
		const loaded = await this.loadStoryboardMetadata();
		if (!loaded) {
			return this.doFullTaskRun();
		}

		this._storyboards.forEach(storyboardInfo => {
			if (!fs.existsSync(storyboardInfo.path)) {
				this.logger.trace(`Storyboard at ${storyboardInfo.path} deleted, removing metadata`);
				this._storyboards.delete(storyboardInfo.name);
				return;
			}

			// Remove any storyboards from deactivated modules
			if (!this._storyboardPaths.has(storyboardInfo.path)) {
				this.logger.trace(`Storyboard at ${storyboardInfo.path} no longer in search path, removing metadata`);
				this._storyboards.delete(storyboardInfo.name);
				return;
			}
		});

		const changedStoryboards = new Set();
		changedFiles.forEach((fileStatus, pathAndFilename) => {
			if (fileStatus === 'created' || fileStatus === 'changed') {
				const packageExtension = '.storyboard';
				const storyboardPath = pathAndFilename.substring(0, pathAndFilename.indexOf(packageExtension) + packageExtension.length);
				if (!changedStoryboards.has(storyboardPath)) {
					this.logger.trace(`Storyboard at ${storyboardPath} changed, regenerating metadata`);
					changedStoryboards.add(storyboardPath);
				}
			}
		});

		await this.inspectStoryboards(changedStoryboards);
		return this.writeStoryboardMetadata();
	}

	/**
	 * @return {Promise<void>}
	 * @inheritdoc
	 */
	async loadResultAndSkip() {
		const loaded = await this.loadStoryboardMetadata();
		if (!loaded) {
			return this.doFullTaskRun();
		}
	}

	/**
	 * Loads stored metadata from disk and recreates the {@link StoryboardInfo}
	 * objects.
	 *
	 * @return {Promise<Boolean>} True if the metadata was sucessfully loaded, false if not
	 * @access private
	 */
	async loadStoryboardMetadata() {
		try {
			const metadata = await fs.readJSON(this._metadataPathAndFilename);
			for (const storyboardPath of Object.keys(metadata)) {
				const storyboardMetadata = metadata[storyboardPath];
				this._storyboards.set(storyboardMetadata.name, new StoryboardInfo(
					storyboardMetadata.name,
					storyboardMetadata.path
				));
			}
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Saves the internal matadata object to disk for reuse on subsequent builds.
	 *
	 * @return {Promise<void>}
	 * @access private
	 */
	async writeStoryboardMetadata() {
		const metadataObject = {};
		for (const storyboardInfo of this._storyboards.values()) {
			metadataObject[storyboardInfo.path] = {
				name: storyboardInfo.name,
				path: storyboardInfo.path
			};
		}
		await fs.ensureDir(this._outputDirectory);
		return fs.writeJSON(this._metadataPathAndFilename, metadataObject);
	}

	/**
	 * Inspects each storyboard for their type and supported architectures.
	 *
	 * @param {Set.<String>} storyboardPaths - List of storyboard paths to inspect
	 * @return {Promise}
	 * @access private
	 */
	async inspectStoryboards(storyboardPaths) {
		const metadataPromises = [];
		const storyboardInspector = new StoryboardInspector(this._logger);
		for (const storyboardPath of storyboardPaths) {
			const metadataPromise = storyboardInspector.inspect(storyboardPath).then(storyboardInfo => {
				if (this._storyboards.has(storyboardInfo.name)) {
					const existingStoryboardInfo = this._storyboards.get(storyboardInfo.name);
					if (existingStoryboardInfo.path === storyboardInfo.path) {
						this._storyboards.set(storyboardInfo.name, storyboardInfo);
						return;
					}

					this.logger.error(`Duplicate storyboard ${storyboardInfo.name} detected at these paths:`);
					this.logger.error('');
					this.logger.error(`  ${existingStoryboardInfo.path}`);
					this.logger.error(`  ${storyboardInfo.path}`);
					this.logger.error('');
					this.logger.error('Please resolve this conflict by choosing one of the above storyboards that you want to keep and remove the other before continuing.');

					throw new Error(`Duplicate storyboard ${storyboardInfo.name} detected.`);
				}
				this._storyboards.set(storyboardInfo.name, storyboardInfo);

				return;
			});
			metadataPromises.push(metadataPromise);
		}

		return Promise.all(metadataPromises);
	}

}

/**
 * Integrates storyboards into a Xcode project by adding the required build phases
 * and adjusting build settings
 */
class StoryboardIntegrator {

	/**
	 * Constructs a new storyboard integrator
	 *
	 * @param {Object} xcodeProject Parsed Xcode project from node-xcode
	 * @param {Object} builder iOS builder instance
	 * @param {Object} logger Appc logger instance
	 * @access public
	 */
	constructor(xcodeProject, builder, logger) {
		this._builder = builder;
		this._logger = logger;

		this._xcodeProject = xcodeProject;
		this._xobjs = xcodeProject.hash.project.objects;
		this._projectUuid = xcodeProject.hash.project.rootObject;
		this._pbxProject = this._xobjs.PBXProject[this._projectUuid];
		this._mainTargetUuid = this._pbxProject.targets.filter((target) => {
			return target.comment.replace(/^"/, '').replace(/"$/, '') === this._builder.tiapp.name;
		})[0].value;
		this._mainTarget = this._xobjs.PBXNativeTarget[this._mainTargetUuid];
		this._mainGroupChildren = this._xobjs.PBXGroup[this._pbxProject.mainGroup].children;
		this._resourceGroup = this._xobjs.PBXGroup[this._mainGroupChildren.filter((child) => {
			return child.comment === 'Resources';
		})[0].value];
		this._resourceBuildPhase = this._xobjs.PBXResourcesBuildPhase[this._mainTarget.buildPhases.filter((phase) => {
			return this._xobjs.PBXResourcesBuildPhase[phase.value];
		})[0].value];
	}

	/**
	 * Integrates a storyboards into the Xcode project by adding the required
	 * build phases and adjusting the storyboard search path
	 *
	 * @param {storyboardInfo} storyboardInfo - storyboard metadata
	 * @access public
	 */
	integrateStoryboard(storyboardInfo) {
		const fileRefUuid = this.addStoryboardFileReference(storyboardInfo);
		this.addLinkStoryboardBuildPhase(storyboardInfo, fileRefUuid);
	}

	/**
	 * Add the storyboard as a new file reference to the Xcode project.
	 *
	 * @param {StoryboardInfo} storyboardInfo - storyboard metadata
	 * @return {String} Uuid of the created file reference
	 * @access private
	 */
	addStoryboardFileReference(storyboardInfo) {
		const storyboardName = storyboardInfo.packageName;
		const fileRefUuid = this._builder.generateXcodeUuid();
		this._xobjs.PBXFileReference[fileRefUuid] = {
			isa: 'PBXFileReference',
			lastKnownFileType: 'file.storyboard',
			path: `"${storyboardInfo.path}"`,
			sourceTree: '"<group>"'
		};
		this._xobjs.PBXFileReference[fileRefUuid + '_comment'] = storyboardName;
		this._resourceGroup.children.push({
			value: fileRefUuid,
			comment: storyboardName
		});

		return fileRefUuid;
	}

	/**
	 * Adds the storyboard to the project's link storyboards build phase.
	 *
	 * @param {StoryboardInfo} storyboardInfo - storyboard metadata
	 * @param {String} fileRefUuid - Uuid of the storyboards file reference inside the Xcode project
	 * @access private
	 */
	addLinkStoryboardBuildPhase(storyboardInfo, fileRefUuid) {
		const storyboardName = storyboardInfo.packageName;
		const buildFileUuid = this._builder.generateXcodeUuid();
		const buildFile = {
			isa: 'PBXBuildFile',
			fileRef: fileRefUuid,
			fileRef_comment: storyboardName
		};

		this._xobjs.PBXBuildFile[buildFileUuid] = buildFile;
		this._xobjs.PBXBuildFile[buildFileUuid + '_comment'] = storyboardName + ' in Resources';
		this._resourceBuildPhase.files.push({
			value: buildFileUuid,
			comment: storyboardName + ' in Resources'
		});
	}
}

/**
 * Inspects a storyboard and collects data about it that is required to integrate
 * it with the Xcode project.
 *
 * The storyboard metadata that is collected here will also be added to the
 * builder at the end of this hook so it can then be used by other hooks.
 */
class StoryboardInspector {

	/**
	 * Constructs a new storyboard inspector.
	 *
	 * @param {Object} logger - Appc logger instance
	 * @access public
	 */
	constructor(logger) {
		this._logger = logger;
	}

	/**
	 * Inspects the storyboard under the given path and returns a new {@link StoryboardInfo}
	 * instance for it.
	 *
	 * @param {String} storyboardPath - Path to the storyboard to inspect
	 * @return {Promise<StoryboardInfo>}
	 * @access public
	 */
	async inspect(storyboardPath) {
		const packageExtension = path.extname(storyboardPath);
		const storyboardName = path.basename(storyboardPath, packageExtension);
		const meta = { name: storyboardName, path: storyboardPath };

		return new StoryboardInfo(meta);
	}
}

/**
 * @typedef StoryboardMetadata
 * @property {Object} name Storyboard metadata
 * @property {String} path Path to the storyboard
 */

/**
 * Holds information about a storyboard.
 */
class StoryboardInfo {

	/**
	 * Constructs a new storyboard info container
	 *
	 * @param {StoryboardMetadata} meta - storyboard metadata
	 * @access public
	 */
	constructor(meta) {
		const {
			name,
			path,
		} = meta;
		if (typeof name  !== 'string') {
			throw new TypeError('storyboard name needs to be a string');
		}
		this.name = name;

		if (typeof path !== 'string') {
			throw new TypeError('storyboard path needs to be a string');
		}
		this.path = path;
	}

	/**
	 * Gets the storyboard search path that should be added to the xcode project
	 *
	 * @return {string}
	 */
	get searchPath() {
		return path.dirname(this.path);
	}

	/**
	 * Gets the name of the storyboard to stuff into xcode
	 *
	 * @return {string}
	 */
	get packageName() {
		return path.basename(this.path);
	}

	/**
	 * Name used in xcode build file reference to denote storyboard
	 *
	 * @return {string}
	 */
	get wrapperName() {
		return 'file.storyboard';
	}
}
