/**
* iOS module clean command.
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
	// Determine the name of the generate module assets file
	const moduleId = cli.manifest.moduleid;
	const moduleIdAsIdentifier = moduleId
		.replace(/[\s-]/g, '_')
		.replace(/_+/g, '_')
		.split(/\./)
		.map(function (s) {
			return s.substring(0, 1).toUpperCase() + s.substring(1);
		}).join('');
	const moduleAssetsFile = path.join('Classes', moduleIdAsIdentifier + 'ModuleAssets.m');

	// Guess the generated zipfile name!
	// TODO: Use a glob and delete any version zipfile generated?
	const moduleVersion = cli.manifest.version;
	const moduleZipName = [ moduleId, '-iphone-', moduleVersion, '.zip' ].join('');
	const toDelete = [ 'build', moduleAssetsFile, moduleZipName, 'metadata.json' ];
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
