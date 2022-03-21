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
	try {
		const projectDir = cli.argv['project-dir'];

		// On Windows, stop gradle daemon to make it release its file locks so that they can be deleted.
		if (process.platform === 'win32') {
			try {
				const gradlew = new GradleWrapper(path.join(projectDir, 'build'));
				gradlew.logger = logger;
				if (await gradlew.hasWrapperFiles()) {
					logger.debug('Stopping gradle daemon.');
					await gradlew.stopDaemon();
				}
			} catch (err) {
				logger.error(`Failed to stop gradle daemon. Reason:\n${err}`);
			}
		}

		const buildDir = path.join(projectDir, 'build');
		for (const file of await fs.readdir(buildDir)) {
			if (file === 'clean_android.log') {
				continue;
			}
			const filePath = path.join(buildDir, file);
			logger.debug(__('Deleting %s', filePath.cyan));
			await fs.remove(filePath);
		}

		// Delete the following files and directory trees.
		const fileNames = [ 'dist', 'java-sources.txt' ];
		for (const nextFileName of fileNames) {
			const nextFilePath = path.join(projectDir, nextFileName);
			if (await fs.exists(nextFilePath)) {
				logger.debug(__('Deleting %s', nextFilePath.cyan));
				await fs.remove(nextFilePath);
			}
		}

		// Delete this module's last built "*.so" libraries from "libs" directory.
		// Do not delete all files from "libs". Some modules put 3rd party "*.so" library dependencies there.
		// Note: As of Titanium 9.0.0, "*.so" files are not built here anymore. This is legacy behavior.
		const libsDirPath = path.join(projectDir, 'libs');
		if (await fs.exists(libsDirPath)) {
			const libFileName = `lib${cli.manifest.moduleid}.so`;
			for (const architectureFolderName of await fs.readdir(libsDirPath)) {
				const libFilePath = path.join(libsDirPath, architectureFolderName, libFileName);
				if (await fs.exists(libFilePath)) {
					logger.debug(__('Deleting %s', libFilePath.cyan));
					await fs.remove(libFilePath);
				}
			}
		}
	} catch (err) {
		finished(err);
	}

	finished();
};
