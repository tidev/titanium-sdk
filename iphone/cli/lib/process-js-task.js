'use strict';

const appc = require('node-appc');
const { IncrementalFileTask } = require('appc-tasks');
const crypto = require('crypto');
const fs = require('fs-extra');
const jsanalyze = require('node-titanium-sdk/lib/jsanalyze');
const path = require('path');

const i18n = appc.i18n(__dirname);
const __ = i18n.__;

/**
 * Task that processes JS files by applying several transforms and copying them to their
 * destination inside the build directory.
 */
class ProcessJsTask extends IncrementalFileTask {
	/**
	 * Constructs a new processing task.
	 *
	 * @param {Object} taskInfo Configuration object for this task
	 */
	constructor(taskInfo) {
		taskInfo.name = taskInfo.name || 'process-js';
		super(taskInfo);

		this.jsFiles = taskInfo.jsFiles;
		this.jsBootstrapFiles = taskInfo.jsBootstrapFiles;
		this.builder = taskInfo.builder;
		this.sdkCOmmonFolder = taskInfo.sdkCOmmonFolder;

		const minify = this.builder.minifyJS;
		const transpile = this.builder.transpile;
		this.defaultAnalyzeOptions = {
			minify,
			transpile,
			sourceMap: this.builder.sourceMaps || this.builder.deployType === 'development',
			resourcesDir: this.builder.xcodeAppDir,
			logger: this.logger,
			targets: {
				ios: this.builder.minSupportedIosSdk
			}
		};

		this.dataFilePath = path.join(this.incrementalDirectory, 'data.json');
		this.resetTaskData();
	}

	/**
	 * Does a full task run, processing every input file.
	 *
	 * @return {Promise}
	 */
	doFullTaskRun() {
		this.resetTaskData();
		return Promise.all(Array.from(this.inputFiles).map(filePath => this.processJsFile(filePath)));
	}

	/**
	 * Does an incremental task run, processing only changed files.
	 *
	 * For backwards compatibiliy this will currently also call processJsFile for unchanged files.
	 *
	 * @param {Map} changedFiles Map of file paths and their current file state (created, changed, deleted)
	 * @return {Promise}
	 */
	doIncrementalTaskRun(changedFiles) {
		const loaded = this.loadTaskData();
		const fullBuild = !loaded || this.requiresFullBuild();
		if (fullBuild) {
			return this.doFullTaskRun();
		}

		this.jsBootstrapFiles.splice(0, 0, ...this.data.jsBootstrapFiles);

		const deletedFiles = this.filterFilesByStatus(changedFiles, 'deleted');
		const deletedPromise = Promise.all(deletedFiles.map(filePath => this.handleDeletedFile(filePath)));

		const updatedFiles = this.filterFilesByStatus(changedFiles, [ 'created', 'changed' ]);
		const updatedPromise = Promise.all(updatedFiles.map(filePath => this.processJsFile(filePath)));

		// @fixme: can be removed in 9.0 to even further decrease build times on incremental builds
		const unchangedFiles = Array.from(this.inputFiles).filter(filePath => !changedFiles.has(filePath));
		const unchangedPromise = Promise.all(unchangedFiles.map(filePath => this.processJsFile(filePath)));

		return Promise.all([ deletedPromise, updatedPromise, unchangedPromise ]);
	}

	/**
	 * Loads last run's task data if this task will be skipped entirely.
	 *
	 * Note that this function will be called when no input files changed. Since
	 * we also depend on some config values from the builder this is used to
	 * fallback to a full task run if required.
	 *
	 * @return {Promise}
	 */
	loadResultAndSkip() {
		const loaded = this.loadTaskData();
		const fullBuild = !loaded || this.requiresFullBuild();
		if (fullBuild) {
			return this.doFullTaskRun();
		}

		return Promise.resolve();
	}

	/**
	 * Function that will be called after the task run finished.
	 *
	 * Used to populate values back into the builder and update the task data
	 * before it gets written to disk.
	 */
	afterTaskAction() {
		this.builder.tiSymbols = this.data.tiSymbols;

		this.data.jsBootstrapFiles = this.jsBootstrapFiles;
		this.data.jsFiles = this.jsFiles;
		this.data.analyzeOptionsHash = this.generateHash(JSON.stringify(this.defaultAnalyzeOptions));

		this.saveTaskData();

		this.builder.unmarkBuildDirFiles(this.incrementalDirectory);
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
	processJsFile(filePathAndName) {
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
			if (file.indexOf('/') === 0) {
				file = path.basename(file);
			}
			this.builder.jsFilesEncrypted.push(file); // original name
			file = file.replace(/\./g, '_');
			info.dest = path.join(this.builder.buildAssetsDir, file);
			this.builder.jsFilesToEncrypt.push(file); // encrypted name
		}

		return new Promise((resolve) => {
			try {
				this.builder.cli.createHook('build.ios.copyResource', this.builder, (from, to, cb) => {
					const originalContents = fs.readFileSync(from).toString();

					const r = {
						original: originalContents,
						contents: originalContents,
						symbols: []
					};

					this.builder.cli.createHook('build.ios.compileJsFile', this.builder, (r, from, to, cb2) => {
						// Read the possibly modified file contents
						const source = r.contents;

						// If the file didn't change from previous run, return early
						const currentHash = this.generateHash(source);
						const previousHash = this.data.contentHashes[from];
						if (previousHash && previousHash === currentHash) {
							this.builder.unmarkBuildDirFile(to);
							return cb2();
						}

						this.transformAndCopy(source, from, to, () => {
							this.data.contentHashes[from] = currentHash;
							cb2();
						});
					})(r, from, to, cb);
				})(info.src, info.dest, resolve);
			} catch (ex) {
				ex.message.split('\n').forEach(m => this.logger.error(m));
				this.logger.error(ex);
				process.exit(1);
			}
		});
	}

	/**
	 * Transforms the given JavaScript source by transpiling and minifying it and then copying
	 * it to the destination path.
	 *
	 * @param {String} source JavaScript source
	 * @param {String} from Path to the file that contains the JavaScript source
	 * @param {String} to Path where the transformed source should be saved to
	 * @param {Function} done Callback function
	 */
	transformAndCopy(source, from, to, done) {
		// DO NOT TRANSPILE CODE inside SDK's common folder. It's already transpiled!
		const transpile = from.startsWith(this.sdkCommonFolder) ? false : this.defaultAnalyzeOptions.transpile;
		const minify = from.startsWith(this.sdkCommonFolder) ? false : this.defaultAnalyzeOptions.minify;
		const analyzeOptions = Object.assign({}, this.defaultAnalyzeOptions, {
			filename: from,
			minify,
			transpile,
		});

		try {
			const modified = jsanalyze.analyzeJs(source, analyzeOptions);
			const newContents = modified.contents;

			// we want to sort by the "to" filename so that we correctly handle file overwriting
			this.data.tiSymbols[to] = modified.symbols;

			const dir = path.dirname(to);
			fs.ensureDirSync(dir);

			this.logger.debug(__('Copying and minifying %s => %s', from.cyan, to.cyan));
			fs.writeFileSync(to, newContents);
			this.builder.jsFilesChanged = true;

			done();
		} catch (err) {
			err.message.split('\n').forEach(m => this.logger.error(m));
			this.logger.error(err.stack);
			if (err.codeFrame) { // if we have a nicely formatted pointer to syntax error from babel, use it!
				this.logger.error(err.codeFrame);
			}
			process.exit(1);
		} finally {
			this.builder.unmarkBuildDirFile(to);
		}
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
	handleDeletedFile(filePathAndName) {
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
			delete this.data.contentHashes[info.src];
			delete this.data.tiSymbols[info.dest];
		}

		return Promise.resolve();
	}

	/**
	 * Performs some sanity checks if we can safely perform an incremental build
	 * or need to fallback to a full build.
	 *
	 * @return {Boolean} True if a full build is required, false if not.
	 */
	requiresFullBuild() {
		if (this.builder.forceCleanBuild) {
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
	loadTaskData() {
		if (!fs.exists(this.dataFilePath)) {
			return false;
		}

		try {
			this.data = JSON.parse(fs.readFileSync(this.dataFilePath).toString());
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Saves current task data for reuse on next run.
	 */
	saveTaskData() {
		fs.writeFileSync(this.dataFilePath, JSON.stringify(this.data));
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
