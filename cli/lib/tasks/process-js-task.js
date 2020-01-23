const appc = require('node-appc');
const { IncrementalFileTask } = require('appc-tasks');
const crypto = require('crypto');
const fs = require('fs-extra');
const jsanalyze = require('node-titanium-sdk/lib/jsanalyze');
const nodeify = require('nodeify');
const path = require('path');
const pLimit = require('p-limit');
const { promisify } = require('util');

const i18n = appc.i18n(__dirname);
const __ = i18n.__;
const MAX_SIMULTANEOUS_FILES = 256;
const limit = pLimit(MAX_SIMULTANEOUS_FILES);

/**
 * Task that processes JS files by applying several transforms and copying them to their
 * destination inside the build directory.
 */
class ProcessJsTask extends IncrementalFileTask {
	/**
	 * Constructs a new processing task.
	 *
	 * @param {Object} options Configuration object for this task.
	 * @param {String} [options.name='process-js'] Name for the task.
	 * @param {String[]} options.inputFiles Array of input files this task will use.
	 * @param {String[]} options.incrementalDirectory Path to a folder where incremental task data will be stored.
	 * @param {Object} options.logger The logger instance used by this task.
	 * @param {Object} options.builder iOS builder instance.
	 * @param {String[]} options.jsFiles Array with info about JS files to resolve paths.
	 * @param {String[]} options.jsBootstrapFiles Array of bootstrap scripts to consider. The task will directly modify this array.
	 * @param {String} options.sdkCommonFolder Path to common JS files from the SDK.
	 * @param {Object} options.defaultAnalyzeOptions Default configuration options for jsanalyze.
	 * @param {Boolean} options.defaultAnalyzeOptions.minify Whether to minify the JS files or not.
	 * @param {Boolean} options.defaultAnalyzeOptions.transpile Whether to transpile the JS files or not.
	 * @param {Boolean} options.defaultAnalyzeOptions.sourceMaps Whether to generate source maps or not.
	 * @param {String} options.defaultAnalyzeOptions.resourcesDir Path to the directory where JS files will be copied to.
	 * @param {Object} options.defaultAnalyzeOptions.logger Appc logger instance.
	 * @param {Object} options.defaultAnalyzeOptions.targets Transpilation target configuration used by Babel.
	 */
	constructor(options) {
		options.name = options.name || 'process-js';
		super(options);

		this.builder = options.builder;
		this.platform = this.builder.cli.argv.platform;
		this.forceCleanBuildPropertyName = this.platform === 'ios' ? 'forceCleanBuild' : 'forceRebuild';
		this.jsFiles = options.jsFiles;
		this.jsBootstrapFiles = options.jsBootstrapFiles;
		this.sdkCommonFolder = options.sdkCommonFolder;
		this.defaultAnalyzeOptions = options.defaultAnalyzeOptions;

		this.dataFilePath = path.join(this.incrementalDirectory, 'data.json');

		this.fileContentsMap = new Map();

		this.resetTaskData();

		this.createHooks();
	}

	/**
	 * Does a full task run, processing every input file.
	 *
	 * @return {Promise}
	 */
	doFullTaskRun() {
		this.resetTaskData();
		return Promise.all(Array.from(this.inputFiles).map(filePath => limit(() => this.processJsFile(filePath))));
	}

	/**
	 * Does an incremental task run, processing only changed files.
	 *
	 * For backwards compatibiliy this will currently also call processJsFile for unchanged files.
	 *
	 * @param {Map<String, String>} changedFiles Map of file paths and their current file state (created, changed, deleted)
	 * @return {Promise}
	 */
	async doIncrementalTaskRun(changedFiles) {
		const loaded = await this.loadTaskData();
		const fullBuild = !loaded || this.requiresFullBuild();
		if (fullBuild) {
			return this.doFullTaskRun();
		}

		this.jsBootstrapFiles.splice(0, 0, ...this.data.jsBootstrapFiles);

		const deletedFiles = this.filterFilesByStatus(changedFiles, 'deleted');
		const deletedPromise = Promise.all(deletedFiles.map(filePath => limit(() => this.handleDeletedFile(filePath))));

		const updatedFiles = this.filterFilesByStatus(changedFiles, [ 'created', 'changed' ]);
		const updatedPromise = Promise.all(updatedFiles.map(filePath => limit(() => this.processJsFile(filePath))));

		// @fixme: can be removed in 9.0 to even further decrease build times on incremental builds
		const unchangedFiles = Array.from(this.inputFiles).filter(filePath => !changedFiles.has(filePath));
		const unchangedPromise = Promise.all(unchangedFiles.map(filePath => limit(() => this.processJsFile(filePath))));

		return Promise.all([ deletedPromise, updatedPromise, unchangedPromise ]);
	}

	/**
	 * Loads last run's task data if this task will be skipped entirely.
	 *
	 * Note that this function will be called when no input files changed. Since
	 * we also depend on some config values from the builder this is used to
	 * fallback to a full task run if required.
	 *
	 * This will also dummy process the unchanged JS files again to properly
	 * fire expected hooks and populate the builder with required data.
	 *
	 * @return {Promise}
	 */
	async loadResultAndSkip() {
		const loaded = await this.loadTaskData();
		const fullBuild = !loaded || this.requiresFullBuild();
		if (fullBuild) {
			return this.doFullTaskRun();
		}

		this.jsFiles = this.data.jsFiles;
		this.jsBootstrapFiles.splice(0, 0, ...this.data.jsBootstrapFiles);
		return Promise.all(Array.from(this.inputFiles).map(filePath => limit(() => this.processJsFile(filePath))));
	}

	/**
	 * Function that will be called after the task run finished.
	 *
	 * Used to update the task data before it gets written to disk.
	 */
	async afterTaskAction() {
		await super.afterTaskAction();

		this.data.jsBootstrapFiles = this.jsBootstrapFiles;
		this.data.jsFiles = this.jsFiles;
		this.data.analyzeOptionsHash = this.generateHash(JSON.stringify(this.defaultAnalyzeOptions));
		await this.saveTaskData();

		this.builder.unmarkBuildDirFiles(this.incrementalDirectory);
	}

	/**
	 * Creates the hooks that are required during JS processing.
	 */
	createHooks() {
		let compileJsFileHook = this.builder.cli.createHook(`build.${this.platform}.compileJsFile`, this.builder, (r, from, to, done) => {
			// Read the possibly modified file contents
			const source = r.contents;

			// If the file didn't change from previous run, return early
			const currentHash = this.generateHash(source);
			const previousHash = this.data.contentHashes[from];
			if (previousHash && previousHash === currentHash) {
				this.builder.unmarkBuildDirFile(to);
				return done();
			}

			nodeify(this.transformAndCopy(source, from, to), (e) => {
				if (e) {
					// if we have a nicely formatted pointer to syntax error from babel, print it!
					if (e.codeFrame) {
						this.logger.error(e.codeFrame);
					}
					done(e);
				}

				this.data.contentHashes[from] = currentHash;
				return done();
			});
		});

		this.copyResourceHook = promisify(this.builder.cli.createHook(`build.${this.platform}.copyResource`, this.builder, (from, to, done) => {
			const originalContents = fs.readFileSync(from).toString();

			const r = {
				original: originalContents,
				contents: originalContents,
				symbols: []
			};
			compileJsFileHook(r, from, to, done);
		}));
	}

	/**
	 * Processes a single JavaScript file by applying several transforms and then copying it to
	 * its destination path.
	 *
	 * If the content of the unprocessed JavaScript file did not change compared to the last run,
	 * any further processing will be skipped.
	 *
	 * @param {String} filePathAndName Full path to the JavaScript file
	 * @return {Promise}
	 */
	async processJsFile(filePathAndName) {
		let file = this.resolveRelativePath(filePathAndName);
		if (!file) {
			throw new Error(`Unable to resolve relative path for ${filePathAndName}.`);
		}

		const bootstrapPath = file.substr(0, file.length - 3);  // Remove the ".js" extension.
		if (bootstrapPath.endsWith('.bootstrap') && !this.jsBootstrapFiles.includes(bootstrapPath)) {
			this.jsBootstrapFiles.push(bootstrapPath);
		}

		const info = this.jsFiles[file];
		if (this.builder.encryptJS) {
			if (this.platform === 'ios') {
				if (file.indexOf('/') === 0) {
					file = path.basename(file);
				}
				this.builder.jsFilesEncrypted.push(file); // original name
				file = file.replace(/\./g, '_');
			}

			info.dest = path.join(this.builder.buildAssetsDir, file);
			this.builder.jsFilesToEncrypt.push(file); // encrypted name
		}

		return this.copyResourceHook(info.src, info.dest);
	}

	/**
	 * Transforms the given JavaScript source by transpiling and minifying it and then copying
	 * it to the destination path.
	 *
	 * @param {String} source JavaScript source
	 * @param {String} from Path to the file that contains the JavaScript source
	 * @param {String} to Path where the transformed source should be saved to
	 */
	async transformAndCopy(source, from, to) {
		// DO NOT TRANSPILE CODE inside SDK's common folder. It's already transpiled!
		const isFileFromCommonFolder = from.startsWith(this.sdkCommonFolder);
		const transpile = isFileFromCommonFolder ? false : this.defaultAnalyzeOptions.transpile;
		const minify = isFileFromCommonFolder ? false : this.defaultAnalyzeOptions.minify;
		const analyzeOptions = Object.assign({}, this.defaultAnalyzeOptions, {
			filename: from,
			minify,
			transpile,
		});

		const modified = jsanalyze.analyzeJs(source, analyzeOptions);
		const newContents = modified.contents;

		// we want to sort by the "to" filename so that we correctly handle file overwriting
		this.data.tiSymbols[to] = modified.symbols;

		const dir = path.dirname(to);
		await fs.ensureDir(dir);

		this.logger.debug(__('Copying and minifying %s => %s', from.cyan, to.cyan));
		await fs.writeFile(to, newContents);
		this.builder.jsFilesChanged = true;
		this.builder.unmarkBuildDirFile(to);
	}

	/**
	 * Filters the given map of changed files for specific states and returns a
	 * list of matchings paths.
	 *
	 * @param {Map<String, String>} changedFiles Map of changed file paths and their state
	 * @param {String|Array} states Single state string or array of states to filter
	 * @return {Array<String>}
	 */
	filterFilesByStatus(changedFiles, states) {
		states = Array.isArray(states) ? states : [ states ];
		const filteredFiles = [];
		changedFiles.forEach((fileState, filePath) => {
			if (states.includes(fileState)) {
				filteredFiles.push(filePath);
			}
		});
		return filteredFiles;
	}

	/**
	 * Resolves th given full path to a relative path under it will be available in the app.
	 *
	 * @param {String} fullPath Full path used to resolve the relative path.
	 * @param {Object} jsFiles Optional lookup object. Defaults to this.jsFiles.
	 * @return {String}
	 */
	resolveRelativePath(fullPath, jsFiles) {
		jsFiles = jsFiles || this.jsFiles;
		return Object.keys(jsFiles).find(relativePath => {
			return jsFiles[relativePath].src === fullPath;
		});
	}

	/**
	 * Handle deleted files by cleaning up the internal task data
	 *
	 * This will:
	 *
	 * - Remove file from the list of bootstrap files (if it's a .bootstrap.js file)
	 * - Delete it's content hash
	 * - Delete used Ti symbols
	 *
	 * @param {String} filePathAndName Full path to the deleted file
	 * @return {Promise}
	 */
	async handleDeletedFile(filePathAndName) {
		let file = this.resolveRelativePath(filePathAndName, this.data.jsFiles);
		const bootstrapPath = file.substr(0, file.length - 3);  // Remove the ".js" extension.
		if (bootstrapPath.endsWith('.bootstrap')) {
			const index = this.jsBootstrapFiles.indexOf(bootstrapPath);
			if (index !== -1) {
				this.jsBootstrapFiles.splice(index, 1);
			}
		}

		const info = this.data.jsFiles[file];
		if (info) {
			this.logger.debug(`Removing ${info.dest.cyan}`);
			delete this.data.contentHashes[info.src];
			delete this.data.tiSymbols[info.dest];
			delete this.data.jsFiles[file];
			return fs.remove(info.dest);
		}
	}

	/**
	 * Performs some sanity checks if we can safely perform an incremental build
	 * or need to fallback to a full build.
	 *
	 * @return {Boolean} True if a full build is required, false if not.
	 */
	requiresFullBuild() {
		if (this.builder[this.forceCleanBuildPropertyName]) {
			this.logger.trace('Full build required, force clean build flag is set.');
			return true;
		}

		const currentAnalyzeOptionsHash = this.generateHash(JSON.stringify(this.defaultAnalyzeOptions));
		if (!this.data.analyzeOptionsHash || this.data.analyzeOptionsHash !== currentAnalyzeOptionsHash) {
			this.logger.trace('Full build required, jsanalyze options changed.');
			return true;
		}

		return false;
	}

	/**
	 * Generates SHA-1 hash from the given string value.
	 *
	 * @param {String} value String value to hash.
	 * @return {String}
	 */
	generateHash(value) {
		return crypto.createHash('sha1').update(value).digest('hex');
	}

	/**
	 * Loads data from the previous task run.
	 *
	 * @return {Boolean} True if the data was sucessfully loaded, false if not.
	 */
	async loadTaskData() {
		if (!await fs.exists(this.dataFilePath)) {
			return false;
		}

		try {
			this.data = await fs.readJson(this.dataFilePath);
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Saves current task data for reuse on next run.
	 *
	 * @return {Promise}
	 */
	async saveTaskData() {
		return fs.writeJson(this.dataFilePath, this.data);
	}

	/**
	 * Resets the task's data object to an empty state.
	 */
	resetTaskData() {
		this.data = {
			contentHashes: {},
			jsBootstrapFiles: [],
			tiSymbols: {},
			jsFiles: {}
		};
	}
}

module.exports = ProcessJsTask;
