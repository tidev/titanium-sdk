/**
* Android module clean command.
*
* @module cli/_cleanModule
*
* @copyright
* Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
*
* @license
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/

'use strict';

const appc = require('node-appc');
const fs = require('fs-extra');
const GradleWrapper = require('../lib/gradle-wrapper');
const path = require('path');
const __ = appc.i18n(__dirname).__;

exports.run = async function run(logger, config, cli, finished) {
	const projectDir = cli.argv['project-dir'];

	// Run the gradle "clean" task if possible.
	// This makes the gradle daemon release its file locks so that they can be deleted on Windows.
	try {
		const gradlew = new GradleWrapper(path.join(projectDir, 'build'));
		gradlew.logger = logger;
		if (await gradlew.hasWrapperFiles()) {
			await gradlew.clean();
		}
	} catch (err) {
		this.logger.error(`Failed to run gradle "clean" task. Reason:\n${err}`);
	}

	const toDelete = [ 'build', 'dist', 'java-sources.txt' ];
	toDelete.forEach(f => {
		const target = path.join(projectDir, f);
		if (appc.fs.exists(target)) {
			logger.debug(__('Deleting %s', target.cyan));
			fs.removeSync(target);
		} else {
			logger.debug(__('File does not exist %s', target.cyan));
		}
	});

	// remove only the libraries we generate
	const libsDir = path.join(projectDir, 'libs');
	if (appc.fs.exists(libsDir)) {
		const moduleid = cli.manifest.moduleid;
		const arches = fs.readdirSync(libsDir);
		arches.forEach(arch => {
			const target = path.join(projectDir, 'libs', arch, `lib${moduleid}.so`);
			if (appc.fs.exists(target)) {
				logger.debug(__('Deleting %s', target.cyan));
				fs.removeSync(target);
			} else {
				logger.debug(__('File does not exist %s', target.cyan));
			}
		});
	}

	finished();
};
