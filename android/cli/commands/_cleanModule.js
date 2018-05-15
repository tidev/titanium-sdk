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

// TODO Do we need a validate function?

exports.run = function run(logger, config, cli, finished) {
	const projectDir = cli.argv['project-dir'];

	const toDelete = [ 'build', 'dist', 'libs', 'java-sources.txt' ];
	toDelete.forEach((f) => {
		const target = path.join(projectDir, f);
		if (appc.fs.exists(target)) {
			logger.debug(__('Deleting %s', target.cyan));
			fs.removeSync(target);
		} else {
			logger.debug(__('File does not exist %s', target.cyan));
		}
	});

	finished();
};
