const { IncrementalFileTask } = require('appc-tasks');
const fs = require('fs-extra');
const pLimit = require('p-limit');
const { promisify } = require('util');

const MAX_SIMULTANEOUS_FILES = 256;
const limit = pLimit(MAX_SIMULTANEOUS_FILES);

/**
 * Task that copies "plain" input files to a destination.
 */
class CopyResourcesTask extends IncrementalFileTask {

	/**
	 * Constructs a new processing task.
	 *
	 * @param {Object} options Configuration object for this task.
	 * @param {String} [options.name='copy-resources'] Name for the task.
	 * @param {String} options.incrementalDirectory Path to a folder where incremental task data will be stored.
	 * @param {Map<string,FileInfo>} options.files Map of input files to file info
	 * @param {Object} [options.logger] The logger instance used by this task.
	 * @param {Object} options.builder Builder instance.
	 */
	constructor(options) {
		options.name = options.name || 'copy-resources';
		options.inputFiles = [];
		options.files.forEach((info, _file) => options.inputFiles.push(info.src));
		super(options);

		this.files = options.files;
		this.builder = options.builder;
		this.platform = this.builder.cli.argv.platform;
		this.forceCleanBuildPropertyName = this.platform === 'ios' ? 'forceCleanBuild' : 'forceRebuild';

		this.createHooks();
	}

	/**
	 * Function that will be called after the task run finished.
	 *
	 * Used to tell iOS build not to wipe our incremental state files
	 */
	async afterTaskAction() {
		await super.afterTaskAction();
		this.builder.unmarkBuildDirFiles(this.incrementalDirectory);
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
		return Promise.all(Array.from(this.inputFiles).map(filePath => limit(() => this.processFile(filePath))));
	}

	/**
	 * Override to define the action on an incremental task run
	 *
	 * @param {Map.<String, String>} changedFiles Map of changed files and their state (created, changed, deleted)
	 * @return {Promise}
	 */
	doIncrementalTaskRun(changedFiles) {
		if (this.requiresFullBuild()) {
			return this.doFullTaskRun();
		}

		const deletedFiles = this.filterFilesByStatus(changedFiles, 'deleted');
		const deletedPromise = Promise.all(deletedFiles.map(filePath => limit(() => this.handleDeletedFile(filePath))));

		const updatedFiles = this.filterFilesByStatus(changedFiles, [ 'created', 'changed' ]);
		const updatedPromise = Promise.all(updatedFiles.map(filePath => limit(() => this.processFile(filePath))));

		return Promise.all([ deletedPromise, updatedPromise ]);
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
		return this.copyResourceHook(info.src, info.dest);
	}

	/**
	 * Creates the hooks that are required during file processing.
	 */
	createHooks() {
		// FIXME: Can we symlink nearly everything?
		this.copyResourceHook = promisify(this.builder.cli.createHook(`build.${this.platform}.copyResource`, this.builder, fs.copy));
	}
}

module.exports = CopyResourcesTask;
