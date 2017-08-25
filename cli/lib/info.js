/*
 * info.js: Titanium Mobile General SDK-Level "info" command module.
 *
 * Copyright (c) 2014-2017, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

'use strict';

const appc = require('node-appc'),
	fs = require('fs'),
	path = require('path'),
	genymotion = require('node-titanium-sdk/lib/emulators/genymotion'),
	__ = appc.i18n(__dirname).__;

exports.name = 'miscinfo';

exports.title = 'Misc Info';

exports.detect = function (types, config, callback) {
	const results = this.data = {},
		tisdk = path.basename((function scan(dir) {
			const file = path.join(dir, 'manifest.json');
			if (fs.existsSync(file)) {
				return dir;
			}
			dir = path.dirname(dir);
			return dir !== '/' && scan(dir);
		}(__dirname)));

	appc.async.parallel(this, [
		function (next) {
			genymotion.detect(config, null, function (err, genymotionInfo) {
				if (err) {
					return next(err);
				}

				genymotionInfo.tisdk = tisdk;
				results.genymotion = genymotionInfo;

				if (genymotionInfo.issues.length) {
					this.issues = this.issues.concat(genymotionInfo.issues);
				}

				next();
			}.bind(this));
		}
	], function (err) {
		callback(err, results);
	});
};

exports.render = function (logger, config, rpad, styleHeading, styleValue) {
	const data = this.data;
	if (!data) {
		return;
	}

	logger.log(styleHeading(__('Genymotion')) + '\n'
		+ '  ' + rpad(__('Path'))                  + ' = ' + styleValue(data.genymotion.path || __('not found')) + '\n'
		+ '  ' + rpad(__('Genymotion Executable')) + ' = ' + styleValue(data.genymotion.executables && data.genymotion.executables.genymotion || __('not found')) + '\n'
		+ '  ' + rpad(__('Genymotion Player'))     + ' = ' + styleValue(data.genymotion.executables && data.genymotion.executables.player || __('not found')) + '\n'
		+ '  ' + rpad(__('Home'))                  + ' = ' + styleValue(data.genymotion.home || __('not found')) + '\n'
	);

	logger.log(styleHeading(__('VirtualBox')) + '\n'
		+ '  ' + rpad(__('Executable')) + ' = ' + styleValue(data.genymotion.executables && data.genymotion.executables.vboxmanage || __('not found')) + '\n'
		+ '  ' + rpad(__('Version'))    + ' = ' + styleValue(data.genymotion.virtualbox || __('unknown')) + '\n'
	);
};
