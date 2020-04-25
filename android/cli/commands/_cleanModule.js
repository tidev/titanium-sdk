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
const path = require('path');
const fs = require('fs-extra');
const appc = require('node-appc');
const __ = appc.i18n(__dirname).__;

exports.run = function run(logger, config, cli, finished) {
	const projectDir = cli.argv['project-dir'];

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
