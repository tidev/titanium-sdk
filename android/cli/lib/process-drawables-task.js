const path = require('path');
const CopyResourcesTask = require('../../../cli/lib/tasks/copy-resources-task');

const appc = require('node-appc');
const i18n = appc.i18n(__dirname);
const __ = i18n.__;

const drawableDpiRegExp = /^(high|medium|low)$/;

/**
 * Task that copies Android drawables into the app.
 */
class ProcessDrawablesTask extends CopyResourcesTask {

	/**
	 * Constructs a new processing task.
	 *
	 * @param {Object} options Configuration object for this task.
	 * @param {String} [options.name='process-drawables'] Name for the task.
	 * @param {String} options.incrementalDirectory Path to a folder where incremental task data will be stored.
	 * @param {Map<string,FileInfo>} options.files Map of input files to file info
	 * @param {Object} [options.logger] The logger instance used by this task.
	 * @param {Object} options.builder Builder instance.
	 */
	constructor(options) {
		options.name = options.name || 'process-drawables';
		const builder = options.builder;
		const logger = builder.logger;
		const appMainResDir = builder.buildAppMainResDir;

		// We have to modify the destination paths for each file. Is there a place we can move this to other than constructor?
		// Because we want the expected final filename for whenever the incremental task stuff needs it
		options.files.forEach((info, relPath) => {
			const parts = relPath.split(path.sep);
			const origFoldername = parts[1];
			const foldername = drawableDpiRegExp.test(origFoldername) ? 'drawable-' + origFoldername[0] + 'dpi' : 'drawable-' + origFoldername.substring(4);

			let base = info.name;
			// We have a drawable image file. (Rename it if it contains invalid characters.)
			const warningMessages = [];
			if (parts.length > 3) {
				warningMessages.push(__('- Files cannot be put into subdirectories.'));
				// retain subdirs under the res-<dpi> folder to be mangled into the destination filename
				// i.e. take images/res-mdpi/logos/app.png and store logos/app, which below will become logos_app.png
				base = parts.slice(2, parts.length - 1).join(path.sep) + path.sep + base;
			}
			const destFilename = `${base}.${info.ext}`;
			// basename may have .9 suffix, if so, we do not want to convert that .9 to _9
			let destFilteredFilename = `${base.toLowerCase().replace(/(?!\.9$)[^a-z0-9_]/g, '_')}.${info.ext}`;
			if (destFilteredFilename !== destFilename) {
				warningMessages.push(__('- Names must contain only lowercase a-z, 0-9, or underscore.'));
			}
			if (/^\d/.test(destFilteredFilename)) {
				warningMessages.push(__('- Names cannot start with a number.'));
				destFilteredFilename = `_${destFilteredFilename}`;
			}
			if (warningMessages.length > 0) {
				// relPath here is relative the the folder we searched, NOT the project dir, so make full path relative to project dir for log
				logger.warn(__(`Invalid "res" file: ${path.relative(builder.projectDir, info.src)}`));
				for (const nextMessage of warningMessages) {
					logger.warn(nextMessage);
				}
				logger.warn(__(`- Titanium will rename to: ${destFilteredFilename}`));
			}
			info.dest = path.join(appMainResDir, foldername, destFilteredFilename);
		});
		super(options);
	}
}

module.exports = ProcessDrawablesTask;
