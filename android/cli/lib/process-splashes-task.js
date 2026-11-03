import path from 'node:path';
import { CopyResourcesTask } from '../../../cli/lib/tasks/copy-resources-task.js';

const drawableDpiRegExp = /^(high|medium|low)$/;

/**
 * Task that copies Android splash screens into the app.
 */
export class ProcessSplashesTask extends CopyResourcesTask {

	/**
	 * Constructs a new processing task.
	 *
	 * @param {Object} options Configuration object for this task.
	 * @param {String} [options.name='process-splashes'] Name for the task.
	 * @param {String} options.incrementalDirectory Path to a folder where incremental task data will be stored.
	 * @param {Map<string,FileInfo>} options.files Map of input files to file info
	 * @param {Object} [options.logger] The logger instance used by this task.
	 * @param {Object} options.builder Builder instance.
	 */
	constructor(options) {
		options.name = options.name || 'process-splashes';
		const appMainResDir = options.builder.buildAppMainResDir;

		options.files.forEach((info, relPath) => {
			let destDir;
			const parts = relPath.split(path.sep);
			if (parts.length >= 3) {
				// resolution specific splash goes in res/drawable-<res>
				const origFoldername = parts[1];
				const foldername = drawableDpiRegExp.test(origFoldername) ? 'drawable-' + origFoldername[0] + 'dpi' : 'drawable-' + origFoldername.substring(4);
				destDir = path.join(appMainResDir, foldername);
			// assume not under images/<res>, but instead root?
			} else if (info.name === 'default.9') {
				// 9-patch splash screen goes in res/drawable-nodpi
				destDir = path.join(appMainResDir, 'drawable-nodpi');
			} else { // root splash goes in res/drawable
				destDir = path.join(appMainResDir, 'drawable');
			}

			info.dest = path.join(destDir, `${info.name.replace('default', 'background')}.${info.ext}`);
		});
		super(options);
	}
}
