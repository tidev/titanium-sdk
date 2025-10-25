import { IncrementalFileTask } from 'appc-tasks';
import fs from 'fs-extra';
import path from 'node:path';
import pLimit from 'p-limit';

const MAX_SIMULTANEOUS_FILES = 256;
const limit = pLimit(MAX_SIMULTANEOUS_FILES);

/**
 * Task that copies "plain" input files to a destination.
 */
export class CopyResourcesTask extends IncrementalFileTask {

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
		if (this.platform === 'ios') {
			this.forceCleanBuildPropertyName = 'forceCleanBuild';
			this.symlinkFiles = this.builder.symlinkFilesOnCopy; // NOTE: That this is always false!
			// We also would check this regexp below, but since symlinking was always false, it was useless to do that
			// const unsymlinkableFileRegExp = /^Default.*\.png|.+\.(otf|ttf)$/;
		} else {
			this.forceCleanBuildPropertyName = 'forceRebuild';
			this.symlinkFiles = process.platform !== 'win32' && this.builder.config.get('android.symlinkResources', true);
		}
	}

	/**
	 * Function that will be called after the task run finished.
	 *
	 * Used to tell iOS build not to wipe our incremental state files
	 */
	async afterTaskAction() {
		await super.afterTaskAction();
		// don't let iOS build delete our incremental state files!
		this.builder.unmarkBuildDirFiles(this.incrementalDirectory);
		// don't let iOS build delete any of the output files
		this.files.forEach((info, _file) => this.builder.unmarkBuildDirFile(info.dest));
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
		// Either we need to track the src -> dest map ourselves, or appc-tasks needs to supply the last output state so we can find the matching file somehow
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
		// NOTE: That we used to fire a build.platform.copyResource for each file
		// - but that ultimately iOS never did fire it
		// - we don't use it for hyperloop anymore so no need for Android to do so
		return this.copyFile(info);
	}

	/**
	 * Note that this is a heavily modified async rewrite of Builder.copyFileSync from node-titanium-sdk!
	 * @param {FileInfo} info information about the file being copied
	 */
	async copyFile(info) {
		const dest = info.dest;
		const src = info.src;

		// iOS specific logic here!
		if (this.platform === 'ios' && this.builder.useAppThinning && info.isImage && !this.builder.forceRebuild) {
			this.logger.info('Forcing rebuild: image was updated, recompiling asset catalog');
			this.builder.forceRebuild = true;
		}

		const exists = await fs.exists(dest);
		if (!exists) {
			const parent = path.dirname(dest);
			await fs.ensureDir(parent);
		}

		// copy files
		if (!this.symlinkFiles) {
			if (exists) {
				this.logger.debug(`Overwriting ${src.cyan} => ${dest.cyan}`);
				await fs.unlink(dest);
			} else {
				this.logger.debug(`Copying ${src.cyan} => ${dest.cyan}`);
			}
			return fs.copyFile(src, dest);
		}

		// Try to symlink files!
		// destination doesn't exist or symbolic link isn't pointing at src
		if (!exists) {
			this.logger.debug(`Symlinking ${src.cyan} => ${dest.cyan}`);
			return fs.symlink(src, dest);
		}

		const symlinkOutdated = (await fs.realpath(dest)) !== src;
		// I don't think we need to check if it's a symbolic link first, do we?
		// const symlinkOutdated = (fs.lstatSync(dest).isSymbolicLink() && fs.realpathSync(dest) !== src);
		if (symlinkOutdated) {
			await fs.unlink(dest);
			this.logger.debug(`Symlinking ${src.cyan} => ${dest.cyan}`);
			return fs.symlink(src, dest);
		}
	}
}
