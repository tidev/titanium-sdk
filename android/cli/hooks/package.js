/*
 * package.js: Titanium iOS CLI package hook
 *
 * Copyright (c) 2012-2013, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

exports.cliVersion = '>=3.2';

exports.init = function (logger, config, cli) {

	cli.on('build.post.compile', {
		priority: 10000,
		post: function (builder, finished) {
			if (builder.target != 'dist-playstore') return finished();

			var dest = builder.apkFile,
				outputDir = builder.outputDir;

			if (!dest || !fs.existsSync(dest)) {
				logger.error(__('No APK file to deploy, skipping'));
				return finished();
			}

			if (outputDir && outputDir != path.dirname(dest)) {
				fs.existsSync(outputDir) || wrench.mkdirSyncRecursive(outputDir);
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
