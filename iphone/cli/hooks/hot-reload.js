/*
 * hot-reload.js: Titanium iOS hot reload hook
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import jsanalyze from 'node-titanium-sdk/lib/jsanalyze.js';
import fs from 'node:fs';
import path from 'node:path';
import { HotReloadServer } from '../../../cli/lib/hot-reload/server.js';

export const cliVersion = '>=3.2';

export function init(logger, config, cli) {
	cli.on('build.post.compile', {
		// Runs before the hook in "run.js" that installs and starts the app.
		priority: 9000,
		post: function (builder, finished) {
			if (!builder.hotReload || builder.buildOnly) {
				return finished();
			}

			// The build transpiles each JS file, for example it turns "import" into "require()".
			// The app cannot load the raw source, so apply the same transform to a changed file.
			// Webpack output is final, and the build copies it as it is.
			const analyzeOptions = builder.hotReloadAnalyzeOptions;
			const rawJsFiles = builder.hotReloadRawJsFiles || new Set();
			const transform = (runtimePath, file, content) => {
				if (!analyzeOptions || builder.useWebpack || !/\.c?js$/i.test(runtimePath) || rawJsFiles.has(runtimePath)) {
					return content;
				}
				const options = Object.assign({}, analyzeOptions, { filename: file });
				return Buffer.from(jsanalyze.analyzeJs(content.toString(), options).contents);
			};

			// The require() function of the app finds only the files that this index of the build lists.
			let baseIndex = null;
			try {
				baseIndex = JSON.parse(fs.readFileSync(path.join(builder.xcodeAppDir, '_index_.json'), 'utf8'));
			} catch (err) {
				logger.warn(`[HotReload] Cannot read the require index, require() will not find new files: ${err.message}`);
			}

			const server = new HotReloadServer({
				projectDir: builder.projectDir,
				platform: 'ios',
				// The build copies "Resources/iphone" first and then "Resources/ios".
				platformDirs: [ 'iphone', 'ios' ],
				token: builder.hotReload.token,
				port: builder.hotReload.port,
				transform,
				baseIndex,
				logger
			});

			server.start().then(() => {
				process.on('exit', () => server.stop());
				finished();
			}).catch(err => {
				logger.error(`[HotReload] Cannot start the server: ${err.message}`);
				finished();
			});
		}
	});
}
