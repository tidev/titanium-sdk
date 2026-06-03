/*
 * install.js: Titanium iOS CLI install hook
 *
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * See the LICENSE file for more information.
 */

import { installOnDevice } from '../lib/device-installer.js';

export const cliVersion = '>=3.2';

export function init(logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 8000,
		post: function (builder, finished) {
			return installOnDevice({
				logger,
				cli,
				builder,
				finished
			});
		}
	});
}
