/**
 * @overview
 * Logic for creating new Titanium apps.
 *
 * @copyright
 * Copyright TiDev, Inc. 04/07/2022-Present
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import { BaseAppCreator } from './base_app.js';
import { execSync } from 'node:child_process';

/**
 * Creates application projects.
 *
 * @module lib/creators/app
 */
export class AppCreator extends BaseAppCreator {
	/**
	 * Constructs the app creator.
	 * @class
	 * @classdesc Creates an app project.
	 * @constructor
	 * @param {Object} logger - The logger instance
	 * @param {Object} config - The CLI config
	 * @param {Object} cli - The CLI instance
	 */
	constructor(logger, config, cli) { // eslint-disable-line no-unused-vars
		super(logger, config, cli, {
			title: 'Titanium App (Alloy)',
			titleOrder: 2,
			type: 'alloy'
		});
	}

	init() {
		// check if alloy is installed
		try {
			execSync('alloy --version');
		} catch (err) {
			throw new Error('Alloy is not installed');
		}
		return super.init();
	}
}

export default AppCreator;
