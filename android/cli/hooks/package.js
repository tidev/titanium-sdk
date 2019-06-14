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
			if (builder.target !== 'dist-playstore') {
				return finished();
			}

			let dest = builder.apkFile;
			if (!dest || !fs.existsSync(dest)) {
				logger.error(__('No APK file to deploy, skipping'));
				return finished();
			}

			const outputDir = builder.outputDir;
			if (outputDir && outputDir != path.dirname(dest)) { // eslint-disable-line eqeqeq
				fs.ensureDirSync(outputDir);
				dest = path.join(outputDir, path.basename(dest));
				fs.existsSync(dest) && fs.unlinkSync(dest);
				appc.fs.copyFileSync(builder.apkFile, dest, { logger: logger.debug });
			}

			logger.info(__('Packaging complete'));
			logger.info(__('Package location: %s', dest.cyan));

			finished();
		}
	});

};
