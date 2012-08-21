/*
 * _create.js: Titanium Mobile Web CLI create command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

module.exports = function (logger, projectDir, templateName) {
	var path = require('path'),
		templatePath = path.join(path.dirname(module.filename), '..', '..', 'templates', templateName);
	require('wrench').copyDirSyncRecursive(templatePath, projectDir, { preserve: true });
};