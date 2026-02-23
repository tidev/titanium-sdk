/* eslint-disable security/detect-non-literal-regexp */
/*
 * run.js: Titanium iOS CLI run hook
 *
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * See the LICENSE file for more information.
 */

import { launchOnSimulatorOrMac } from '../lib/simulator-launcher.js';

export const cliVersion = '>=3.2';

export function init(logger, config, cli) {
	cli.addHook('build.post.compile', {
		priority: 10000,
		async post(builder, finished) {
			await launchOnSimulatorOrMac({
				logger,
				config,
				cli,
				builder,
				finished
			});
		}
	});
}
