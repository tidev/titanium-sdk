/*
 * hot-reload.js: Titanium Android hot reload hook
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import ADB from 'node-titanium-sdk/lib/adb.js';
import { execFile } from 'node:child_process';
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

			const server = new HotReloadServer({
				projectDir: builder.projectDir,
				platform: 'android',
				token: builder.hotReload.token,
				port: builder.hotReload.port,
				logger
			});

			server.start().then(() => {
				process.on('exit', () => server.stop());
				if (builder.target !== 'device') {
					return finished();
				}

				// Forward the port from each device to this machine, so that the app can use 127.0.0.1.
				const adbPath = builder.androidInfo.sdk.executables.adb;
				const port = `tcp:${builder.hotReload.port}`;
				new ADB(config).devices((err, devices) => {
					const ids = (!err && devices || []).filter(device => !device.emulator).map(device => device.id);
					let remaining = ids.length;
					if (!remaining) {
						logger.warn('[HotReload] Found no device for "adb reverse"');
						return finished();
					}
					for (const id of ids) {
						execFile(adbPath, [ '-s', id, 'reverse', port, port ], reverseErr => {
							if (reverseErr) {
								logger.warn(`[HotReload] "adb reverse" failed for ${id}: ${reverseErr.message.trim()}`);
							}
							if (--remaining === 0) {
								finished();
							}
						});
					}
				});
			}).catch(err => {
				logger.error(`[HotReload] Cannot start the server: ${err.message}`);
				finished();
			});
		}
	});
}
