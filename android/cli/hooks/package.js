/*
 * package.js: Titanium iOS CLI package hook
 *
 * Copyright (c) 2012-2017, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

'use strict';

const appc = require('node-appc'),
	fs = require('fs-extra'),
	path = require('path'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {

	cli.on('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			// Do not continue if this is not a "production" build.
			if (builder.target !== 'dist-playstore') {
				return finished();
			}

			// Do not continue if developer did not provide a destination directory.
			const outputDir = builder.outputDir;
			if (!outputDir) {
				logger.error(__('Packaging output directory path cannot be empty.'));
				return finished();
			}

			// Create the destination directory.
			fs.ensureDirSync(outputDir);

			// Copy built APK to destination, if available.
			if (builder.apkFile && fs.existsSync(builder.apkFile)) {
				const outputFilePath = path.join(outputDir, builder.tiapp.name + '.apk');
				if (fs.existsSync(outputFilePath)) {
					fs.unlinkSync(outputFilePath);
				}
				appc.fs.copyFileSync(builder.apkFile, outputFilePath, { logger: logger.debug });
			}

			// Copy built app-bundle to destination, if available.
			if (builder.aabFile && fs.existsSync(builder.aabFile)) {
				const outputFilePath = path.join(outputDir, builder.tiapp.name + '.aab');
				if (fs.existsSync(outputFilePath)) {
					fs.unlinkSync(outputFilePath);
				}
				appc.fs.copyFileSync(builder.aabFile, outputFilePath, { logger: logger.debug });
			}

			logger.info(__('Packaging complete'));
			logger.info(__('Package location: %s', outputDir.cyan));

			finished();
		}
	});

};
