const { IncrementalFileTask } = require('appc-tasks');
const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit');
const CleanCSS = require('clean-css');

const MAX_SIMULTANEOUS_FILES = 256;
const limit = pLimit(MAX_SIMULTANEOUS_FILES);

/**
 * Task that takes input CSS files and optionally minifes them before copying to destination.
 */
class ProcessCSSTask extends IncrementalFileTask {

	/**
	 * Constructs a new processing task.
	 *
	 * @param {Object} options Configuration object for this task.
	 * @param {String} [options.name='process-css'] Name for the task.
	 * @param {String} options.incrementalDirectory Path to a folder where incremental task data will be stored.
	 * @param {Map<string,FileInfo>} options.files Map of input files to file info
	 * @param {Object} [options.logger] The logger instance used by this task.
	 * @param {Object} options.builder Builder instance.
	 */
	constructor(options) {
		options.name = options.name || 'process-css';
		options.inputFiles = [];
		options.files.forEach((info, _file) => options.inputFiles.push(info.src));
		super(options);

		this.files = options.files;
		this.builder = options.builder;
		this.minifyCSS = this.builder.minifyCSS;
		this.platform = this.builder.cli.argv.platform;
		this.forceCleanBuildPropertyName = this.platform === 'ios' ? 'forceCleanBuild' : 'forceRebuild';
		// Save last build's minifyCSS value for comparison to this build
		this.dataFilePath = path.join(this.incrementalDirectory, 'data.json');
		this.resetTaskData(); // sets this.data.minifyCSS = undefined
	}

	/**
	 * List or files that this task generates
	 *
	 * Each path will passed to {@link #ChangeManager#monitorOutputPath|ChangeManager.monitorOutputPath}
	 * to determine if the output files of a task have changed.
	 *
	 * @return {Array.<String>}
	 */
	get incrementalOutputs() {
		const outputFiles = [];
		this.files.forEach((info, _file) => outputFiles.push(info.dest));
		return outputFiles;
	}

	/**
	 * Override to define the action on a full task run
	 *
	 * @return {Promise}
	 */
	doFullTaskRun() {
		this.resetTaskData();
		return Promise.all(Array.from(this.inputFiles).map(filePath => limit(() => this.processFile(filePath))));
	}

	/**
	 * Override to define the action on an incremental task run
	 *
	 * @param {Map.<String, String>} changedFiles Map of changed files and their state (created, changed, deleted)
	 * @return {Promise}
	 */
	async doIncrementalTaskRun(changedFiles) {
		if (await this.requiresFullBuild()) {
			return this.doFullTaskRun();
		}

		const deletedFiles = this.filterFilesByStatus(changedFiles, 'deleted');
		const deletedPromise = Promise.all(deletedFiles.map(filePath => limit(() => this.handleDeletedFile(filePath))));

		const updatedFiles = this.filterFilesByStatus(changedFiles, [ 'created', 'changed' ]);
		const updatedPromise = Promise.all(updatedFiles.map(filePath => limit(() => this.processFile(filePath))));

		return Promise.all([ deletedPromise, updatedPromise ]);
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
	async loadResultAndSkip() {
		// check if minifyCSS changed (but no files changed)
		if (await this.requiresFullBuild()) {
			return this.doFullTaskRun();
		}
	}

	/**
	 * Function that will be called after the task run finished.
	 *
	 * Used to update the task data before it gets written to disk.
	 */
	async afterTaskAction() {
		await super.afterTaskAction();

		this.data.minifyCSS = this.minifyCSS;
		await this.saveTaskData();

		this.builder.unmarkBuildDirFiles(this.incrementalDirectory);
	}

	/**
	 * Performs some sanity checks if we can safely perform an incremental build
	 * or need to fallback to a full build.
	 *
	 * @return {Promise<Boolean>} True if a full build is required, false if not.
	 */
	async requiresFullBuild() {
		const loaded = await this.loadTaskData();
		if (this.builder[this.forceCleanBuildPropertyName]) {
			return true;
		}

		if (!loaded) { // no last build to load, or we couldn't compare state, so assume full build
			return true;
		}

		// if the minifyCSS property has changed we need to rebuild!
		if (this.data.minifyCSS !== this.minifyCSS) {
			this.logger.trace('Full build required, CSS minification value changed.');
			return true;
		}

		return false;
	}

	/**
	 * Filters the given map of changed files for specific states and returns a
	 * list of matchings paths.
	 *
	 * @param {Map<String, String>} changedFiles Map of changed file paths and their state
	 * @param {String|String[]} states Single state string or array of states to filter
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
	 * Handle deleted input file
	 *
	 * @param {String} filePathAndName Full path to the deleted file
	 * @return {Promise<void>}
	 */
	async handleDeletedFile(filePathAndName) {
		this.logger.info(`DELETED ${filePathAndName}`);
		// FIXME: If the file is deleted, how do we know the destination path to remove?
		// Either we need to track the src -> dest map ourselevs, or appc-tasks needs to supply the last output state so we can find the matching file somehow
		// i.e. same sha/size?
		const relativePathKey = this.resolveRelativePath(filePathAndName);
		const info = this.files.get(relativePathKey);
		if (info) {
			this.logger.debug(`Removing ${info.dest.cyan}`);
			this.files.delete(relativePathKey);
			return fs.remove(info.dest);
		}
	}

	/**
	 * Resolves the given full path to a relative path under it will be available in the app.
	 *
	 * @param {String} fullPath Full path used to resolve the relative path.
	 * @param {Map<string,FileInfo>} [files=this.files] Optional lookup object. Defaults to this.files.
	 * @return {String}
	 */
	resolveRelativePath(fullPath, files) {
		files = files || this.files;
		for (let [ key, value ] of files) {
			if (value.src === fullPath) {
				return key;
			}
		}
		return null;
	}

	/**
	 * Processes a single file by copying it to
	 * its destination path.
	 *
	 * @param {String} filePathAndName Full path to the file
	 * @return {Promise}
	 */
	async processFile(filePathAndName) {
		const file = this.resolveRelativePath(filePathAndName);
		if (!file) {
			throw new Error(`Unable to resolve relative path for ${filePathAndName}.`);
		}

		const info = this.files.get(file);
		const dir = path.dirname(info.dest);
		await fs.ensureDir(dir);

		this.builder.unmarkBuildDirFile(info.dest);

		if (this.minifyCSS) {
			// this.logger.debug(__('Copying and minifying %s => %s', info.src.cyan, info.dest.cyan));
			const css = new CleanCSS({ processImport: false, returnPromise: true });
			const source = await fs.readFile(info.src, 'utf8');
			const output = await css.minify(source);
			return fs.writeFile(info.dest, output.styles);
		}

		return fs.copy(info.src, info.dest);
	}

	/**
	 * Loads data from the previous task run.
	 *
	 * @return {Boolean} True if the data was sucessfully loaded, false if not.
	 */
	async loadTaskData() {
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
			minifyCSS: undefined
		};
	}
}

module.exports = ProcessCSSTask;
