/*
 * run.js: Titanium Android run hook
 *
 * Copyright TiDev, Inc. 04/07/2022-Present  All Rights Reserved.
 * See the LICENSE file for more information.
 */

import { createAndroidLauncher } from '../lib/launcher.js';

export const cliVersion = '>=3.2';

export function init(logger, config, cli) {
	const launcher = createAndroidLauncher({ logger, config, cli });

	cli.on('build.pre.compile', {
		priority: 8000,
		post: launcher.preCompile
	});

	cli.on('build.post.compile', {
		priority: 10000,
		post: launcher.postCompile
	});
}
