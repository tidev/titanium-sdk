/**
 * @overview
 * Hook that makes sure the Titanium Xcode file templates get installed.
 *
 * @copyright
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

var path = require('path');

exports.cliVersion = '>=3.2';

/**
 * Main entry point for our plugin which looks for the platform specific
 * plugin to invoke.
 *
 * @param {Object} logger The logger instance.
 * @param {Object} _config The hook config.
 * @param {Object} cli The Titanium CLI instance.
 * @param {Object} appc The Appcelerator CLI instance.
 */
exports.init = function (logger, _config, cli, appc) {
	cli.on('create.post.module', function () {
		var __ = appc.i18n(__dirname).__;

		logger.info(__('Installing Titanium Xcode templates (Swift), if needed'));

		appc.fs.nonDestructiveCopyDirSyncRecursive(
			path.join(__dirname, '..', 'Xcode Templates'),
			appc.fs.resolvePath('~/Library/Developer/Xcode/Templates/Application/File Templates/Appcelerator-Swift'),
			{ logger: logger.debug }
		);
	});
};
